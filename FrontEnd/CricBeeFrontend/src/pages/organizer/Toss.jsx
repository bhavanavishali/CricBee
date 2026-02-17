import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { RotateCcw, X, Save } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import { updateToss, getScoreboard } from '@/api/organizer/matchScore';
import { getTournamentMatches, getRoundMatches } from '@/api/organizer/fixture';

const Toss = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tossWinnerId, setTossWinnerId] = useState(null);
  const [tossDecision, setTossDecision] = useState(null);
  const [coinFlipped, setCoinFlipped] = useState(false);
  const [coinResult, setCoinResult] = useState(null);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      // Try to get match from scoreboard first (which includes match info)
      try {
        const scoreboard = await getScoreboard(matchId);
        if (scoreboard.toss_info) {
          setTossWinnerId(scoreboard.toss_info.toss_winner_id);
          setTossDecision(scoreboard.toss_info.toss_decision);
          setCoinFlipped(true);
        }
        // Get match details from scoreboard
        setMatch({
          id: scoreboard.match_id,
          team_a_id: scoreboard.batting_team_id,
          team_a_name: scoreboard.batting_team_name || 'Team A',
          team_b_id: scoreboard.bowling_team_id,
          team_b_name: scoreboard.bowling_team_name || 'Team B',
          match_date: new Date().toISOString().split('T')[0],
          match_time: '00:00',
          venue: 'TBD',
          toss_winner_id: scoreboard.toss_info?.toss_winner_id,
          toss_decision: scoreboard.toss_info?.toss_decision
        });
      } catch (error) {
        // If scoreboard doesn't exist, the match hasn't started yet
        // We need to get match info from location state or find it in tournament matches
        // Check if match data was passed via navigation state
        const matchData = location.state?.match;
        if (matchData) {
          setMatch(matchData);
          if (matchData.toss_winner_id) {
            setTossWinnerId(matchData.toss_winner_id);
            setTossDecision(matchData.toss_decision);
            setCoinFlipped(true);
          }
        } else {
          // Fallback: use basic structure (user will need to select teams)
          setMatch({
            id: parseInt(matchId),
            team_a_id: null,
            team_a_name: 'Team A',
            team_b_id: null,
            team_b_name: 'Team B',
            match_date: new Date().toISOString().split('T')[0],
            match_time: '00:00',
            venue: 'TBD'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load match:', error);
      alert('Failed to load match details. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlipCoin = () => {
    // Random coin flip
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    setCoinResult(result);
    setCoinFlipped(true);
  };

  const handleReset = () => {
    setTossWinnerId(null);
    setTossDecision(null);
    setCoinFlipped(false);
    setCoinResult(null);
  };

  const handleSave = async () => {
    if (!tossWinnerId || !tossDecision) {
      alert('Please select toss winner and decision');
      return;
    }

    try {
      setSaving(true);
      await updateToss(matchId, {
        toss_winner_id: parseInt(tossWinnerId),
        toss_decision: tossDecision
      });
      alert('Toss saved successfully!');
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error('Failed to save toss:', error);
      alert(error.response?.data?.detail || 'Failed to save toss');
    } finally {
      setSaving(false);
    }
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

  if (!match) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Match not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Digital Toss</h1>
            </div>
          </div>

          {/* Match Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-sm text-gray-600 mb-1">Match #{match.id}</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {match.team_a_name} vs {match.team_b_name}
            </div>
            {match.match_date && (
              <div className="text-gray-600">
                {new Date(match.match_date).toLocaleDateString()} {match.match_time && `at ${match.match_time}`} {match.venue && `• ${match.venue}`}
              </div>
            )}
          </div>

          {/* Coin Display */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 flex flex-col items-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
              {coinFlipped ? (
                <div className="text-6xl font-bold text-white">
                  {coinResult === 'heads' ? '₹' : 'T'}
                </div>
              ) : (
                <div className="text-6xl font-bold text-white">₹</div>
              )}
            </div>
            <button
              onClick={handleFlipCoin}
              disabled={coinFlipped}
              className={`px-8 py-3 rounded-lg font-semibold text-white flex items-center gap-2 ${
                coinFlipped
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              Flip Coin
            </button>
          </div>

          {/* Toss Winner Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Toss Winner</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTossWinnerId(match.team_a_id)}
                disabled={!match.team_a_id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  !match.team_a_id
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : tossWinnerId === match.team_a_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">{match.team_a_name}</div>
              </button>
              <button
                onClick={() => setTossWinnerId(match.team_b_id)}
                disabled={!match.team_b_id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  !match.team_b_id
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : tossWinnerId === match.team_b_id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">{match.team_b_name}</div>
              </button>
            </div>
          </div>

          {/* Toss Decision Selection */}
          {tossWinnerId && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Toss Decision</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTossDecision('bat')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tossDecision === 'bat'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Bat</div>
                </button>
                <button
                  onClick={() => setTossDecision('bowl')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tossDecision === 'bowl'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Bowl</div>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!tossWinnerId || !tossDecision || saving}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                !tossWinnerId || !tossDecision || saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Toss'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Toss;





