import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, Trophy, ArrowLeft, ArrowLeftRight, Users } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import { 
  getScoreboard, 
  updateScore, 
  startMatch, 
  endInnings,
  getAvailableBatsmen,
  getAvailableBowlers,
  validateBowler,
  setBatsmen,
  setBowler,
  getMatchWinner
} from '@/api/organizer/matchScore';
import { createMatch } from '@/api/organizer/fixture';
import { getTournamentRounds } from '@/api/organizer/fixture';

const LiveScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Score input state
  const [selectedRuns, setSelectedRuns] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState(null);
  const [customRuns, setCustomRuns] = useState('');
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [wicketData, setWicketData] = useState({
    wicket_type: '',
    dismissed_batsman_id: null
  });
  
  // Popup states
  const [showBowlerSelection, setShowBowlerSelection] = useState(false);
  const [showStrikerChange, setShowStrikerChange] = useState(false);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [availableBowlers, setAvailableBowlers] = useState([]);
  const [availableBatsmen, setAvailableBatsmen] = useState([]);
  const [selectedBowlerId, setSelectedBowlerId] = useState(null); // Track selected bowler after over
  const [selectedStrikerId, setSelectedStrikerId] = useState(null); // For selection modal
  const [selectedNonStrikerId, setSelectedNonStrikerId] = useState(null); // For selection modal
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [matchWinner, setMatchWinner] = useState(null);
  
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadScoreboard();
    
    // Start polling if match is live
    if (isLive) {
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [matchId, isLive]);

  useEffect(() => {
    // Check if bowler selection is needed (over complete)
    if (scoreboard?.needs_bowler_selection && !showBowlerSelection) {
      handleOverComplete();
    }
  }, [scoreboard?.needs_bowler_selection]);

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      loadScoreboard();
    }, 2000); // Poll every 2 seconds for instant updates
  };

  const loadScoreboard = async () => {
    try {
      const data = await getScoreboard(matchId);
      setScoreboard(data);
      setIsLive(data.match_status === 'live');
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

  const handleScoreUpdate = async () => {
    if (!scoreboard || !scoreboard.batting_score) {
      alert('Match score not initialized');
      return;
    }
    
    // Validation: Check if both batsmen are selected
    if (!scoreboard.current_batsman_id || !scoreboard.current_non_striker_id) {
      alert('Please ensure both striker and non-striker are selected before scoring.');
      return;
    }
    
    // Validation: Check if bowler is selected (either current or newly selected)
    const bowlerId = selectedBowlerId || scoreboard.current_bowler_id;
    if (!bowlerId) {
      alert('Please select a bowler before scoring. Select bowler when prompted after over completion.');
      setShowBowlerSelection(true);
      await loadAvailableBowlers();
      return;
    }
    
    // Validation: Check if runs/extras/wicket is selected
    if (!selectedRuns && selectedRuns !== 0 && !selectedExtras && !showWicketDialog && !customRuns) {
      alert('Please select runs (0-6), extras, or enter custom runs before updating score');
      return;
    }
    
    // Validation: Custom runs must be valid
    if (customRuns) {
      const customRunsNum = parseInt(customRuns);
      if (isNaN(customRunsNum) || customRunsNum < 0 || customRunsNum > 6) {
        alert('Custom runs must be a number between 0 and 6');
        return;
      }
    }

    // Validation: Wicket requires type and dismissed batsman
    if (showWicketDialog) {
      if (!wicketData.wicket_type) {
        alert('Please select wicket type');
        return;
      }
      if (!wicketData.dismissed_batsman_id) {
        alert('Please select the dismissed batsman');
        return;
      }
    }

    try {
      setUpdating(true);
      
      const runs = customRuns ? parseInt(customRuns) : (selectedRuns || 0);
      
      // Use selected bowler if available (after over completion), otherwise use current bowler
      const bowlerId = selectedBowlerId || scoreboard.current_bowler_id;
      
      const scoreData = {
        runs: runs,
        is_wicket: showWicketDialog,
        wicket_type: showWicketDialog ? wicketData.wicket_type : null,
        dismissed_batsman_id: showWicketDialog ? wicketData.dismissed_batsman_id : null,
        is_wide: selectedExtras === 'wide',
        is_no_ball: selectedExtras === 'no_ball',
        is_bye: selectedExtras === 'bye',
        is_leg_bye: selectedExtras === 'leg_bye',
        is_four: runs === 4,
        is_six: runs === 6,
        batsman_id: scoreboard.current_batsman_id,
        bowler_id: bowlerId
      };
      
      // Clear selected bowler after using it
      setSelectedBowlerId(null);

      await updateScore(matchId, scoreData);
      
      // Reset selections
      setSelectedRuns(null);
      setSelectedExtras(null);
      setCustomRuns('');
      setShowWicketDialog(false);
      setWicketData({ wicket_type: '', dismissed_batsman_id: null });
      
      // If wicket, show new batsman selection
      if (showWicketDialog) {
        setShowNewBatsman(true);
        await loadAvailableBatsmen();
      }
      
      // Reload scoreboard
      await loadScoreboard();
    } catch (error) {
      console.error('Failed to update score:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update score';
      alert(errorMessage);
      console.error('Error details:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleOverComplete = async () => {
    // Load available bowlers (excluding last completed over's bowler)
    // Backend will automatically exclude the previous over's bowler if exclude_bowler_id is null
    await loadAvailableBowlers(scoreboard.current_bowler_id || null);
    setShowBowlerSelection(true);
  };

  const loadAvailableBowlers = async (excludeBowlerId = null) => {
    try {
      // If second innings just started (innings_number == 2 and no balls in second innings), don't exclude any bowler
      // Check if this is a new innings by seeing if there are any balls bowled in current innings
      let shouldExclude = excludeBowlerId;
      if (scoreboard?.innings_number === 2 && !excludeBowlerId) {
        // If excludeBowlerId is explicitly null, it means we're starting fresh (new innings)
        shouldExclude = null;
      } else if (scoreboard?.innings_number === 2 && excludeBowlerId) {
        // Check if there are any balls in second innings - if not, don't exclude
        const hasSecondInningsBalls = scoreboard?.all_balls?.some(ball => {
          // Rough check: if current_over > max_overs, we're in second innings
          // Or check if balls exist for second innings team
          return ball.over_number > (scoreboard?.max_overs || 0);
        });
        if (!hasSecondInningsBalls) {
          // New second innings, don't exclude any bowler
          shouldExclude = null;
        }
      }
      const bowlers = await getAvailableBowlers(matchId, scoreboard.bowling_team_id, shouldExclude);
      setAvailableBowlers(bowlers);
    } catch (error) {
      console.error('Failed to load available bowlers:', error);
    }
  };

  const loadAvailableBatsmen = async () => {
    try {
      const batsmen = await getAvailableBatsmen(matchId, scoreboard.batting_team_id);
      // Use the API response directly
      setAvailableBatsmen(batsmen.map(b => ({
        player_id: b.player_id,
        player_name: b.player_name
      })));
    } catch (error) {
      console.error('Failed to load available batsmen:', error);
      alert('Failed to load available batsmen. Please try again.');
    }
  };

  const handleBowlerSelection = async (bowlerId) => {
    try {
      setUpdating(true);
      
      // Always validate bowler selection first
      const validation = await validateBowler(matchId, bowlerId);
      if (!validation.valid) {
        alert(validation.message);
        setUpdating(false);
        return;
      }
      
      // Check if this is the initial bowler (no balls bowled yet)
      const hasBalls = scoreboard?.all_balls && scoreboard.all_balls.length > 0;
      
      if (!hasBalls) {
        // Initial bowler selection - set directly
        await setBowler(matchId, bowlerId);
        setShowBowlerSelection(false);
        setSelectedBowlerId(null);
        await loadScoreboard();
      } else {
        // After over completion - set the bowler for next over
        await setBowler(matchId, bowlerId);
        setShowBowlerSelection(false);
        setSelectedBowlerId(null);
        await loadScoreboard();
      }
    } catch (error) {
      console.error('Failed to select bowler:', error);
      alert(error.response?.data?.detail || 'Failed to select bowler');
    } finally {
      setUpdating(false);
    }
  };

  const handleStrikerChange = async () => {
    await loadAvailableBatsmen();
    // Pre-populate with current batsmen if they exist
    if (scoreboard.current_batsman_id) {
      setSelectedStrikerId(scoreboard.current_batsman_id);
    }
    if (scoreboard.current_non_striker_id) {
      setSelectedNonStrikerId(scoreboard.current_non_striker_id);
    }
    setShowStrikerChange(true);
  };

  const handleSetBatsmen = async (strikerId, nonStrikerId) => {
    try {
      setUpdating(true);
      await setBatsmen(matchId, strikerId, nonStrikerId);
      setShowStrikerChange(false);
      setSelectedStrikerId(null);
      setSelectedNonStrikerId(null);
      await loadScoreboard();
    } catch (error) {
      console.error('Failed to set batsmen:', error);
      alert(error.response?.data?.detail || 'Failed to set batsmen');
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectNewBatsman = async (batsmanId) => {
    // After wicket, the new batsman will come in and be set as striker
    // This is handled automatically by the backend when we score the next ball
    // For now, we just close the dialog - the scorer will select this batsman as striker when updating next ball
    setShowNewBatsman(false);
    setShowStrikerChange(true); // Open striker selection to set the new batsman
    await loadAvailableBatsmen();
  };

  const handleEndInnings = async () => {
    if (!window.confirm('Are you sure you want to end this innings?')) {
      return;
    }
    try {
      setUpdating(true);
      await endInnings(matchId);
      await loadScoreboard();
      const newMatchStatus = scoreboard?.match_status;
      if (newMatchStatus === 'live') {
        // Second innings starting - match is still live
        setIsLive(true);
        startPolling();
        // For second innings, don't exclude any bowler (start fresh)
        await loadAvailableBowlers(null); // Pass null to not exclude any bowler
        setShowBowlerSelection(true);
      } else if (newMatchStatus === 'completed') {
        // Match completed - get winner and show popup
        setIsLive(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        // Fetch match winner
        try {
          const winnerData = await getMatchWinner(matchId);
          if (winnerData.winner_id) {
            setMatchWinner(winnerData);
            setShowWinnerModal(true);
          } else {
            alert('Match completed. Result: ' + (winnerData.match_result || 'Match Tied'));
          }
        } catch (error) {
          console.error('Failed to fetch match winner:', error);
          alert('Match completed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to end innings:', error);
      alert(error.response?.data?.detail || 'Failed to end innings');
    } finally {
      setUpdating(false);
    }
  };

  const getStrikerStats = () => {
    if (!scoreboard?.current_batsman_id) return null;
    return scoreboard.player_stats.find(p => p.player_id === scoreboard.current_batsman_id);
  };

  const getNonStrikerStats = () => {
    if (!scoreboard?.current_non_striker_id) return null;
    return scoreboard.player_stats.find(p => p.player_id === scoreboard.current_non_striker_id);
  };

  const getBowlerStats = () => {
    if (!scoreboard?.current_bowler_id) return null;
    return scoreboard.player_stats.find(p => p.player_id === scoreboard.current_bowler_id);
  };

  const formatOvers = (overs) => {
    if (!overs) return '0.0';
    const overParts = overs.toString().split('.');
    return `${overParts[0]}.${overParts[1] || 0}`;
  };

  const formatDecimal = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0.' + '0'.repeat(decimals);
    // Convert to number if it's a Decimal or string
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return '0.' + '0'.repeat(decimals);
    return num.toFixed(decimals);
  };

  const getBallDisplay = (ball) => {
    if (ball.is_wicket) return 'W';
    if (ball.is_wide) return 'Wd';
    if (ball.is_no_ball) return 'Nb';
    if (ball.is_bye) return 'B';
    if (ball.is_leg_bye) return 'Lb';
    return ball.runs;
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
  const strikerStats = getStrikerStats();
  const nonStrikerStats = getNonStrikerStats();
  const bowlerStats = getBowlerStats();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Score Update</h1>
            </div>
            <div className="flex gap-2">
              {isLive && (
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </span>
              )}
              {!isLive && scoreboard.toss_info && !battingScore && (
                <button
                  onClick={handleStartMatch}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {updating ? 'Starting...' : 'Start Match'}
                </button>
              )}
            </div>
          </div>

          {/* Match Summary - Top Section */}
          {battingScore && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-4 text-white">
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
              
              {scoreboard.toss_info && (
                <div className="mt-4 pt-4 border-t border-blue-400 text-sm opacity-90">
                  {scoreboard.toss_info.toss_winner_name} won toss and chose to {scoreboard.toss_info.toss_decision} | 
                  Venue: {scoreboard.match_id} {/* TODO: Add venue to response */}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Batsman Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Batsman Panel */}
              {battingScore && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Batsmen</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Striker */}
                    <div className={`border-2 rounded-lg p-4 ${scoreboard.current_batsman_id ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-600">Striker</div>
                        {scoreboard.current_batsman_id && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">ON STRIKE</span>
                        )}
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
                      <button
                        onClick={handleStrikerChange}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ArrowLeftRight size={14} />
                        {scoreboard.current_batsman_id ? 'Change' : 'Select'}
                      </button>
                    </div>

                    {/* Non-striker */}
                    <div className={`border-2 rounded-lg p-4 ${scoreboard.current_non_striker_id ? 'border-gray-400 bg-gray-50' : 'border-gray-300'}`}>
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
                      {!scoreboard.current_non_striker_id && (
                        <button
                          onClick={handleStrikerChange}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ArrowLeftRight size={14} />
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bowler Panel */}
              {battingScore && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Current Bowler</h2>
                  
                  {selectedBowlerId ? (
                    <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
                      <div className="font-bold text-lg mb-1">
                        {availableBowlers.find(b => b.player_id === selectedBowlerId)?.player_name || 'Selected Bowler'}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Ready to bowl next over
                      </div>
                    </div>
                  ) : scoreboard.current_bowler_id && bowlerStats ? (
                    <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
                      <div className="font-bold text-lg mb-1">{scoreboard.current_bowler_name}</div>
                      <div className="grid grid-cols-4 gap-2 text-sm mt-3">
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
                  ) : (
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <div className="text-gray-400 text-center mb-3">No bowler selected</div>
                      <button
                        onClick={async () => {
                          // For second innings, if no balls bowled yet, don't exclude any bowler
                          const excludeBowler = (scoreboard?.innings_number === 2 && (!scoreboard?.all_balls || scoreboard.all_balls.length === 0)) 
                            ? null 
                            : scoreboard.current_bowler_id;
                          await loadAvailableBowlers(excludeBowler);
                          setShowBowlerSelection(true);
                        }}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                      >
                        Select Bowler
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main Ball Input Controls */}
              {isLive && battingScore && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Ball Input</h2>
                  
                  {/* Runs */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Runs</div>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 6].map((runs) => (
                        <button
                          key={runs}
                          onClick={() => {
                            setSelectedRuns(runs);
                            setSelectedExtras(null);
                            setCustomRuns('');
                          }}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            selectedRuns === runs
                              ? runs === 4
                              ? 'bg-blue-600 text-white scale-110'
                              : runs === 6
                              ? 'bg-green-600 text-white scale-110'
                              : 'bg-blue-500 text-white scale-110'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {runs}
                        </button>
                      ))}
                      <input
                        type="number"
                        placeholder="Custom"
                        value={customRuns}
                        onChange={(e) => {
                          setCustomRuns(e.target.value);
                          setSelectedRuns(null);
                          setSelectedExtras(null);
                        }}
                        className="px-4 py-3 border border-gray-300 rounded-lg w-24 text-center"
                        min="0"
                        max="6"
                      />
                    </div>
                  </div>

                  {/* Extras */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Extras</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'wide', label: 'Wide' },
                        { key: 'no_ball', label: 'No Ball' },
                        { key: 'bye', label: 'Bye' },
                        { key: 'leg_bye', label: 'Leg Bye' }
                      ].map((extra) => (
                        <button
                          key={extra.key}
                          onClick={() => {
                            setSelectedExtras(extra.key);
                            setSelectedRuns(null);
                            setCustomRuns('');
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold ${
                            selectedExtras === extra.key
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {extra.label}
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
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                        <select
                          value={wicketData.wicket_type}
                          onChange={(e) => setWicketData({ ...wicketData, wicket_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select wicket type</option>
                          <option value="bowled">Bowled</option>
                          <option value="caught">Caught</option>
                          <option value="lbw">LBW</option>
                          <option value="run_out">Run Out</option>
                          <option value="stumped">Stumped</option>
                          <option value="hit_wicket">Hit Wicket</option>
                          <option value="retired_hurt">Retired Hurt</option>
                        </select>
                        <select
                          value={wicketData.dismissed_batsman_id || ''}
                          onChange={(e) => setWicketData({ ...wicketData, dismissed_batsman_id: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select dismissed batsman</option>
                          {scoreboard.player_stats
                            .filter(p => p.team_id === scoreboard.batting_team_id && (p.is_batting || p.balls_faced > 0) && !p.is_out)
                            .map((player) => (
                              <option key={player.player_id} value={player.player_id}>
                                {player.player_name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleScoreUpdate}
                    disabled={updating || (!selectedRuns && selectedRuns !== 0 && !selectedExtras && !showWicketDialog && !customRuns)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Score'}
                  </button>
                </div>
              )}

              {/* Live Score Timeline */}
              {battingScore && scoreboard.all_balls && scoreboard.all_balls.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Ball-by-Ball Timeline</h2>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {scoreboard.all_balls.map((ball, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <div className="font-mono text-sm text-gray-600 w-16">
                            {ball.over_number}.{ball.ball_number}
                          </div>
                          <div className={`px-3 py-1 rounded text-sm font-semibold ${
                            ball.is_wicket
                              ? 'bg-red-500 text-white'
                              : ball.runs === 4
                              ? 'bg-blue-500 text-white'
                              : ball.runs === 6
                              ? 'bg-green-500 text-white'
                              : ball.is_wide || ball.is_no_ball
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {getBallDisplay(ball)}
                          </div>
                          <div className="text-sm text-gray-600 flex-1">
                            {ball.batsman_name} to {ball.bowler_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Scorecard */}
            <div className="space-y-4">
              {/* Batting Scorecard */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Batting Scorecard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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
                        .filter(p => p.team_id === scoreboard.batting_team_id && (p.is_batting || p.balls_faced > 0))
                        .map((player) => (
                          <tr key={player.id} className={`border-b ${!player.is_out ? 'bg-green-50' : ''}`}>
                            <td className="p-2">
                              {player.player_name}
                              {!player.is_out && player.balls_faced > 0 && '*'}
                              {player.is_out && player.dismissal_type && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({player.dismissal_type})
                                </span>
                              )}
                            </td>
                            <td className="text-right p-2">{player.runs}</td>
                            <td className="text-right p-2">{player.balls_faced}</td>
                            <td className="text-right p-2">{player.fours}</td>
                            <td className="text-right p-2">{player.sixes}</td>
                            <td className="text-right p-2">{formatDecimal(player.strike_rate, 1)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Scorecard */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Bowling Scorecard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Bowler</th>
                        <th className="text-right p-2">O</th>
                        <th className="text-right p-2">R</th>
                        <th className="text-right p-2">W</th>
                        <th className="text-right p-2">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreboard.player_stats
                        .filter(p => p.team_id === scoreboard.bowling_team_id && (p.is_bowling || p.overs_bowled > 0))
                        .map((player) => (
                          <tr key={player.id} className={`border-b ${player.is_bowling ? 'bg-purple-50' : ''}`}>
                            <td className="p-2">{player.player_name}</td>
                            <td className="text-right p-2">{formatOvers(player.overs_bowled)}</td>
                            <td className="text-right p-2">{player.runs_conceded}</td>
                            <td className="text-right p-2">{player.wickets_taken}</td>
                            <td className="text-right p-2">{formatDecimal(player.economy, 2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              {isLive && (
                <div className="bg-white rounded-lg shadow-md p-6 space-y-2">
                  <button
                    onClick={handleEndInnings}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    End Innings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bowler Selection Modal */}
      {showBowlerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-2">Select Next Bowler</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cannot select the same bowler from the previous over
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableBowlers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No available bowlers
                </p>
              ) : (
                availableBowlers.map((bowler) => (
                  <button
                    key={bowler.player_id}
                    onClick={() => handleBowlerSelection(bowler.player_id)}
                    className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all"
                  >
                    {bowler.player_name}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBowlerSelection(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Striker/Non-Striker Selection Modal */}
      {showStrikerChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Select Striker and Non-Striker</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Striker</label>
                <select
                  value={selectedStrikerId || ''}
                  onChange={(e) => setSelectedStrikerId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Striker</option>
                  {availableBatsmen.map((batsman) => (
                    <option 
                      key={batsman.player_id} 
                      value={batsman.player_id}
                      disabled={selectedNonStrikerId === batsman.player_id}
                    >
                      {batsman.player_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Non-Striker</label>
                <select
                  value={selectedNonStrikerId || ''}
                  onChange={(e) => setSelectedNonStrikerId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Non-Striker</option>
                  {availableBatsmen.map((batsman) => (
                    <option 
                      key={batsman.player_id} 
                      value={batsman.player_id}
                      disabled={selectedStrikerId === batsman.player_id}
                    >
                      {batsman.player_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selectedStrikerId && selectedNonStrikerId) {
                    handleSetBatsmen(selectedStrikerId, selectedNonStrikerId);
                  } else {
                    alert('Please select both striker and non-striker');
                  }
                }}
                disabled={!selectedStrikerId || !selectedNonStrikerId || updating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'Setting...' : 'Set Batsmen'}
              </button>
              <button
                onClick={() => {
                  setShowStrikerChange(false);
                  setSelectedStrikerId(null);
                  setSelectedNonStrikerId(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal */}
      {showWinnerModal && matchWinner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-12 w-12 text-yellow-500 mr-2" />
              <h3 className="text-2xl font-bold text-gray-900">Match Completed!</h3>
            </div>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {matchWinner.winner_name}
              </div>
              <div className="text-lg text-gray-600">
                {matchWinner.match_result}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    setUpdating(true);
                    // Try to get match details to get tournament_id and round_id
                    try {
                      const matchResponse = await fetch(`/api/v1/organizer/fixtures/matches/${matchId}`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      if (matchResponse.ok) {
                        const matchData = await matchResponse.json();
                        const tournamentId = matchData.tournament_id;
                        const currentRoundId = matchData.round_id;
                        
                        // Get all rounds for this tournament
                        const rounds = await getTournamentRounds(tournamentId);
                        const currentRound = rounds.find(r => r.id === currentRoundId);
                        
                        // Find next round (Playoff round if current is League, Final if current is Playoff)
                        let nextRound = null;
                        if (currentRound?.round_name === 'League') {
                          nextRound = rounds.find(r => r.round_name === 'Playoff');
                        } else if (currentRound?.round_name === 'Playoff') {
                          nextRound = rounds.find(r => r.round_name === 'Final');
                        }
                        
                        if (nextRound) {
                          // Navigate to tournament fixtures page with the next round selected
                          setShowWinnerModal(false);
                          navigate(`/organizer/tournaments/${tournamentId}/fixtures`, {
                            state: {
                              selectedRoundId: nextRound.id,
                              winnerTeamId: matchWinner.winner_id,
                              showAddWinner: true
                            }
                          });
                        } else {
                          setShowWinnerModal(false);
                          alert('Next round not found. Please navigate to Tournament Fixtures page to manually add the winner.');
                          navigate(`/organizer/tournaments/${tournamentId}/fixtures`);
                        }
                      } else {
                        setShowWinnerModal(false);
                        alert('Please navigate to Tournament Fixtures page to add the winner to the next round.');
                      }
                    } catch (error) {
                      console.error('Failed to get match details:', error);
                      setShowWinnerModal(false);
                      alert('Please navigate to Tournament Fixtures page to add the winner to the next round.');
                    }
                  } catch (error) {
                    console.error('Failed to handle winner:', error);
                    alert('An error occurred. Please navigate to Tournament Fixtures page to add the winner.');
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'Loading...' : 'Add to Next Round'}
              </button>
              <button
                onClick={() => {
                  setShowWinnerModal(false);
                  setMatchWinner(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batsman Selection Modal (after wicket) */}
      {showNewBatsman && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Select New Batsman</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableBatsmen.map((batsman) => (
                <button
                  key={batsman.player_id}
                  onClick={() => handleSelectNewBatsman(batsman.player_id)}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500"
                >
                  {batsman.player_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LiveScoring;
