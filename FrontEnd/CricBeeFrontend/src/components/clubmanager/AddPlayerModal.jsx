import React, { useState } from 'react';
import { X, Search, User, Mail, Phone, MapPin, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { searchPlayerByCricbId, invitePlayerToClub } from '@/api/clubService';

const AddPlayerModal = ({ isOpen, onClose, clubId, onPlayerAdded }) => {
  const [cricbId, setCricbId] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!cricbId.trim()) {
      setError('Please enter a CricB ID');
      return;
    }

    setSearching(true);
    setError(null);
    setPlayerData(null);

    const result = await searchPlayerByCricbId(clubId, cricbId.trim().toUpperCase());
    
    if (result.success) {
      setPlayerData(result.data);
      if (result.data.is_already_in_club) {
        setError('This player is already in your club');
      } else if (result.data.is_already_in_any_club) {
        setError(`Player is already a member of "${result.data.current_club?.club_name}". Players cannot be members of multiple clubs.`);
      } else if (result.data.has_pending_invitation) {
        setError('A pending invitation already exists for this player');
      }
    } else {
      setError(result.message || 'Player not found');
    }
    
    setSearching(false);
  };

  const handleInvitePlayer = async () => {
    if (!playerData || playerData.is_already_in_club || playerData.is_already_in_any_club || playerData.has_pending_invitation) return;

    setAdding(true);
    setError(null);

    const result = await invitePlayerToClub(clubId, cricbId.trim().toUpperCase());
    
    if (result.success) {
      onPlayerAdded?.(result.data);
      handleClose();
    } else {
      setError(result.message || 'Failed to send invitation');
    }
    
    setAdding(false);
  };

  const handleClose = () => {
    setCricbId('');
    setPlayerData(null);
    setError(null);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Invite Player to Club</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter CricB ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cricbId}
              onChange={(e) => setCricbId(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="e.g., CRICB000001"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !cricbId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={20} />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && !playerData && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Player Details Section */}
        {playerData && (
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Player Details</h3>
                {playerData.is_already_in_any_club ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <AlertCircle size={16} />
                    Player Already in a Club
                  </span>
                ) : playerData.is_already_in_club ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <AlertCircle size={16} />
                    Already in Club
                  </span>
                ) : playerData.has_pending_invitation ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Clock size={16} />
                    Pending Invitation
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={16} />
                    Player is Available
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">{playerData.user.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-gray-400 font-bold">ID</div>
                  <div>
                    <p className="text-sm text-gray-500">CricB ID</p>
                    <p className="font-medium text-gray-800">{playerData.player_profile.cricb_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{playerData.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{playerData.user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium text-gray-800">{playerData.player_profile.age} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">{playerData.player_profile.address}</p>
                  </div>
                </div>

                {playerData.is_already_in_any_club && playerData.current_club && (
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 font-bold">C</div>
                    <div>
                      <p className="text-sm text-gray-500">Current Club</p>
                      <p className="font-medium text-gray-800">{playerData.current_club.club_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {error && playerData && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvitePlayer}
                  disabled={adding || playerData.is_already_in_club || playerData.is_already_in_any_club || playerData.has_pending_invitation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlayerModal;

