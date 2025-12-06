import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { Trophy, Users, MapPin, Calendar, ArrowLeft, Eye } from 'lucide-react';

const TournamentEnrollments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getMyTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'registration_open': { label: 'Registration Open', color: 'bg-green-100 text-green-800', icon: '✓' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-100 text-orange-800', icon: '✓' },
      'tournament_start': { label: 'Live', color: 'bg-red-100 text-red-800', icon: '🔴' },
      'tournament_end': { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: '🏁' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '✕' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Enrollments</h1>
          <p className="text-gray-600">Manage clubs across your tournaments</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Select Tournament</h2>
          <p className="text-gray-600 mb-6">Choose a tournament to view enrolled clubs</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No tournaments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const statusBadge = getStatusBadge(tournament.status);
                return (
                  <div
                    key={tournament.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Tournament Icon */}
                        <div className="bg-gradient-to-br from-orange-500 to-teal-500 rounded-lg p-3 text-white">
                          <Trophy size={24} />
                        </div>

                        {/* Tournament Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {tournament.tournament_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users size={16} className="mr-2" />
                              <span>{tournament.enrolled_clubs_count || 0} clubs</span>
                            </div>
                            {tournament.details?.location && (
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-2" />
                                <span>{tournament.details.location}</span>
                              </div>
                            )}
                            {tournament.details?.start_date && (
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                <span>{formatDate(tournament.details.start_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action */}
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                        <button
                          onClick={() => navigate(`/organizer/tournaments/${tournament.id}/enrolled-clubs`)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Eye size={18} />
                          <span>View Clubs</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TournamentEnrollments;

