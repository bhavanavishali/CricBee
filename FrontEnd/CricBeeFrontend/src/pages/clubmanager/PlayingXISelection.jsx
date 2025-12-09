import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { Users, CheckCircle, ArrowLeft, Save } from 'lucide-react';
import api from '@/api';
import { useSelector } from 'react-redux';

export default function PlayingXISelection() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadPlayers();
    }
  }, [matchId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      // Get club profile first to get club ID
      const profileResponse = await api.get('/club-profile/');
      const clubId = profileResponse.data.club?.id;
      
      if (!clubId) {
        alert('Club not found');
        navigate('/clubmanager/fixtures');
        return;
      }

      // Get club players
      const playersResponse = await api.get(`/club-profile/club/${clubId}/players`);
      setPlayers(playersResponse.data.players || []);
    } catch (error) {
      console.error('Failed to load players:', error);
      alert('Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        if (newSet.size >= 11) {
          alert('You can only select 11 players for Playing XI');
          return prev;
        }
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedPlayers.size !== 11) {
      alert('Please select exactly 11 players for Playing XI');
      return;
    }

    try {
      setSaving(true);
      // For now, just show success message
      // In a full implementation, you would save this to the backend
      alert('Playing XI saved successfully! (Note: This is a placeholder - backend implementation needed)');
      navigate('/clubmanager/fixtures');
    } catch (error) {
      console.error('Failed to save Playing XI:', error);
      alert('Failed to save Playing XI. Please try again.');
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
            <p className="text-gray-600">Select 11 players for the match</p>
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
                    {selectedPlayers.size} of 11 players selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg ${
                  selectedPlayers.size === 11 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  <span className="font-semibold">
                    {selectedPlayers.size === 11 ? 'Complete' : `${11 - selectedPlayers.size} more needed`}
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={selectedPlayers.size !== 11 || saving}
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
                    onClick={() => togglePlayerSelection(player.player_profile.id)}
                    className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
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
                  </div>
                );
              })}
            </div>
          )}

          {players.length > 0 && selectedPlayers.size < 11 && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> You need to select {11 - selectedPlayers.size} more player{11 - selectedPlayers.size !== 1 ? 's' : ''} to complete the Playing XI.
              </p>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}

