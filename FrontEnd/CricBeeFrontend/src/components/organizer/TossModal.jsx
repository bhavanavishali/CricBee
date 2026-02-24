import { useState, useEffect } from 'react';
import { X, RotateCcw, Users, Target, Save } from 'lucide-react';
import { updateToss, getScoreboard } from '@/api/organizer/matchScore';
import Swal from 'sweetalert2';

const TossModal = ({ isOpen, onClose, match, onTossSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('flip'); // 'flip', 'result', 'winner', 'decision'
  const [coinResult, setCoinResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossWinnerId, setTossWinnerId] = useState(null);
  const [tossDecision, setTossDecision] = useState(null);
  const [winnerTeamName, setWinnerTeamName] = useState(null);

  useEffect(() => {
    if (isOpen && match) {
      // Check if toss already completed
      if (match.toss_winner_id && match.toss_decision) {
        setTossWinnerId(match.toss_winner_id);
        setTossDecision(match.toss_decision);
        setWinnerTeamName(match.toss_winner_id === match.team_a_id ? match.team_a_name : match.team_b_name);
        setStep('decision');
        setCoinResult('completed'); // Mark as already done
      } else {
        // Reset for new toss
        resetToss();
      }
    }
  }, [isOpen, match]);

  const resetToss = () => {
    setStep('flip');
    setCoinResult(null);
    setIsFlipping(false);
    setTossWinnerId(null);
    setTossDecision(null);
    setWinnerTeamName(null);
  };

  const handleFlipCoin = () => {
    setIsFlipping(true);
    // Simulate coin flip animation (2-3 seconds)
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setCoinResult(result);
      setIsFlipping(false);
      setStep('result');
    }, 2500);
  };

  const handleFlipAgain = () => {
    resetToss();
  };

  const handleSelectWinner = (teamId, teamName) => {
    setTossWinnerId(teamId);
    setWinnerTeamName(teamName);
    setStep('decision');
  };

  const handleSave = async () => {
    if (!tossWinnerId || !tossDecision) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please complete all selections' });
      return;
    }

    try {
      setSaving(true);
      await updateToss(match.id, {
        toss_winner_id: parseInt(tossWinnerId),
        toss_decision: tossDecision
      });
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Toss saved successfully! You can now start the match.' });
      onTossSaved?.();
      onClose();
    } catch (error) {
      console.error('Failed to save toss:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to save toss' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (match.toss_winner_id && match.toss_decision) {
      // Toss already saved, just close
      onClose();
    } else if (step !== 'flip' || coinResult) {
      // Ask for confirmation if toss is in progress
      if (window.confirm('Are you sure you want to close? Toss progress will be lost.')) {
        resetToss();
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !match) return null;

  const isTossCompleted = match.toss_winner_id && match.toss_decision;
  const canEdit = !isTossCompleted;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Digital Toss</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {/* Match Information */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-xs text-gray-600 mb-1">
              {match.round?.round_name || 'Group Stage - Round 1'}
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1">
              {match.team_a_name} vs {match.team_b_name}
            </div>
            <div className="text-xs text-gray-600">
              {new Date(match.match_date).toLocaleDateString('en-GB')} at {match.match_time?.substring(0, 5) || 'TBD'} • {match.venue || 'TBD'}
            </div>
          </div>

          {/* Coin Display Section */}
          <div className="flex flex-col items-center mb-4">
            {/* Coin Graphic */}
            <div className={`relative w-32 h-32 rounded-full mb-4 shadow-lg transition-all duration-300 ${
              isFlipping 
                ? 'animate-spin bg-gradient-to-br from-yellow-300 via-orange-400 to-yellow-500' 
                : coinResult === 'heads'
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                : coinResult === 'tails'
                ? 'bg-gradient-to-br from-orange-500 to-red-500'
                : 'bg-gradient-to-br from-yellow-400 to-orange-500'
            }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                {isFlipping ? (
                  <div className="text-4xl font-bold text-white animate-pulse">?</div>
                ) : coinResult === 'heads' ? (
                  <div className="text-4xl font-bold text-white">₹</div>
                ) : coinResult === 'tails' ? (
                  <div className="text-4xl font-bold text-white">T</div>
                ) : (
                  <div className="text-4xl font-bold text-white">₹</div>
                )}
              </div>
            </div>

            {/* Flip Coin Button or Result Display */}
            {step === 'flip' && !coinResult && (
              <button
                onClick={handleFlipCoin}
                disabled={isFlipping || !canEdit}
                className={`px-6 py-2 rounded-lg font-semibold text-white flex items-center gap-2 text-sm ${
                  isFlipping || !canEdit
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {isFlipping ? 'Flipping...' : 'Flip Coin'}
              </button>
            )}

            {step === 'result' && coinResult && (
              <div className="space-y-2 w-full">
                <button
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Result: {coinResult === 'heads' ? 'Heads' : 'Tails'}
                </button>
                <button
                  onClick={handleFlipAgain}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Flip Again
                </button>
              </div>
            )}
          </div>

          {/* Toss Winner Selection */}
          {step === 'result' && coinResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-900">Who won the toss?</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleSelectWinner(match.team_a_id, match.team_a_name)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    tossWinnerId === match.team_a_id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{match.team_a_name}</span>
                    {tossWinnerId === match.team_a_id && (
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleSelectWinner(match.team_b_id, match.team_b_name)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    tossWinnerId === match.team_b_id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{match.team_b_name}</span>
                    {tossWinnerId === match.team_b_id && (
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Toss Decision Selection */}
          {step === 'decision' && tossWinnerId && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  What did {winnerTeamName || (tossWinnerId === match.team_a_id ? match.team_a_name : match.team_b_name)} choose?
                </h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setTossDecision('bat')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    tossDecision === 'bat'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Bat First</span>
                    {tossDecision === 'bat' && (
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setTossDecision('bowl')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    tossDecision === 'bowl'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Bowl First</span>
                    {tossDecision === 'bowl' && (
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Locked Message (if toss already completed) */}
          {isTossCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Toss Completed:</strong> {winnerTeamName || (match.toss_winner_id === match.team_a_id ? match.team_a_name : match.team_b_name)} won the toss and chose to {match.toss_decision === 'bat' ? 'bat first' : 'bowl first'}. This result cannot be changed.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {canEdit && (
              <button
                onClick={resetToss}
                disabled={step === 'flip' && !coinResult}
                className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={!tossWinnerId || !tossDecision || saving}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 text-sm ${
                  !tossWinnerId || !tossDecision || saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Toss'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TossModal;

