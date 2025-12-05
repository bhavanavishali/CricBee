import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { getEligibleTournaments } from '@/api/clubService';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react';

export default function ClubManagerTournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getEligibleTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'registration_open': { label: 'Registration Open', color: 'bg-blue-100 text-blue-700' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-100 text-orange-700' },
      'tournament_start': { label: 'Tournament Live', color: 'bg-red-100 text-red-700' },
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const isRegistrationOpen = (tournament) => {
    if (!tournament.details?.registration_end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regEndDate = new Date(tournament.details.registration_end_date);
    regEndDate.setHours(0, 0, 0, 0);
    return today <= regEndDate;
  };

  return (
    <Layout title="Available Tournaments" profilePath="/clubmanager/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/clubmanager/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Tournaments</h1>
            <p className="text-gray-600">Browse and enroll in tournaments open for registration</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments available</h3>
              <p className="text-gray-600">There are currently no tournaments open for enrollment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const statusInfo = getStatusBadge(tournament.status);
                const canEnroll = isRegistrationOpen(tournament);
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Tournament Icon */}
                      <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-4 flex-shrink-0">
                        <Trophy size={32} className="text-white" />
                      </div>

                      {/* Tournament Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {tournament.tournament_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {tournament.details?.location || 'Location not specified'}
                              {tournament.details?.venue_details && ` • ${tournament.details.venue_details}`}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Tournament Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {tournament.details?.start_date ? formatDate(tournament.details.start_date) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Registration Ends</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {tournament.details?.registration_end_date ? formatDate(tournament.details.registration_end_date) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Team Range</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {tournament.details?.team_range || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Trophy size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Format</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {tournament.details?.overs ? `${tournament.details.overs} overs` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Registration Dates */}
                        {tournament.details?.registration_start_date && tournament.details?.registration_end_date && (
                          <div className="text-xs text-gray-500 mb-4">
                            Registration: {formatDate(tournament.details.registration_start_date)} - {formatDate(tournament.details.registration_end_date)}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {canEnroll ? (
                          <button
                            onClick={() => {
                              // Navigate to enrollment page when implemented
                              console.log('Enroll in tournament:', tournament.id);
                              // navigate(`/clubmanager/tournaments/${tournament.id}/enroll`);
                            }}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Enroll Now
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
                          >
                            Registration Closed
                          </button>
                        )}
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
}

