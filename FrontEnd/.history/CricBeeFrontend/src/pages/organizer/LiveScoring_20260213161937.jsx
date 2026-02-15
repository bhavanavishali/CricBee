import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, Trophy, ArrowLeft, ArrowLeftRight, Users, ChevronDown, ChevronUp } from 'lucide-react';
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
  getMatchWinner,
  completeMatch
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
  
  // Collapsible states
  const [showBattingScorecard, setShowBattingScorecard] = useState(false);
  const [showBowlingScorecard, setShowBowlingScorecard] = useState(false);
  
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
    
    setShowBowlerSelection(true);
  };

  const loadAvailableBowlers = async (excludeBowlerId = null) => {
    try {
      
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
      
      // Reload scoreboard to get updated data
      const updatedScoreboard = await getScoreboard(matchId);
      setScoreboard(updatedScoreboard);
      
      // Check if it's second innings that just ended
      if (updatedScoreboard.innings_number === 2) {
        // Second innings just ended - match is ready for completion
        // Keep match live so Complete Match button appears
        setIsLive(true);
        startPolling();
      } else if (updatedScoreboard.match_status === 'live' && updatedScoreboard.innings_number === 1) {
        // First innings ended - second innings starting
        setIsLive(true);
        startPolling();
        // For second innings, don't exclude any bowler (start fresh)
        await loadAvailableBowlers(null);
        setShowBowlerSelection(true);
      }
    } catch (error) {
      console.error('Failed to end innings:', error);
      alert(error.response?.data?.detail || 'Failed to end innings');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteMatch = async () => {
    if (!window.confirm('Are you sure you want to complete this match? This action cannot be undone.')) {
      return;
    }
    try {
      setUpdating(true);
      const result = await completeMatch(matchId);
      setIsLive(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Show winner modal or alert
      if (result.winner_id) {
        setMatchWinner({
          winner_id: result.winner_id,
          winner_name: result.winner_name,
          match_result: result.match_result
        });
        setShowWinnerModal(true);
      } else {
        alert('Match completed. Result: ' + (result.match_result || 'Match Tied'));
      }
      
      await loadScoreboard();
    } catch (error) {
      console.error('Failed to complete match:', error);
      alert(error.response?.data?.detail || 'Failed to complete match');
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

  const getLastBalls = (count = 6) => {
    if (!scoreboard?.all_balls) return [];
    return scoreboard.all_balls.slice(-count);
  };

  const getPartnershipRuns = () => {
    if (!scoreboard?.all_balls || !scoreboard?.current_batsman_id || !scoreboard?.current_non_striker_id) return 0;
    
    // Find the last wicket ball or start of innings
    let lastWicketIndex = -1;
    for (let i = scoreboard.all_balls.length - 1; i >= 0; i--) {
      if (scoreboard.all_balls[i].is_wicket) {
        lastWicketIndex = i;
        break;
      }
    }
    
    // Calculate runs since last wicket
    let partnershipRuns = 0;
    const startIndex = lastWicketIndex + 1;
    for (let i = startIndex; i < scoreboard.all_balls.length; i++) {
      const ball = scoreboard.all_balls[i];
      if (!ball.is_wide && !ball.is_no_ball) {
        partnershipRuns += ball.runs;
      }
    }
    
    return partnershipRuns;
  };

  const getPartnershipBalls = () => {
    if (!scoreboard?.all_balls || !scoreboard?.current_batsman_id || !scoreboard?.current_non_striker_id) return 0;
    
    // Find the last wicket ball or start of innings
    let lastWicketIndex = -1;
    for (let i = scoreboard.all_balls.length - 1; i >= 0; i--) {
      if (scoreboard.all_balls[i].is_wicket) {
        lastWicketIndex = i;
        break;
      }
    }
    
    // Count valid balls since last wicket
    let partnershipBalls = 0;
    const startIndex = lastWicketIndex + 1;
    for (let i = startIndex; i < scoreboard.all_balls.length; i++) {
      const ball = scoreboard.all_balls[i];
      if (!ball.is_wide && !ball.is_no_ball) {
        partnershipBalls++;
      }
    }
    
    return partnershipBalls;
  };

  const getTotalBoundaries = () => {
    if (!scoreboard?.all_balls) return { fours: 0, sixes: 0 };
    
    let fours = 0, sixes = 0;
    scoreboard.all_balls.forEach(ball => {
      if (ball.runs === 4 && !ball.is_wide && !ball.is_no_ball) fours++;
      if (ball.runs === 6 && !ball.is_wide && !ball.is_no_ball) sixes++;
    });
    
    return { fours, sixes };
  };

  const getTotalExtras = () => {
    if (!scoreboard?.batting_score) return 0;
    return scoreboard.batting_score.extras || 0;
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
      <div className="min-h-screen bg-gray-50 py-3 px-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm">Back</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900">
                      {scoreboard.batting_team_name} vs {scoreboard.bowling_team_name}
                    </h1>
                    {isLive && (
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                  </div>
                  {scoreboard.toss_info && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      Wankhede Stadium • Toss: {scoreboard.toss_info.toss_winner_name} chose to {scoreboard.toss_info.toss_decision}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isLive && scoreboard.toss_info && !battingScore && (
                  <button
                    onClick={handleStartMatch}
                    disabled={updating}
                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 text-sm"
                  >
                    {updating ? 'Starting...' : '1st Inn'}
                  </button>
                )}
                {isLive && scoreboard.innings_number === 1 && (
                  <button
                    onClick={handleEndInnings}
                    className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
                  >
                    End 1st Innings
                  </button>
                )}
                {isLive && scoreboard.innings_number === 2 && (
                  <>
                    {/* Show End 2nd Innings button only if 2nd innings is still in progress */}
                    {scoreboard.batting_score && scoreboard.batting_score.balls > 0 && (
                      <button
                        onClick={handleEndInnings}
                        className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
                      >
                        End 2nd Innings
                      </button>
                    )}
                    {/* Show Complete Match button if both innings are completed */}
                    {scoreboard.batting_score && scoreboard.bowling_score &&
                     scoreboard.batting_score.balls > 0 && scoreboard.bowling_score.balls > 0 && (
                      <button
                        onClick={handleCompleteMatch}
                        disabled={updating}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 text-sm"
                      >
                        {updating ? 'Completing...' : 'Complete Match'}
                      </button>
                    )}
                  </>
                )}
                <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                  scoreboard.innings_number === 2 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  2nd Inn
                </button>
              </div>
            </div>
          </div>

          {battingScore && (
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4 space-y-3">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">{scoreboard.batting_team_name} - Batting</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {battingScore.runs}/{battingScore.wickets}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">({formatOvers(battingScore.overs)} overs)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 mb-1">{scoreboard.bowling_team_name} - Bowling</div>
                      <div className="text-sm text-gray-600">Run Rate: {formatDecimal(battingScore.run_rate, 2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-3">
                    {getLastBalls(6).map((ball, idx) => (
                      <div key={idx} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                        ball.is_wicket
                          ? 'bg-red-500 text-white'
                          : ball.runs === 4
                          ? 'bg-blue-500 text-white'
                          : ball.runs === 6
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {getBallDisplay(ball)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-green-700 font-semibold mb-1">Striker</div>
                        <div className="font-bold text-gray-900">
                          {scoreboard.current_batsman_name || 'Not selected'}
                        </div>
                        {strikerStats && (
                          <div className="text-xs text-gray-600 mt-1">
                            {strikerStats.runs}* ({strikerStats.balls_faced})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleStrikerChange}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ArrowLeftRight size={12} />
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-600 font-semibold mb-1">Non-striker</div>
                        <div className="font-bold text-gray-900">
                          {scoreboard.current_non_striker_name || 'Not selected'}
                        </div>
                        {nonStrikerStats && (
                          <div className="text-xs text-gray-600 mt-1">
                            {nonStrikerStats.runs} ({nonStrikerStats.balls_faced})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-blue-700 font-semibold mb-1">Bowler</div>
                        <div className="font-bold text-gray-900">
                          {scoreboard.current_bowler_name || 'Not selected'}
                        </div>
                        {bowlerStats && (
                          <div className="text-xs text-gray-600 mt-1">
                            {formatOvers(bowlerStats.overs_bowled)}-{bowlerStats.runs_conceded}-{bowlerStats.wickets_taken}
                          </div>
                        )}
                      </div>
                      {!scoreboard.current_bowler_id && (
                        <button
                          onClick={async () => {
                            await loadAvailableBowlers(null);
                            setShowBowlerSelection(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-5">
                {isLive ? (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[0, 1, 2, 3, 4, 6].map((runs) => (
                        <button
                          key={runs}
                          onClick={() => {
                            setSelectedRuns(runs);
                            setSelectedExtras(null);
                            setCustomRuns('');
                          }}
                          className={`h-12 rounded-lg font-bold text-lg transition-all ${
                            selectedRuns === runs
                              ? runs === 4
                              ? 'bg-blue-600 text-white border-2 border-blue-700'
                              : runs === 6
                              ? 'bg-green-600 text-white border-2 border-green-700'
                              : 'bg-blue-500 text-white border-2 border-blue-600'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {runs}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3">
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
                          className={`h-10 rounded-lg font-semibold text-xs transition-all ${
                            selectedExtras === extra.key
                              ? 'bg-yellow-500 text-white border-2 border-yellow-600'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {extra.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowWicketDialog(!showWicketDialog)}
                        className={`h-12 rounded-lg font-bold transition-all ${
                          showWicketDialog
                            ? 'bg-red-600 text-white border-2 border-red-700'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        🔺 Wicket
                      </button>
                      <button
                        onClick={handleScoreUpdate}
                        disabled={updating || (!selectedRuns && selectedRuns !== 0 && !selectedExtras && !showWicketDialog && !customRuns)}
                        className="h-12 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Updating...' : 'Update Score'}
                      </button>
                    </div>
                    
                    {showWicketDialog && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <select
                          value={wicketData.wicket_type}
                          onChange={(e) => setWicketData({ ...wicketData, wicket_type: e.target.value })}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
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
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
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
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
                    <p>Match not started yet</p>
                  </div>
                )}
              </div>

              <div className="col-span-3 space-y-3">
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Stats</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">Boundaries</span>
                      <span className="font-semibold text-gray-900">
                        {getTotalBoundaries().fours} (4s) + {getTotalBoundaries().sixes} (6s)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">Extras</span>
                      <span className="font-semibold text-gray-900">{getTotalExtras()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Partnership</span>
                      <span className="font-semibold text-gray-900">
                        {getPartnershipRuns()} ({getPartnershipBalls()} balls)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Ball-by-Ball</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scoreboard.all_balls && scoreboard.all_balls.length > 0 ? (
                      scoreboard.all_balls.slice().reverse().slice(0, 10).map((ball, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500 w-10">{ball.over_number}.{ball.ball_number}</span>
                            <span className="text-gray-700">{ball.bowler_name} to {ball.batsman_name}</span>
                          </div>
                          <span className="font-bold text-gray-900 ml-2">{ball.runs}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-4">No balls yet</div>
                    )}
                  </div>
                </div>

                {scoreboard.innings_number === 1 && (
                  <div className="bg-white rounded-lg shadow-sm p-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">End Innings</h3>
                    <p className="text-xs text-gray-600 mb-2">Click to end current innings</p>
                  </div>
                )}
                {scoreboard.innings_number === 2 && 
                 scoreboard.batting_score && scoreboard.bowling_score &&
                 scoreboard.batting_score.balls > 0 && scoreboard.bowling_score.balls > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Complete Match</h3>
                    <p className="text-xs text-gray-600 mb-2">Click to complete match and determine winner</p>
                    <button
                      onClick={handleCompleteMatch}
                      disabled={updating}
                      className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 text-sm"
                    >
                      {updating ? 'Completing...' : 'Complete Match'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {battingScore && (
            <div className="mt-3 space-y-3">
              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => setShowBattingScorecard(!showBattingScorecard)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <h3 className="text-sm font-bold text-gray-900">Batting Scorecard</h3>
                  {showBattingScorecard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showBattingScorecard && (
                  <div className="px-3 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Batsman</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">R</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">B</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">4s</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">6s</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scoreboard.player_stats
                            .filter(p => p.team_id === scoreboard.batting_team_id && (p.is_batting || p.balls_faced > 0))
                            .map((player) => (
                              <tr key={player.id} className={`border-b border-gray-100 ${!player.is_out ? 'bg-green-50' : ''}`}>
                                <td className="py-2 px-2 text-gray-900">
                                  {player.player_name}
                                  {!player.is_out && player.balls_faced > 0 && '*'}
                                </td>
                                <td className="text-right py-2 px-2 text-gray-900 font-semibold">{player.runs}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.balls_faced}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.fours}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.sixes}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{formatDecimal(player.strike_rate, 1)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => setShowBowlingScorecard(!showBowlingScorecard)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <h3 className="text-sm font-bold text-gray-900">Bowling Figures</h3>
                  {showBowlingScorecard ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showBowlingScorecard && (
                  <div className="px-3 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Bowler</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">O</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">M</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">R</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">W</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-700">Econ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scoreboard.player_stats
                            .filter(p => p.team_id === scoreboard.bowling_team_id && (p.is_bowling || p.overs_bowled > 0))
                            .map((player) => (
                              <tr key={player.id} className={`border-b border-gray-100 ${player.is_bowling ? 'bg-blue-50' : ''}`}>
                                <td className="py-2 px-2 text-gray-900">{player.player_name}</td>
                                <td className="text-right py-2 px-2 text-gray-900 font-semibold">{formatOvers(player.overs_bowled)}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.overs_bowled ? Math.floor(player.overs_bowled) : 0}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.runs_conceded}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{player.wickets_taken}</td>
                                <td className="text-right py-2 px-2 text-gray-600">{formatDecimal(player.economy, 2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
