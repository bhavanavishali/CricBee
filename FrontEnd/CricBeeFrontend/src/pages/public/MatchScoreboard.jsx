import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getPublicScoreboard } from '@/api/public';
import Swal from 'sweetalert2';

const MatchScoreboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadScoreboard();
    
    // Poll for live updates if match is live
    if (scoreboard?.match_status === 'live') {
      pollingIntervalRef.current = setInterval(() => {
        loadScoreboard();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [id, scoreboard?.match_status]);

  const loadScoreboard = async () => {
    try {
      const data = await getPublicScoreboard(id);
      setScoreboard(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
      setLoading(false);
    }
  };

  const formatOvers = (overs) => {
    if (!overs) return '0.0';
    const overParts = overs.toString().split('.');
    return `${overParts[0]}.${overParts[1] || 0}`;
  };

  const formatDecimal = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0.' + '0'.repeat(decimals);
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0.' + '0'.repeat(decimals);
    return num.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading scoreboard...</p>
        </div>
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Match not found</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const battingScore = scoreboard.batting_score;
  const isLive = scoreboard.match_status === 'live';
  const isCompleted = scoreboard.match_status === 'completed';

  // Get player stats
  const getPlayerStats = (playerId) => {
    return scoreboard.player_stats?.find(p => p.player_id === playerId);
  };

  const strikerStats = scoreboard.current_batsman_id 
    ? getPlayerStats(scoreboard.current_batsman_id)
    : null;
  const nonStrikerStats = scoreboard.current_non_striker_id
    ? getPlayerStats(scoreboard.current_non_striker_id)
    : null;
  const bowlerStats = scoreboard.current_bowler_id
    ? getPlayerStats(scoreboard.current_bowler_id)
    : null;

  // Get fall of wickets
  const wickets = scoreboard.all_balls?.filter(ball => ball.is_wicket) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Match Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-2xl font-bold">{scoreboard.batting_team_name || 'Team A'}</h2>
                <span className="text-gray-500 text-xl">vs</span>
                <h2 className="text-2xl font-bold">{scoreboard.bowling_team_name || 'Team B'}</h2>
              </div>
              {isLive && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="text-red-600 font-semibold">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toss Summary */}
        {scoreboard.toss_info && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900">
              <span className="font-semibold">{scoreboard.toss_info.toss_winner_name}</span> won the toss and chose to{' '}
              <span className="font-semibold">{scoreboard.toss_info.toss_decision}</span>
            </p>
          </div>
        )}

        {/* Live Scoreboard */}
        {battingScore && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">Batting Team</div>
                <div className="text-2xl font-bold">{scoreboard.batting_team_name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Overs</div>
                <div className="text-2xl font-bold">
                  {formatOvers(battingScore.overs)} / {scoreboard.max_overs || 20}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">Score</div>
                <div className="text-4xl font-bold">
                  {battingScore.runs}/{battingScore.wickets}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Run Rate (CRR)</div>
                <div className="text-3xl font-bold">
                  {formatDecimal(battingScore.run_rate, 2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Batsmen and Bowler */}
        {isLive && battingScore && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Batsmen */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Batsmen</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Striker */}
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Striker</div>
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">ON STRIKE</span>
                  </div>
                  {scoreboard.current_batsman_id && strikerStats ? (
                    <>
                      <div className="font-bold text-lg mb-1">{scoreboard.current_batsman_name}</div>
                      <div className="text-sm text-gray-600">
                        {strikerStats.runs}* ({strikerStats.balls_faced} balls)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        SR: {formatDecimal(strikerStats.strike_rate, 1)} | 
                        4s: {strikerStats.fours} | 6s: {strikerStats.sixes}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-sm">Not selected</div>
                  )}
                </div>

                {/* Non-striker */}
                <div className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">Non-striker</div>
                  {scoreboard.current_non_striker_id && nonStrikerStats ? (
                    <>
                      <div className="font-bold text-lg mb-1">{scoreboard.current_non_striker_name}</div>
                      <div className="text-sm text-gray-600">
                        {nonStrikerStats.runs} ({nonStrikerStats.balls_faced} balls)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        SR: {formatDecimal(nonStrikerStats.strike_rate, 1)} | 
                        4s: {nonStrikerStats.fours} | 6s: {nonStrikerStats.sixes}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-sm">Not selected</div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Bowler */}
            {bowlerStats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Current Bowler</h3>
                <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
                  <div className="font-bold text-lg mb-1">{scoreboard.current_bowler_name}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <div className="text-gray-600">Overs</div>
                      <div className="font-semibold">{formatOvers(bowlerStats.overs_bowled)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Runs</div>
                      <div className="font-semibold">{bowlerStats.runs_conceded}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Wickets</div>
                      <div className="font-semibold">{bowlerStats.wickets_taken}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Economy</div>
                      <div className="font-semibold">{formatDecimal(bowlerStats.economy, 2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fall of Wickets */}
        {wickets.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Fall of Wickets</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2">Wicket</th>
                    <th className="text-left p-2">Batsman</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Over</th>
                    <th className="text-left p-2">Bowler</th>
                    <th className="text-left p-2">How Out</th>
                  </tr>
                </thead>
                <tbody>
                  {wickets.map((wicket, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{wicket.dismissed_batsman_name || 'N/A'}</td>
                      <td className="p-2">
                        {/* Calculate score at wicket - this would need to be calculated from all_balls */}
                        {wicket.runs || 'N/A'}
                      </td>
                      <td className="p-2">
                        {wicket.over_number}.{wicket.ball_number}
                      </td>
                      <td className="p-2">{wicket.bowler_name || 'N/A'}</td>
                      <td className="p-2">{wicket.wicket_type || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Completed Match Summary */}
        {isCompleted && battingScore && (
          <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 mr-2" />
              <h3 className="text-2xl font-bold">Match Completed</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                Final Score: {battingScore.runs}/{battingScore.wickets}
              </div>
              <div className="text-lg opacity-90">
                {scoreboard.batting_team_name} - {formatOvers(battingScore.overs)} overs
              </div>
            </div>
          </div>
        )}

        {/* Ball-by-Ball Timeline */}
        {scoreboard.all_balls && scoreboard.all_balls.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Ball-by-Ball</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scoreboard.all_balls.map((ball, index) => (
                <div 
                  key={index} 
                  className={`border-b border-gray-100 ${
                    ball.commentary ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''
                  }`}
                  onClick={() => {
                    if (ball.commentary) {
                      Swal.fire({
                        title: `Over ${ball.over_number}.${ball.ball_number}`,
                        html: `
                          <div class="text-left">
                            <p class="text-gray-700 mb-2">
                              <strong>${ball.batsman_name}</strong> b <strong>${ball.bowler_name}</strong>
                            </p>
                            <p class="text-gray-600 mb-3">
                              ${ball.is_wide ? 'Wide' : ''}
                              ${ball.is_no_ball ? 'No Ball' : ''}
                              ${ball.is_wicket ? `Wicket - ${ball.wicket_type} (${ball.dismissed_batsman_name})` : ''}
                              ${!ball.is_wide && !ball.is_no_ball && !ball.is_wicket ? `${ball.runs} run${ball.runs !== 1 ? 's' : ''}` : ''}
                              ${ball.is_four ? ' (4)' : ''}
                              ${ball.is_six ? ' (6)' : ''}
                            </p>
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                              <p class="text-sm text-gray-700 italic">
                                💬 ${ball.commentary}
                              </p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'Close',
                        confirmButtonColor: '#3b82f6',
                        width: '500px'
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-4 p-2">
                    <span className="font-mono text-sm text-gray-600 w-16">
                      {ball.over_number}.{ball.ball_number}
                    </span>
                    <span className="flex-1">
                      {ball.is_wide && 'Wide'}
                      {ball.is_no_ball && 'No Ball'}
                      {ball.is_wicket && `Wicket - ${ball.wicket_type} (${ball.dismissed_batsman_name})`}
                      {!ball.is_wide && !ball.is_no_ball && !ball.is_wicket && `${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}
                      {ball.is_four && ' (4)'}
                      {ball.is_six && ' (6)'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {ball.batsman_name} b {ball.bowler_name}
                    </span>
                    {ball.commentary && (
                      <span className="text-blue-600 text-xs font-semibold">💬 Click for commentary</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchScoreboard;

