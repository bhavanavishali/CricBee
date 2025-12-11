import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, Trophy } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import { getScoreboard, updateScore, startMatch, endInnings } from '@/api/organizer/matchScore';

const LiveScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState(null);
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [wicketData, setWicketData] = useState({
    wicket_type: '',
    dismissed_batsman_id: null
  });
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadScoreboard();
    
    // Start polling if match is live
    if (isLive && !isPaused) {
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [matchId, isLive, isPaused]);

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      loadScoreboard();
    }, 3000); // Poll every 3 seconds
  };

  const loadScoreboard = async () => {
    try {
      const data = await getScoreboard(matchId);
      setScoreboard(data);
      setIsLive(data.match_status === 'live');
      
      if (!data.batting_score && data.match_status !== 'live' && data.toss_info) {
        // Match has toss but not started - offer to start
      }
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    try {
      setUpdating(true);
      await startMatch(matchId);
      setIsLive(true);
      loadScoreboard();
    } catch (error) {
      console.error('Failed to start match:', error);
      alert(error.response?.data?.detail || 'Failed to start match');
    } finally {
      setUpdating(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    } else {
      startPolling();
    }
  };

  const handleStopMatch = async () => {
    if (!window.confirm('Are you sure you want to stop and announce the match?')) {
      return;
    }
    try {
      setUpdating(true);
      await endInnings(matchId);
      setIsLive(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      loadScoreboard();
    } catch (error) {
      console.error('Failed to stop match:', error);
      alert(error.response?.data?.detail || 'Failed to stop match');
    } finally {
      setUpdating(false);
    }
  };

  const handleScoreUpdate = async () => {
    if (!scoreboard || !scoreboard.batting_score) return;
    if (!selectedRuns && !selectedExtras && !showWicketDialog) {
      alert('Please select runs or extras');
      return;
    }

    if (showWicketDialog && !wicketData.wicket_type) {
      alert('Please select wicket type');
      return;
    }

    try {
      setUpdating(true);
      
      const scoreData = {
        runs: selectedRuns || 0,
        is_wicket: showWicketDialog,
        wicket_type: showWicketDialog ? wicketData.wicket_type : null,
        dismissed_batsman_id: showWicketDialog ? wicketData.dismissed_batsman_id : null,
        is_wide: selectedExtras === 'wide',
        is_no_ball: selectedExtras === 'no_ball',
        is_bye: selectedExtras === 'bye',
        is_leg_bye: selectedExtras === 'leg_bye',
        is_four: selectedRuns === 4,
        is_six: selectedRuns === 6,
        batsman_id: scoreboard.current_batsman_id || scoreboard.player_stats.find(p => p.team_id === scoreboard.batting_team_id && !p.is_out)?.player_id,
        bowler_id: scoreboard.current_bowler_id || scoreboard.player_stats.find(p => p.team_id === scoreboard.bowling_team_id && p.is_bowling)?.player_id
      };

      await updateScore(matchId, scoreData);
      
      // Reset selections
      setSelectedRuns(null);
      setSelectedExtras(null);
      setShowWicketDialog(false);
      setWicketData({ wicket_type: '', dismissed_batsman_id: null });
      
      // Reload scoreboard
      loadScoreboard();
    } catch (error) {
      console.error('Failed to update score:', error);
      alert(error.response?.data?.detail || 'Failed to update score');
    } finally {
      setUpdating(false);
    }
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    alert('Undo functionality coming soon');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!scoreboard) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Scoreboard not found</div>
        </div>
      </Layout>
    );
  }

  const battingScore = scoreboard.batting_score;
  const bowlingScore = scoreboard.bowling_score;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
              >
                ← Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Live Scoring</h1>
            </div>
            <div className="flex gap-2">
              {isLive && (
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2">
                  • LIVE
                </span>
              )}
              {isLive && (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-700"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
              {isLive && (
                <button
                  onClick={handleStopMatch}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700"
                >
                  <Square className="w-4 h-4" />
                  STOP & ANNOUNCE
                </button>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {scoreboard.batting_team_name} vs {scoreboard.bowling_team_name}
            </div>
            <div className="text-gray-600 mb-2">
              {scoreboard.toss_info && (
                <div>
                  Toss: {scoreboard.toss_info.toss_winner_name} won and chose to {scoreboard.toss_info.toss_decision}
                </div>
              )}
            </div>
            {!isLive && scoreboard.toss_info && !battingScore && (
              <button
                onClick={handleStartMatch}
                disabled={updating}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                {updating ? 'Starting...' : 'Start Match'}
              </button>
            )}
          </div>

          {/* Current Score */}
          {battingScore && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {battingScore.runs}/{battingScore.wickets} ({battingScore.overs} overs)
              </div>
              <div className="text-lg text-gray-600 mb-4">
                Run Rate: {battingScore.run_rate?.toFixed(2) || '0.00'}
              </div>

              {/* Current Batsmen and Bowler */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Striker</div>
                  <div className="font-semibold">
                    {scoreboard.current_batsman_name || 'N/A'} {battingScore.runs}* ({battingScore.balls} balls)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Non-striker</div>
                  <div className="font-semibold">
                    {scoreboard.current_non_striker_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Bowler</div>
                  <div className="font-semibold">
                    {scoreboard.current_bowler_name || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Last 6 Balls */}
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Last 6 Balls</div>
                <div className="flex gap-2">
                  {scoreboard.last_6_balls.map((ball, idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        ball.is_wicket
                          ? 'bg-red-500 text-white'
                          : ball.runs === 4
                          ? 'bg-blue-500 text-white'
                          : ball.runs === 6
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {ball.is_wicket ? 'W' : ball.runs}
                    </div>
                  ))}
                  {Array.from({ length: 6 - scoreboard.last_6_balls.length }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                    >
                      -
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {battingScore && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Boundaries</div>
                  <div className="font-semibold">
                    {battingScore.fours} (4s) + {battingScore.sixes} (6s)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Extras</div>
                  <div className="font-semibold">{battingScore.extras}</div>
                </div>
              </div>
            </div>
          )}

          {/* Score Input (Organizer Only) */}
          {isLive && battingScore && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Update Score</h3>
              
              {/* Runs */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Runs</div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 6].map((runs) => (
                    <button
                      key={runs}
                      onClick={() => {
                        setSelectedRuns(runs);
                        setSelectedExtras(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        selectedRuns === runs
                          ? runs === 4
                          ? 'bg-blue-600 text-white'
                          : runs === 6
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Extras</div>
                <div className="flex gap-2">
                  {['wide', 'no_ball', 'bye', 'leg_bye'].map((extra) => (
                    <button
                      key={extra}
                      onClick={() => {
                        setSelectedExtras(extra);
                        setSelectedRuns(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        selectedExtras === extra
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {extra.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wicket */}
              <div className="mb-4">
                <button
                  onClick={() => setShowWicketDialog(!showWicketDialog)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    showWicketDialog
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ▲ Wicket
                </button>
                {showWicketDialog && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <select
                      value={wicketData.wicket_type}
                      onChange={(e) => setWicketData({ ...wicketData, wicket_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    >
                      <option value="">Select wicket type</option>
                      <option value="bowled">Bowled</option>
                      <option value="caught">Caught</option>
                      <option value="lbw">LBW</option>
                      <option value="run_out">Run Out</option>
                      <option value="stumped">Stumped</option>
                      <option value="hit_wicket">Hit Wicket</option>
                    </select>
                    <select
                      value={wicketData.dismissed_batsman_id || ''}
                      onChange={(e) => setWicketData({ ...wicketData, dismissed_batsman_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select dismissed batsman</option>
                      {scoreboard.player_stats
                        .filter(p => p.team_id === scoreboard.batting_team_id && !p.is_out)
                        .map((player) => (
                          <option key={player.player_id} value={player.player_id}>
                            {player.player_name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleScoreUpdate}
                  disabled={updating || (!selectedRuns && !selectedExtras && !showWicketDialog)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {updating ? 'Updating...' : 'Update Score'}
                </button>
                <button
                  onClick={handleUndo}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleStopMatch}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
                >
                  End Innings
                </button>
              </div>
            </div>
          )}

          {/* Scorecard Tab */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Batting Scorecard</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Batsman</th>
                    <th className="text-right p-2">R</th>
                    <th className="text-right p-2">B</th>
                    <th className="text-right p-2">4s</th>
                    <th className="text-right p-2">6s</th>
                    <th className="text-right p-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.player_stats
                    .filter(p => p.team_id === scoreboard.batting_team_id && p.is_batting)
                    .map((player) => (
                      <tr key={player.id} className="border-b">
                        <td className="p-2">
                          {player.player_name}
                          {!player.is_out && player.balls_faced > 0 && '*'}
                        </td>
                        <td className="text-right p-2">{player.runs}</td>
                        <td className="text-right p-2">{player.balls_faced}</td>
                        <td className="text-right p-2">{player.fours}</td>
                        <td className="text-right p-2">{player.sixes}</td>
                        <td className="text-right p-2">
                          {player.strike_rate?.toFixed(1) || '0.0'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveScoring;





