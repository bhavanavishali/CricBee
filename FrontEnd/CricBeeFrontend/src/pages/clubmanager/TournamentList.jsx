import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { getEligibleTournaments, initiateTournamentEnrollment } from '@/api/clubService';
import { getClubProfile } from '@/api/clubService';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Clock, DollarSign, CheckCircle } from 'lucide-react';

export default function ClubManagerTournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingClub, setLoadingClub] = useState(true);

  useEffect(() => {
    loadClubProfile();
    loadTournaments();
    
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('enrolled') === 'true') {
      setSuccessMessage('Successfully enrolled in tournament!');
      setTimeout(() => setSuccessMessage(null), 5000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadClubProfile = async () => {
    try {
      setLoadingClub(true);
      const result = await getClubProfile();
      if (result.success && result.profile?.club?.id) {
        setClubId(result.profile.club.id);
      } else {
        setClubId(null);
      }
    } catch (error) {
      console.error('Failed to load club profile:', error);
      setClubId(null);
    } finally {
      setLoadingClub(false);
    }
  };

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

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Free';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const handleEnroll = async (tournament) => {
    if (!clubId) {
      alert('Club profile not found. Please create a club first.');
      return;
    }

    try {
      setEnrollingId(tournament.id);
      const result = await initiateTournamentEnrollment(tournament.id, clubId);
      
      // Check if Razorpay order was created
      if (!result.razorpay_order) {
        alert('Payment setup failed. Please contact support.');
        return;
      }

      // Always navigate to payment page for Razorpay payment
      navigate(`/clubmanager/tournaments/${tournament.id}/enroll`, {
        state: {
          tournament,
          enrollment: result.enrollment,
          razorpayOrder: result.razorpay_order,
          clubId
        }
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to initiate enrollment. Please try again.';
      alert(errorMessage);
      console.error('Enrollment error:', error);
    } finally {
      setEnrollingId(null);
    }
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

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          )}

          {/* Club Not Found Warning */}
          {!loadingClub && !clubId && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-800 font-medium">
                  ⚠️ You need to create a club profile before enrolling in tournaments.
                </span>
              </div>
              <button
                onClick={() => navigate('/clubmanager/profile')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
              >
                Create Club
              </button>
            </div>
          )}

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
                          <div className="flex items-center space-x-2">
                            <DollarSign size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Enrollment Fee</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(tournament.details?.enrollment_fee)}
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
                      <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        {canEnroll ? (
                          <>
                            {!clubId && !loadingClub && (
                              <p className="text-xs text-red-600 text-right mb-1">
                                Create a club first
                              </p>
                            )}
                            <button
                              onClick={() => handleEnroll(tournament)}
                              disabled={enrollingId === tournament.id || !clubId || loadingClub}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={!clubId ? 'Please create a club profile first' : ''}
                            >
                              {loadingClub ? 'Loading...' : enrollingId === tournament.id ? 'Processing...' : 'Enroll Now'}
                            </button>
                          </>
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

