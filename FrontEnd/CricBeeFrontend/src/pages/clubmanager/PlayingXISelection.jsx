import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { Users, CheckCircle, ArrowLeft, Save, Crown, Award } from 'lucide-react';
import { getClubPlayersForMatch, setPlayingXI, getPlayingXI } from '@/api/clubmanager/fixture';

export default function PlayingXISelection() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadPlayers();
      loadExistingPlayingXI();
    }
  }, [matchId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await getClubPlayersForMatch(matchId);
      setPlayers(response.players || []);
    } catch (error) {
      console.error('Failed to load players:', error);
      alert('Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPlayingXI = async () => {
    try {
      const playingXI = await getPlayingXI(matchId);
      if (playingXI && playingXI.length > 0) {
        const playerIds = new Set(playingXI.map(pxi => pxi.player_id));
        setSelectedPlayers(playerIds);
        
        const captain = playingXI.find(pxi => pxi.is_captain);
        const viceCaptain = playingXI.find(pxi => pxi.is_vice_captain);
        
        if (captain) setCaptainId(captain.player_id);
        if (viceCaptain) setViceCaptainId(viceCaptain.player_id);
      }
    } catch (error) {
      console.error('Failed to load existing Playing XI:', error);
      // It's okay if there's no existing Playing XI
    }
  };

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
        // Clear captain/vice-captain if this player was deselected
        if (captainId === playerId) {
          setCaptainId(null);
        }
        if (viceCaptainId === playerId) {
          setViceCaptainId(null);
        }
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleSetCaptain = (playerId, e) => {
    e.stopPropagation();
    if (captainId === playerId) {
      setCaptainId(null);
    } else {
      setCaptainId(playerId);
      // If same player was vice-captain, remove vice-captain
      if (viceCaptainId === playerId) {
        setViceCaptainId(null);
      }
    }
  };

  const handleSetViceCaptain = (playerId, e) => {
    e.stopPropagation();
    if (viceCaptainId === playerId) {
      setViceCaptainId(null);
    } else {
      setViceCaptainId(playerId);
      // If same player was captain, remove captain
      if (captainId === playerId) {
        setCaptainId(null);
      }
    }
  };

  const handleSave = async () => {
    if (selectedPlayers.size === 0) {
      alert('Please select at least one player for Playing XI');
      return;
    }

    try {
      setSaving(true);
      const playerIds = Array.from(selectedPlayers);
      await setPlayingXI(matchId, playerIds, captainId, viceCaptainId);
      alert(`Playing XI saved successfully! ${selectedPlayers.size} player(s) selected.`);
      navigate('/clubmanager/fixtures');
    } catch (error) {
      console.error('Failed to save Playing XI:', error);
      alert(error.response?.data?.detail || 'Failed to save Playing XI. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="Select Playing XI" profilePath="/clubmanager/profile">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/clubmanager/fixtures')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Fixtures</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Playing XI</h1>
            <p className="text-gray-600">Select players for the match and assign captain/vice-captain</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Selected Players</h3>
                  <p className="text-sm text-gray-600">
                    {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} selected
                    {captainId && ' • Captain set'}
                    {viceCaptainId && ' • Vice-Captain set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg ${
                  selectedPlayers.size > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className="font-semibold">
                    {selectedPlayers.size > 0 ? `${selectedPlayers.size} selected` : 'No players selected'}
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={selectedPlayers.size === 0 || saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Playing XI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading players...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Users size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No players available</p>
              <p className="text-gray-400 text-sm">Add players to your club first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => {
                const isSelected = selectedPlayers.has(player.player_profile.id);
                
                return (
                  <div
                    key={player.id}
                    className={`bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => togglePlayerSelection(player.player_profile.id)}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-lg font-bold">
                            {player.user?.full_name?.charAt(0).toUpperCase() || 'P'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 truncate">
                            {player.user?.full_name || 'Unknown Player'}
                          </h5>
                          <p className="text-sm text-gray-500 truncate">
                            {player.player_profile?.cricb_id || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-2">
                          <CheckCircle size={24} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={(e) => handleSetCaptain(player.player_profile.id, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            captainId === player.player_profile.id
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Crown size={16} />
                          {captainId === player.player_profile.id ? 'Captain' : 'Set Captain'}
                        </button>
                        <button
                          onClick={(e) => handleSetViceCaptain(player.player_profile.id, e)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            viceCaptainId === player.player_profile.id
                              ? 'bg-purple-500 text-white hover:bg-purple-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Award size={16} />
                          {viceCaptainId === player.player_profile.id ? 'Vice-Captain' : 'Set VC'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {players.length > 0 && selectedPlayers.size === 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Select players from your club to add them to the Playing XI. You can select any number of players.
              </p>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}

