import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyTournaments, getEnrolledClubs, getClubDetails } from '@/api/organizer/tournament';
import { getTournamentMatches } from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, MapPin, Calendar, Trophy, Users, DollarSign, 
  CheckCircle, Clock, Star, Ban, User as UserIcon, X
} from 'lucide-react';

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubPlayers, setClubPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [id]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      // Load tournament details
      const tournaments = await getMyTournaments();
      const foundTournament = tournaments.find(t => t.id === parseInt(id));
      setTournament(foundTournament);

      // Load enrolled clubs
      try {
        const clubs = await getEnrolledClubs(id);
        setEnrolledClubs(clubs);
      } catch (error) {
        console.error('Failed to load enrolled clubs:', error);
      }

      // Load fixtures
      try {
        const fixtureData = await getTournamentMatches(id);
        setFixtures(fixtureData);
      } catch (error) {
        console.error('Failed to load fixtures:', error);
      }
    } catch (error) {
      console.error('Failed to load tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
      'registration_open': { label: 'Registration Open', color: 'bg-green-100 text-green-800' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-100 text-orange-800' },
      'tournament_start': { label: 'Tournament Start', color: 'bg-red-100 text-red-800' },
      'tournament_end': { label: 'Tournament End', color: 'bg-green-100 text-green-800' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const getMatchStatusBadge = (status) => {
    const statusMap = {
      'scheduled': { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
      'toss_pending': { label: 'Toss Pending', color: 'bg-yellow-100 text-yellow-800' },
      'toss_completed': { label: 'Conduct Toss', color: 'bg-orange-100 text-orange-800' },
      'live': { label: 'Live', color: 'bg-red-100 text-red-800' },
      'completed': { label: 'Match Started', color: 'bg-green-100 text-green-800' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentStatusBadge = (status) => {
    if (status === 'success') return { label: 'Paid', color: 'bg-green-100 text-green-800' };
    if (status === 'pending') return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Failed', color: 'bg-red-100 text-red-800' };
  };

  
  const calculatePointsTable = () => {
    const teams = {};
    
    // Initialize teams from enrolled clubs
    enrolledClubs.forEach(club => {
      if (club.payment_status === 'success') {
        teams[club.club_id] = {
          name: club.club_name,
          matches: 0,
          wins: 0,
          losses: 0,
          points: 0,
          nrr: 0
        };
      }
    });

    // Calculate from completed fixtures
    fixtures.forEach(match => {
      if (match.match_status === 'completed' && match.winner_id) {
        if (teams[match.team_a_id]) {
          teams[match.team_a_id].matches++;
          if (match.winner_id === match.team_a_id) {
            teams[match.team_a_id].wins++;
            teams[match.team_a_id].points += 2;
          } else {
            teams[match.team_a_id].losses++;
          }
        }
        if (teams[match.team_b_id]) {
          teams[match.team_b_id].matches++;
          if (match.winner_id === match.team_b_id) {
            teams[match.team_b_id].wins++;
            teams[match.team_b_id].points += 2;
          } else {
            teams[match.team_b_id].losses++;
          }
        }
      }
    });

    return Object.values(teams).sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  };

  const pointsTable = calculatePointsTable();

  // Handle viewing squad
  const handleViewSquad = async (club) => {
    setSelectedClub(club);
    setShowSquadModal(true);
    setLoadingPlayers(true);
    
    try {
      // Pass tournament_id as query parameter to get Playing XI data
      console.log('Fetching club details for club_id:', club.club_id, 'tournament_id:', id);
      const clubDetailsResponse = await getClubDetails(club.club_id, id);
      console.log('Club details response:', clubDetailsResponse);
      
      // The API now returns players array with Playing XI information
      const players = clubDetailsResponse.players || [];
      console.log('Players:', players);
      setClubPlayers(players);
    } catch (error) {
      console.error('Failed to load club details:', error);
      console.error('Error details:', error.response?.data || error.message);
      setClubPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const closeSquadModal = () => {
    setShowSquadModal(false);
    setSelectedClub(null);
    setClubPlayers([]);
  };

  // Timeline data
  const getTimeline = () => {
    if (!tournament) return [];
    
    const timeline = [];
    timeline.push({
      label: 'Tournament Created',
      date: tournament.created_at ? formatDate(tournament.created_at) : '',
      completed: true
    });

    if (tournament.details?.registration_start_date) {
      timeline.push({
        label: 'Enrollment Opened',
        date: formatDate(tournament.details.registration_start_date),
        completed: tournament.status !== 'pending_payment'
      });
    }

    if (tournament.details?.registration_end_date) {
      const enrollmentClosed = new Date() > new Date(tournament.details.registration_end_date);
      timeline.push({
        label: 'Enrollment Closed',
        date: formatDate(tournament.details.registration_end_date),
        completed: enrollmentClosed
      });
    }

    if (fixtures.length > 0) {
      timeline.push({
        label: 'Fixtures Generated',
        date: formatDate(tournament.created_at),
        completed: true
      });
    }

    if (tournament.details?.start_date) {
      const started = tournament.status === 'tournament_start' || tournament.status === 'tournament_end';
      timeline.push({
        label: 'Tournament Started',
        date: formatDate(tournament.details.start_date),
        completed: started
      });
    }

    if (tournament.details?.end_date) {
      timeline.push({
        label: 'Tournament Ends',
        date: formatDate(tournament.details.end_date),
        completed: tournament.status === 'tournament_end'
      });
    }

    return timeline;
  };

  const timeline = getTimeline();

  // Get tournament statistics
  const stats = {
    followers: 1250, // Mock data - would come from backend
    totalMatches: fixtures.length,
    completedMatches: fixtures.filter(f => f.match_status === 'completed').length,
    liveMatches: fixtures.filter(f => f.match_status === 'live').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading tournament details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Tournament not found</p>
            <button
              onClick={() => navigate('/organizer/manage-matches')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/organizer/manage-matches')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back</span>
          </button>

          {/* Tournament Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 mb-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{tournament.tournament_name}</h1>
                <p className="text-indigo-100 text-lg">
                  {tournament.details?.organization_name || tournament.organizer?.organization?.organization_name || 'Tournament Organizer'}
                </p>
              </div>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                <Users size={18} />
                Follow
              </button>
            </div>
          </div>

          {/* Winner Banner - Show when tournament is completed and has a winner */}
          {(tournament.status === 'completed' || tournament.status === 'tournament_end') && tournament.winner_team_id && (
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-lg p-6 mb-6 shadow-xl border-4 border-yellow-500">
              <div className="flex items-center justify-center gap-4">
                <Trophy size={48} className="text-white animate-pulse" />
                <div className="text-center">
                  <p className="text-white text-lg font-semibold mb-1">🏆 Tournament Champion 🏆</p>
                  <p className="text-white text-3xl font-bold">
                    {tournament.winner_team?.club_name || enrolledClubs.find(c => c.club_id === tournament.winner_team_id)?.club_name || 'Winner'}
                  </p>
                  <p className="text-white text-sm mt-1 opacity-90">
                    Congratulations to the tournament winners!
                  </p>
                </div>
                <Trophy size={48} className="text-white animate-pulse" />
              </div>
            </div>
          )}

          {/* Basic Tournament Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {tournament.details?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">{tournament.details.location}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Users className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Teams</p>
                  <p className="font-semibold text-gray-900">{tournament.details?.team_range || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Trophy className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Prize Pool</p>
                  <p className="font-semibold text-gray-900">
                    ₹{tournament.details?.prize_pool ? parseFloat(tournament.details.prize_pool).toLocaleString('en-IN') : tournament.payment?.amount ? parseFloat(tournament.payment.amount).toLocaleString('en-IN') : '50,000'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserIcon className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block ${statusBadge.color} text-xs font-semibold px-3 py-1 rounded-full`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Tournament Dates</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(tournament.details?.start_date)} - {formatDate(tournament.details?.end_date)}
                  </p>
                </div>
              </div>

              {/* Add View Enrolled Clubs and Manage Fixtures buttons */}
              <div className="md:col-span-3 flex gap-3 mt-2">
                <button
                  onClick={() => navigate(`/organizer/tournaments/${id}/fixtures`)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Calendar size={18} />
                  Manage Fixtures
                </button>
                <button
                  onClick={() => navigate(`/organizer/tournaments/${id}/enrolled-clubs`)}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  <Users size={18} />
                  View Enrolled Clubs
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('fixtures')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === 'fixtures'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Fixtures
                </button>
                <button
                  onClick={() => setActiveTab('points')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === 'points'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Points Table
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === 'teams'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Teams
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === 'live'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Live
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Tournament Status */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Trophy size={20} />
                      Tournament Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`${statusBadge.color} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrollment:</span>
                        <span className="font-semibold">{enrolledClubs.filter(c => c.payment_status === 'success').length}/{tournament.details?.team_range || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teams:</span>
                        <span className="font-semibold">{tournament.details?.team_range || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entry Fee:</span>
                        <span className="font-semibold">₹{tournament.details?.enrollment_fee ? parseFloat(tournament.details.enrollment_fee).toLocaleString('en-IN') : '5,000'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prize Pool:</span>
                        <span className="font-semibold text-green-600">₹{tournament.payment?.amount ? parseFloat(tournament.payment.amount).toLocaleString('en-IN') : '50,000'}</span>
                      </div>
                    </div>
                  </div>


                  {/* Description */}
                  {tournament.details?.venue_details && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">About Tournament</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {tournament.details.venue_details}
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* Fixtures Tab */}
              {activeTab === 'fixtures' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">All Fixtures</h2>
                  {fixtures.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No fixtures scheduled yet</p>
                    </div>
                  ) : (
                    fixtures.map((match) => {
                      const matchStatus = getMatchStatusBadge(match.match_status);
                      return (
                        <div key={match.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                {match.team_a_name} vs {match.team_b_name}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {formatDate(match.match_date)} at {formatTime(match.match_time)}
                                </span>
                                {match.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {match.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`${matchStatus.color} text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap`}>
                              {matchStatus.label}
                            </span>
                          </div>
                          {match.match_status === 'live' && (
                            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 font-medium">
                              🔴 Match in progress
                            </div>
                          )}
                          {match.winner_name && (
                            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800 font-medium">
                              🏆 Winner: {match.winner_name}
                            </div>
                          )}
                          <button
                            onClick={() => navigate(`/organizer/tournaments/${id}/fixtures`)}
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            View Details →
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Points Table Tab */}
              {activeTab === 'points' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Points Table</h2>
                  {pointsTable.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No points data available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NRR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pointsTable.map((team, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{team.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{team.matches}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">{team.wins}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">{team.losses}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600">{team.points}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{team.nrr.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Teams Tab */}
              {activeTab === 'teams' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Enrolled Teams</h2>
                  {enrolledClubs.filter(c => c.payment_status === 'success').length === 0 ? (
                    <div className="text-center py-12">
                      <Users size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No teams enrolled yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enrolledClubs.filter(c => c.payment_status === 'success').map((club) => (
                        <div key={club.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-blue-600">{club.club_name.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">{club.club_name}</h3>
                              <p className="text-sm text-gray-600 mb-2">Enrolled by: {club.enrolled_by_name}</p>
                              <p className="text-sm text-gray-600">Contact: {club.enrolled_by_email || 'N/A'}</p>
                            </div>
                            <button 
                              onClick={() => handleViewSquad(club)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                            >
                              View Squad
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Live Tab */}
              {activeTab === 'live' && (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Matches</h3>
                  <p className="text-gray-600">Live matches will appear here when they start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Squad Modal */}
      {showSquadModal && selectedClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">{selectedClub.club_name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedClub.club_name}</h3>
                  <p className="text-sm text-blue-100">Squad Details</p>
                </div>
              </div>
              <button
                onClick={closeSquadModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Club Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Enrolled By</p>
                    <p className="font-semibold text-gray-900">{selectedClub.enrolled_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-semibold text-gray-900">{selectedClub.enrolled_by_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enrollment Fee</p>
                    <p className="font-semibold text-gray-900">₹{selectedClub.enrolled_fee ? parseFloat(selectedClub.enrolled_fee).toLocaleString('en-IN') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      {selectedClub.payment_status === 'success' ? 'Enrolled' : selectedClub.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Players List */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Squad Players
                </h4>
                
                {loadingPlayers ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading players...</p>
                  </div>
                ) : clubPlayers.length > 0 ? (
                  <div className="space-y-3">
                    {clubPlayers.map((player, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        {/* Player Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {player.jersey_number || index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900">{player.full_name || player.name || `Player ${index + 1}`}</p>
                              {player.total_matches_selected > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                  {player.total_matches_selected} {player.total_matches_selected === 1 ? 'match' : 'matches'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{player.role || 'All-rounder'}</p>
                          </div>
                        </div>

                        {/* Playing XI Matches */}
                        {player.playing_xi_matches && player.playing_xi_matches.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Selected for:</p>
                            <div className="space-y-2">
                              {player.playing_xi_matches.map((match, matchIndex) => (
                                <div key={matchIndex} className="bg-blue-50 rounded px-3 py-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-blue-900">
                                        Match #{match.match_number}: {match.team_a} vs {match.team_b}
                                      </p>
                                      {match.match_date && (
                                        <p className="text-xs text-blue-700 mt-1">
                                          {new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      {match.is_captain && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold" title="Captain">
                                          C
                                        </span>
                                      )}
                                      {match.is_vice_captain && (
                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold" title="Vice Captain">
                                          VC
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Not selected message */}
                        {(!player.playing_xi_matches || player.playing_xi_matches.length === 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 italic">Not selected for any match yet</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No player information available</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Player squad details are managed by the club manager.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeSquadModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TournamentDetails;

