import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { getMyEnrollments } from '@/api/clubService';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Clock, DollarSign, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function MyEnrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEnrollments();
    
    // Check for success message from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('enrolled') === 'true') {
      // Show success message briefly
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
    }
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
      setError(error.response?.data?.detail || 'Failed to load enrollments');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Free';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      'success': { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
      'refunded': { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: XCircle },
    };
    return statusMap[status?.toLowerCase()] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  };

  const getTournamentStatusBadge = (status) => {
    const statusMap = {
      'registration_open': { label: 'Registration Open', color: 'bg-blue-100 text-blue-700' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-100 text-orange-700' },
      'tournament_start': { label: 'Tournament Live', color: 'bg-red-100 text-red-700' },
      'tournament_end': { label: 'Tournament Ended', color: 'bg-gray-100 text-gray-700' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <Layout title="My Enrollments" profilePath="/clubmanager/profile">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Enrollments</h1>
            <p className="text-gray-600">View all tournaments you have enrolled in</p>
          </div>

          {/* Success Message */}
          {new URLSearchParams(window.location.search).get('enrolled') === 'true' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Successfully enrolled in tournament!</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading enrollments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg border border-red-200">
              <XCircle size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Enrollments</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadEnrollments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrollments Yet</h3>
              <p className="text-gray-600 mb-4">You haven't enrolled in any tournaments yet.</p>
              <button
                onClick={() => navigate('/clubmanager/tournaments')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Tournaments
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => {
                const paymentStatus = getPaymentStatusBadge(enrollment.payment_status);
                const tournamentStatus = getTournamentStatusBadge(enrollment.tournament?.status);
                const PaymentIcon = paymentStatus.icon;
                
                return (
                  <div
                    key={enrollment.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Tournament Icon */}
                      <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-4 flex-shrink-0">
                        <Trophy size={32} className="text-white" />
                      </div>

                      {/* Enrollment Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {enrollment.tournament?.tournament_name || 'Tournament'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {enrollment.tournament?.details?.location || 'Location not specified'}
                              {enrollment.tournament?.details?.venue_details && ` • ${enrollment.tournament.details.venue_details}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tournamentStatus.color}`}>
                              {tournamentStatus.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${paymentStatus.color}`}>
                              <PaymentIcon size={14} />
                              <span>{paymentStatus.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Tournament Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {enrollment.tournament?.details?.start_date ? formatDate(enrollment.tournament.details.start_date) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Enrolled On</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(enrollment.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Team Range</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {enrollment.tournament?.details?.team_range || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign size={18} className="text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Enrollment Fee</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(enrollment.enrolled_fee)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Tournament Format */}
                        {enrollment.tournament?.details?.overs && (
                          <div className="text-xs text-gray-500 mb-4">
                            Format: {enrollment.tournament.details.overs} overs
                          </div>
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





