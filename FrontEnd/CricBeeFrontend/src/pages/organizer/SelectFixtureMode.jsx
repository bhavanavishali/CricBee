import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyTournaments } from '@/api/organizer/tournament';
import { getFixtureModes, setTournamentFixtureMode } from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, CheckCircle, List, Trophy } from 'lucide-react';

const SelectFixtureMode = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  
  const [tournament, setTournament] = useState(null);
  const [fixtureModes, setFixtureModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tournament
      const tournaments = await getMyTournaments();
      const foundTournament = tournaments.find(t => t.id === parseInt(tournamentId));
      setTournament(foundTournament);
      
      // Load fixture modes
      const modes = await getFixtureModes();
      setFixtureModes(modes);
      
      // If tournament already has a fixture mode, pre-select it
      if (foundTournament?.fixture_mode_id) {
        setSelectedMode(foundTournament.fixture_mode_id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load fixture modes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMode) {
      alert('Please select a fixture mode');
      return;
    }

    try {
      setSaving(true);
      await setTournamentFixtureMode(tournamentId, selectedMode);
      alert('Fixture mode saved successfully!');
      // Redirect to fixture setup page
      navigate(`/organizer/tournaments/${tournamentId}/fixtures`);
    } catch (error) {
      console.error('Failed to save fixture mode:', error);
      alert(error.response?.data?.detail || 'Failed to save fixture mode');
    } finally {
      setSaving(false);
    }
  };

  const getModeIcon = (modeId) => {
    if (modeId === 1) return <List size={48} className="text-blue-600" />;
    if (modeId === 2) return <Trophy size={48} className="text-green-600" />;
    return <CheckCircle size={48} className="text-gray-600" />;
  };

  const getModeDescription = (modeId) => {
    if (modeId === 1) {
      return 'Manually create rounds and matches. You have full control over the fixture structure and can add as many rounds as needed.';
    }
    if (modeId === 2) {
      return 'Automatic league format with 3 rounds: League Stage (Round-Robin) → Semi Finals (Top 4) → Final. Matches and progression are auto-generated.';
    }
    return '';
  };

  const getModeFeatures = (modeId) => {
    if (modeId === 1) {
      return [
        'Create custom rounds',
        'Manually select teams for each match',
        'Add additional rounds anytime',
        'Full flexibility in fixture structure'
      ];
    }
    if (modeId === 2) {
      return [
        'Auto-generate Round 1 (League) matches',
        'Automatic points table calculation',
        'Top 4 teams qualify for Semi Finals',
        'Winners progress to Final automatically'
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="text-center py-12">
            <p className="text-gray-600">Tournament not found</p>
            <button
              onClick={() => navigate('/organizer/manage-fixtures')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Go back to Manage Fixtures
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/organizer/manage-fixtures')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Manage Fixtures</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Fixture Mode</h1>
          <p className="text-gray-600">{tournament.tournament_name}</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Choose your fixture mode:</strong> This determines how matches will be organized and managed throughout your tournament.
          </p>
        </div>

        {/* Fixture Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {fixtureModes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedMode === mode.id
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getModeIcon(mode.id)}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{mode.mode_name}</h3>
                    <p className="text-sm text-gray-500">Mode ID: {mode.id}</p>
                  </div>
                </div>
                {selectedMode === mode.id && (
                  <CheckCircle size={24} className="text-blue-600" />
                )}
              </div>
              
              <p className="text-gray-600 mb-4">{getModeDescription(mode.id)}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Features:</p>
                <ul className="space-y-1">
                  {getModeFeatures(mode.id).map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <CheckCircle size={16} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={!selectedMode || saving}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
          <button
            onClick={() => navigate('/organizer/manage-fixtures')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SelectFixtureMode;
