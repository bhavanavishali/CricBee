import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyTournaments, getEnrolledClubs } from '@/api/organizer/tournament';
import { 
  createFixtureRound, 
  getTournamentRounds, 
  createMatch, 
  getRoundMatches,
  toggleMatchPublish
} from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import TossModal from '@/components/organizer/TossModal';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Users, Trophy, X, Check, Globe, EyeOff, RotateCcw, Play } from 'lucide-react';

const TournamentFixtures = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('rounds'); // 'rounds' or 'matches'
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundMatches, setRoundMatches] = useState([]);
  
  // Round form state
  const [roundForm, setRoundForm] = useState({
    round_name: '',
    number_of_matches: 1
  });
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  
  // Match form state
  const [matchForm, setMatchForm] = useState({
    match_number: '',
    team_a_id: '',
    team_b_id: '',
    match_date: '',
    match_time: '',
    venue: ''
  });
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [selectedMatchForToss, setSelectedMatchForToss] = useState(null);

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
      
      // Load enrolled clubs (only clubs with successful payment are considered enrolled)
      const clubs = await getEnrolledClubs(tournamentId);
      // Filter to only show clubs that have successfully paid (actually enrolled)
      const enrolledClubsList = clubs.filter(c => c.payment_status === 'success');
      setEnrolledClubs(enrolledClubsList);
      
      // Log for debugging
      console.log('Enrolled clubs loaded:', enrolledClubsList.length, 'clubs');
      
      // Load rounds
      const roundsData = await getTournamentRounds(tournamentId);
      setRounds(roundsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const loadRoundMatches = async (roundId) => {
    try {
      const matches = await getRoundMatches(roundId);
      setRoundMatches(matches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      setCreatingRound(true);
      const roundData = {
        tournament_id: parseInt(tournamentId),
        round_name: roundForm.round_name,
        number_of_matches: parseInt(roundForm.number_of_matches)
      };
      await createFixtureRound(roundData);
      setRoundForm({ round_name: '', number_of_matches: 1 });
      setShowRoundForm(false);
      await loadData();
      alert('Round created successfully!');
    } catch (error) {
      console.error('Failed to create round:', error);
      alert(error.response?.data?.detail || 'Failed to create round');
    } finally {
      setCreatingRound(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (matchForm.team_a_id === matchForm.team_b_id) {
      alert('Team A and Team B cannot be the same');
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
      alert('Match created successfully!');
    } catch (error) {
      console.error('Failed to create match:', error);
      alert(error.response?.data?.detail || 'Failed to create match');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleSelectRound = (round) => {
    setSelectedRound(round);
    setStep('matches');
    setShowMatchForm(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Convert HH:MM:SS to HH:MM if needed
    return timeString.substring(0, 5);
  };

  const handleTogglePublish = async (matchId, currentStatus) => {
    try {
      const updatedMatch = await toggleMatchPublish(matchId);
      // Update the match in the local state
      setRoundMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId 
            ? { ...match, is_fixture_published: updatedMatch.is_fixture_published }
            : match
        )
      );
      alert(updatedMatch.is_fixture_published ? 'Match published successfully!' : 'Match unpublished successfully!');
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert(error.response?.data?.detail || 'Failed to toggle publish status');
    }
  };

  const handleOpenToss = (match) => {
    // Check preconditions: match must be published and status should be "toss_pending"
    if (!match.is_fixture_published) {
      alert('Please publish the match before conducting the toss.');
      return;
    }
    if (match.match_status && match.match_status !== 'toss_pending' && match.match_status !== 'upcoming') {
      if (match.toss_winner_id && match.toss_decision) {
        // Toss already completed, just show it
        setSelectedMatchForToss(match);
        setShowTossModal(true);
        return;
      } else {
        alert('Match status does not allow toss at this time.');
        return;
      }
    }
    setSelectedMatchForToss(match);
    setShowTossModal(true);
  };

  const handleTossSaved = async () => {
    // Reload matches to get updated toss info
    if (selectedRound) {
      await loadRoundMatches(selectedRound.id);
    }
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
            onClick={() => {
              if (step === 'matches') {
                setStep('rounds');
                setSelectedRound(null);
              } else {
                navigate('/organizer/manage-fixtures');
              }
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>{step === 'matches' ? 'Back to Rounds' : 'Back to Manage Fixtures'}</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'rounds' ? 'Create Fixture Rounds' : `Matches - ${selectedRound?.round_name}`}
          </h1>
          <p className="text-gray-600">{tournament.tournament_name}</p>
        </div>

        {step === 'rounds' ? (
          /* Round Step */
          <div className="space-y-6">
            {/* Create Round Form */}
            {showRoundForm ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create New Round</h2>
                  <button
                    onClick={() => {
                      setShowRoundForm(false);
                      setRoundForm({ round_name: '', number_of_matches: 1 });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateRound} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Round Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={roundForm.round_name}
                      onChange={(e) => setRoundForm({ ...roundForm, round_name: e.target.value })}
                      placeholder="e.g., Quarter Finals, Semi Finals, Finals"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Matches <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={roundForm.number_of_matches}
                      onChange={(e) => setRoundForm({ ...roundForm, number_of_matches: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creatingRound}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {creatingRound ? 'Creating...' : 'Create Round'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoundForm(false);
                        setRoundForm({ round_name: '', number_of_matches: 1 });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowRoundForm(true)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Create New Round</span>
              </button>
            )}

            {/* Rounds List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fixture Rounds</h2>
              {rounds.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No rounds created yet</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first round to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectRound(round)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{round.round_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {round.number_of_matches} {round.number_of_matches === 1 ? 'match' : 'matches'}
                        </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">View Matches</span>
                          <ArrowLeft size={20} className="text-gray-400 rotate-180" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Match Step */
          <div className="space-y-6">
            {/* Create Match Form */}
            {showMatchForm ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Match</h2>
                    {enrolledClubs.length === 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        No enrolled clubs available. Please ensure clubs have enrolled and paid for this tournament.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowMatchForm(false);
                      setMatchForm({
                        match_number: '',
                        team_a_id: '',
                        team_b_id: '',
                        match_date: '',
                        match_time: '',
                        venue: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={matchForm.match_number}
                      onChange={(e) => setMatchForm({ ...matchForm, match_number: e.target.value })}
                      placeholder="e.g., Match 1, Match 2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team A <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        disabled={enrolledClubs.length === 0}
                        value={matchForm.team_a_id}
                        onChange={(e) => setMatchForm({ ...matchForm, team_a_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Team A</option>
                        {enrolledClubs.length > 0 ? (
                          enrolledClubs.map((club) => (
                            <option key={club.club_id} value={club.club_id}>
                              {club.club_name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No enrolled clubs available</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team B <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        disabled={enrolledClubs.length === 0}
                        value={matchForm.team_b_id}
                        onChange={(e) => setMatchForm({ ...matchForm, team_b_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Team B</option>
                        {enrolledClubs.length > 0 ? (
                          enrolledClubs.map((club) => (
                            <option key={club.club_id} value={club.club_id}>
                              {club.club_name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No enrolled clubs available</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Match Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={matchForm.match_date}
                        onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Match Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={matchForm.match_time}
                        onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={matchForm.venue}
                      onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                      placeholder="Enter venue name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creatingMatch}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {creatingMatch ? 'Creating...' : 'Create Match'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMatchForm(false);
                        setMatchForm({
                          match_number: '',
                          team_a_id: '',
                          team_b_id: '',
                          match_date: '',
                          match_time: '',
                          venue: ''
                        });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowMatchForm(true)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Create New Match</span>
              </button>
            )}

            {/* Matches List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Matches in {selectedRound?.round_name}</h2>
              {roundMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No matches created yet</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first match to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roundMatches.map((match) => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{match.match_number}</h3>
                            {match.is_fixture_published && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <Globe size={12} className="mr-1" />
                                Published
                              </span>
                            )}
                            {!match.is_fixture_published && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                <EyeOff size={12} className="mr-1" />
                                Unpublished
                              </span>
                            )}
                            {match.match_status === 'toss_pending' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                Toss Pending
                              </span>
                            )}
                            {match.match_status === 'toss_completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Toss Completed
                              </span>
                            )}
                            {match.match_status === 'live' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                🔴 Live
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users size={16} className="text-gray-600" />
                              <span className="font-semibold">{match.team_a_name}</span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-semibold">{match.team_b_name}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-gray-600">
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                <span>{new Date(match.match_date).toLocaleDateString('en-GB')}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock size={16} className="mr-2" />
                                <span>{formatTime(match.match_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-2" />
                                <span>{match.venue}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenToss(match)}
                              disabled={!match.is_fixture_published}
                              className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1 ${
                                match.is_fixture_published
                                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={match.is_fixture_published ? 'Digital Toss' : 'Publish match first'}
                            >
                              <RotateCcw size={16} />
                              <span>Toss</span>
                            </button>
                            <button
                              onClick={() => navigate(`/organizer/matches/${match.id}/live-scoring`, { state: { match } })}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-1"
                              title="Live Scoring"
                            >
                              <Play size={16} />
                              <span>Score</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleTogglePublish(match.id, match.is_fixture_published)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              match.is_fixture_published
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {match.is_fixture_published ? (
                              <span className="flex items-center space-x-1">
                                <EyeOff size={16} />
                                <span>Unpublish</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1">
                                <Globe size={16} />
                                <span>Publish</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toss Modal */}
        {showTossModal && selectedMatchForToss && (
          <TossModal
            isOpen={showTossModal}
            onClose={() => {
              setShowTossModal(false);
              setSelectedMatchForToss(null);
            }}
            match={selectedMatchForToss}
            onTossSaved={handleTossSaved}
          />
        )}
      </div>
    </Layout>
  );
};

export default TournamentFixtures;

