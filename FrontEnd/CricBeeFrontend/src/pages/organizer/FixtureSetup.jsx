import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyTournaments, getEnrolledClubs } from '@/api/organizer/tournament';
import { 
  getTournamentRounds,
  initializeDefaultRounds,
  updateRoundName,
  createMatch,
  getRoundMatches,
  toggleMatchPublish,
  updateMatchDetails,
  generateLeagueMatches,
  getLeagueStandings,
  generateSemiFinals,
  generateFinal
} from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Plus, Edit2, Check, X, Trophy, Calendar, Clock, MapPin, Globe, EyeOff, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

const FixtureSetup = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  
  const [tournament, setTournament] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundMatches, setRoundMatches] = useState([]);
  const [leagueStandings, setLeagueStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRound, setEditingRound] = useState(null);
  const [editRoundName, setEditRoundName] = useState('');
  const [updatingRoundName, setUpdatingRoundName] = useState(false);
  
  // Match form state
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState({
    match_number: '',
    team_a_id: '',
    team_b_id: '',
    match_date: '',
    match_time: '',
    venue: ''
  });
  const [creatingMatch, setCreatingMatch] = useState(false);
  
  // Edit match state
  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchForm, setEditMatchForm] = useState({
    match_date: '',
    match_time: '',
    venue: ''
  });
  const [updatingMatch, setUpdatingMatch] = useState(false);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedRound) {
      loadRoundMatches(selectedRound.id);
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tournament
      const tournaments = await getMyTournaments();
      const foundTournament = tournaments.find(t => t.id === parseInt(tournamentId));
      setTournament(foundTournament);
      
      // Load enrolled clubs
      const clubs = await getEnrolledClubs(tournamentId);
      const enrolledClubsList = clubs.filter(c => c.payment_status === 'success');
      setEnrolledClubs(enrolledClubsList);
      
      // Load or initialize rounds
      let roundsData = await getTournamentRounds(tournamentId);
      
      if (roundsData.length === 0) {
        // Initialize default 3 rounds
        roundsData = await initializeDefaultRounds(tournamentId);
      }
      
      setRounds(roundsData);
      
      // If League mode (fixture_mode_id === 2), auto-generate matches for Round 1
      if (foundTournament?.fixture_mode_id === 2 && roundsData.length > 0) {
        const leagueRound = roundsData.find(r => r.round_no === 1 || r.round_name === 'League');
        if (leagueRound) {
          try {
            const existingMatches = await getRoundMatches(leagueRound.id, tournamentId);
            if (existingMatches.length === 0) {
              // Auto-generate matches for Round 1 if they don't exist
              await generateLeagueMatches(leagueRound.id, tournamentId);
              // Reload matches
              const updatedMatches = await getRoundMatches(leagueRound.id, tournamentId);
              setRoundMatches(updatedMatches);
            }
          } catch (error) {
            console.error('Failed to auto-generate league matches:', error);
            // Don't show alert, just log the error
          }
        }
      }
      
      // Auto-select first round if available
      if (roundsData.length > 0 && !selectedRound) {
        setSelectedRound(roundsData[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to load tournament data' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoundMatches = async (roundId) => {
    try {
      const matches = await getRoundMatches(roundId, tournamentId);
      setRoundMatches(matches);
      
      // If League mode and Round 1, load standings
      if (tournament?.fixture_mode_id === 2 && selectedRound?.round_no === 1) {
        try {
          const standings = await getLeagueStandings(tournamentId, roundId);
          setLeagueStandings(standings.standings || []);
        } catch (error) {
          console.error('Failed to load standings:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const handleEditRoundName = (round) => {
    setEditingRound(round.id);
    setEditRoundName(round.round_name);
  };

  const handleSaveRoundName = async (roundId) => {
    try {
      setUpdatingRoundName(true);
      await updateRoundName(roundId, editRoundName);
      setEditingRound(null);
      await loadData();
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Round name updated successfully!' });
    } catch (error) {
      console.error('Failed to update round name:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to update round name' });
    } finally {
      setUpdatingRoundName(false);
    }
  };

  const handleCancelEditRoundName = () => {
    setEditingRound(null);
    setEditRoundName('');
  };

  const handleGenerateLeagueMatches = async () => {
    if (!selectedRound || selectedRound.round_no !== 1) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'League matches can only be generated for Round 1' });
      return;
    }

    try {
      await generateLeagueMatches(selectedRound.id, tournamentId);
      await loadRoundMatches(selectedRound.id);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'League matches generated successfully!' });
    } catch (error) {
      console.error('Failed to generate league matches:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to generate league matches' });
    }
  };

  const handleGenerateSemiFinals = async () => {
    try {
      await generateSemiFinals(tournamentId);
      await loadData();
      // Select Round 2
      const round2 = rounds.find(r => r.round_no === 2);
      if (round2) {
        setSelectedRound(round2);
      }
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Semi-final matches generated successfully!' });
    } catch (error) {
      console.error('Failed to generate semi-finals:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to generate semi-finals' });
    }
  };

  const handleGenerateFinal = async () => {
    try {
      await generateFinal(tournamentId);
      await loadData();
      // Select Round 3
      const round3 = rounds.find(r => r.round_no === 3);
      if (round3) {
        setSelectedRound(round3);
      }
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Final match generated successfully!' });
    } catch (error) {
      console.error('Failed to generate final:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to generate final' });
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (matchForm.team_a_id === matchForm.team_b_id) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Team A and Team B cannot be the same' });
      return;
    }
    
    try {
      setCreatingMatch(true);
      const matchData = {
        round_id: selectedRound.id,
        tournament_id: parseInt(tournamentId),
        match_number: matchForm.match_number,
        team_a_id: parseInt(matchForm.team_a_id),
        team_b_id: parseInt(matchForm.team_b_id),
        match_date: matchForm.match_date,
        match_time: matchForm.match_time,
        venue: matchForm.venue
      };
      await createMatch(matchData);
      setMatchForm({
        match_number: '',
        team_a_id: '',
        team_b_id: '',
        match_date: '',
        match_time: '',
        venue: ''
      });
      setShowMatchForm(false);
      await loadRoundMatches(selectedRound.id);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Match created successfully!' });
    } catch (error) {
      console.error('Failed to create match:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to create match' });
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    const timeValue = match.match_time ? match.match_time.substring(0, 5) : '';
    setEditMatchForm({
      match_date: match.match_date,
      match_time: timeValue,
      venue: match.venue || ''
    });
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    
    try {
      setUpdatingMatch(true);
      await updateMatchDetails(editingMatch.id, editMatchForm);
      setEditingMatch(null);
      setEditMatchForm({ match_date: '', match_time: '', venue: '' });
      await loadRoundMatches(selectedRound.id);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Match details updated successfully!' });
    } catch (error) {
      console.error('Failed to update match:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to update match details' });
    } finally {
      setUpdatingMatch(false);
    }
  };

  const handleTogglePublish = async (matchId) => {
    try {
      const updatedMatch = await toggleMatchPublish(matchId);
      setRoundMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId 
            ? { ...match, is_fixture_published: updatedMatch.is_fixture_published }
            : match
        )
      );
      Swal.fire({ icon: 'success', title: 'Success!', text: updatedMatch.is_fixture_published ? 'Match published!' : 'Match unpublished!' });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to toggle publish status' });
    }
  };

  const isLeagueMode = tournament?.fixture_mode_id === 2;
  const isManualMode = tournament?.fixture_mode_id === 1;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fixture Setup</h1>
          <p className="text-gray-600">{tournament.tournament_name}</p>
          <p className="text-sm text-gray-500 mt-1">
            Mode: {isLeagueMode ? 'League Fixture' : isManualMode ? 'Manual Fixture' : 'Not Set'}
          </p>
        </div>

        {/* Mode Info Banner */}
        {isLeagueMode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-green-900 mb-1">League Fixture Mode Active</p>
            <p className="text-sm text-green-700">
              Round 1: League Stage (auto-generate) → Round 2: Semi Finals (Top 4) → Round 3: Final
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rounds Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rounds</h2>
              <div className="space-y-3">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRound?.id === round.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRound(round)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {editingRound === round.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editRoundName}
                            onChange={(e) => setEditRoundName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRoundName(round.id);
                            }}
                            disabled={updatingRoundName}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEditRoundName();
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-gray-900">{round.round_name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRoundName(round);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Round {round.round_no}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {round.number_of_matches} {round.number_of_matches === 1 ? 'match' : 'matches'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Matches Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedRound ? `${selectedRound.round_name} - Matches` : 'Select a Round'}
                </h2>
                {selectedRound && (
                  <div className="flex space-x-2">
                    {/* League Mode Actions */}
                    {isLeagueMode && selectedRound.round_no === 1 && roundMatches.length === 0 && (
                      <button
                        onClick={handleGenerateLeagueMatches}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                      >
                        <Sparkles size={18} />
                        <span>Generate League Matches</span>
                      </button>
                    )}
                    {isLeagueMode && selectedRound.round_no === 2 && roundMatches.length === 0 && (
                      <button
                        onClick={handleGenerateSemiFinals}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700"
                      >
                        <Sparkles size={18} />
                        <span>Generate Semi Finals</span>
                      </button>
                    )}
                    {isLeagueMode && selectedRound.round_no === 3 && roundMatches.length === 0 && (
                      <button
                        onClick={handleGenerateFinal}
                        className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700"
                      >
                        <Trophy size={18} />
                        <span>Generate Final</span>
                      </button>
                    )}
                    
                    {/* Manual Mode Actions */}
                    {isManualMode && !showMatchForm && (
                      <button
                        onClick={() => setShowMatchForm(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                      >
                        <Plus size={18} />
                        <span>Create Match</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!selectedRound ? (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Select a round to view matches</p>
                </div>
              ) : (
                <>
                  {/* Create Match Form */}
                  {showMatchForm && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Create New Match</h3>
                        <button
                          onClick={() => setShowMatchForm(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleCreateMatch} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match Number</label>
                            <input
                              type="text"
                              required
                              value={matchForm.match_number}
                              onChange={(e) => setMatchForm({ ...matchForm, match_number: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                            <input
                              type="text"
                              required
                              value={matchForm.venue}
                              onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team A</label>
                            <select
                              required
                              value={matchForm.team_a_id}
                              onChange={(e) => setMatchForm({ ...matchForm, team_a_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="">Select Team A</option>
                              {enrolledClubs.map((club) => (
                                <option key={club.club_id} value={club.club_id}>
                                  {club.club_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team B</label>
                            <select
                              required
                              value={matchForm.team_b_id}
                              onChange={(e) => setMatchForm({ ...matchForm, team_b_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="">Select Team B</option>
                              {enrolledClubs.map((club) => (
                                <option key={club.club_id} value={club.club_id}>
                                  {club.club_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match Date</label>
                            <input
                              type="date"
                              required
                              value={matchForm.match_date}
                              onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match Time</label>
                            <input
                              type="time"
                              required
                              value={matchForm.match_time}
                              onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={creatingMatch}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            {creatingMatch ? 'Creating...' : 'Create Match'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMatchForm(false)}
                            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Matches List */}
                  {roundMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No matches created yet</p>
                      {isLeagueMode && selectedRound.round_no === 1 && (
                        <p className="text-sm text-gray-500 mt-2">Click "Generate League Matches" to auto-create matches</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roundMatches.map((match) => (
                        <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                          {editingMatch?.id === match.id ? (
                            <form onSubmit={handleUpdateMatch} className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                  <input
                                    type="date"
                                    required
                                    value={editMatchForm.match_date}
                                    onChange={(e) => setEditMatchForm({ ...editMatchForm, match_date: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                  <input
                                    type="time"
                                    required
                                    value={editMatchForm.match_time}
                                    onChange={(e) => setEditMatchForm({ ...editMatchForm, match_time: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Venue</label>
                                  <input
                                    type="text"
                                    required
                                    value={editMatchForm.venue}
                                    onChange={(e) => setEditMatchForm({ ...editMatchForm, venue: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={updatingMatch}
                                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700"
                                >
                                  {updatingMatch ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMatch(null)}
                                  className="flex-1 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-900">
                                  {match.team_a_name} vs {match.team_b_name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditMatch(match)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleTogglePublish(match.id)}
                                    className={`p-1 rounded ${
                                      match.is_fixture_published
                                        ? 'text-green-600 hover:text-green-700'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                  >
                                    {match.is_fixture_published ? <Globe size={16} /> : <EyeOff size={16} />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  {match.match_date}
                                </span>
                                <span className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  {match.match_time}
                                </span>
                                <span className="flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {match.venue}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                {match.match_number} • {match.is_fixture_published ? 'Published' : 'Draft'}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* League Standings */}
                  {isLeagueMode && selectedRound.round_no === 1 && leagueStandings.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">League Standings</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pos</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Team</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">M</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">W</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">L</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {leagueStandings.map((team, index) => (
                              <tr key={team.team_id} className={index < 4 ? 'bg-green-50' : ''}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-gray-900">{team.team_name}</td>
                                <td className="px-4 py-2 text-center text-sm text-gray-600">{team.matches_played}</td>
                                <td className="px-4 py-2 text-center text-sm text-green-600 font-semibold">{team.wins}</td>
                                <td className="px-4 py-2 text-center text-sm text-red-600">{team.losses}</td>
                                <td className="px-4 py-2 text-center text-sm font-bold text-blue-600">{team.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-2">Top 4 teams (highlighted) qualify for Semi Finals</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FixtureSetup;
