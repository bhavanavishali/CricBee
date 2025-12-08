import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEnrolledClubs, getMyTournaments, getClubDetails, removeClubFromTournament, cancelTournament } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Trophy, MapPin, Calendar, Users, Search, Filter, Eye, CheckCircle, Clock, RefreshCw, X, Mail, Phone, User as UserIcon, DollarSign } from 'lucide-react';

const EnrolledClubs = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [loadingClubDetails, setLoadingClubDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [clubToRemove, setClubToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadTournamentAndClubs();
  }, [tournamentId]);

  const loadTournamentAndClubs = async () => {
    try {
      setLoading(true);
      // Load tournament details
      const tournaments = await getMyTournaments();
      const foundTournament = tournaments.find(t => t.id === parseInt(tournamentId));
      setTournament(foundTournament);

      // Load enrolled clubs
      const clubs = await getEnrolledClubs(tournamentId);
      setEnrolledClubs(clubs);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      'success': { label: 'Paid', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-800', icon: <X size={14} /> },
      'refunded': { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: <RefreshCw size={14} /> }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: null };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
  };

  const handleViewDetails = async (club) => {
    try {
      setSelectedClub(club);
      setLoadingClubDetails(true);
      setShowModal(true);
      const details = await getClubDetails(club.club_id);
      setClubDetails(details);
    } catch (error) {
      console.error('Failed to load club details:', error);
      alert('Failed to load club details. Please try again.');
    } finally {
      setLoadingClubDetails(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClub(null);
    setClubDetails(null);
  };

  const handleRemoveClub = (club) => {
    setClubToRemove(club);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveClub = async () => {
    if (!clubToRemove) return;
    
    try {
      setRemoving(true);
      await removeClubFromTournament(tournamentId, clubToRemove.club_id);
      

      await loadTournamentAndClubs();
      
      // Close popup
      setShowRemoveConfirm(false);
      setClubToRemove(null);
      
      alert('Club removed successfully and enrollment fee refunded.');
    } catch (error) {
      console.error('Failed to remove club:', error);
      alert(error.response?.data?.detail || 'Failed to remove club. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const cancelRemoveClub = () => {
    setShowRemoveConfirm(false);
    setClubToRemove(null);
  };

  const canCancelTournament = () => {
    if (!tournament) return false;
    if (tournament.status === 'cancelled') return false;
    if (!tournament.payment || tournament.payment.payment_status !== 'success') return false;
    
    // Check if all clubs with successful payments are removed
    const enrolledClubsWithPayment = enrolledClubs.filter(c => c.payment_status === 'success');
    return enrolledClubsWithPayment.length === 0;
  };

  const handleCancelTournament = async () => {
    try {
      setCancelling(true);
      await cancelTournament(tournamentId);
      setShowCancelConfirm(false);
      // Reload data
      await loadTournamentAndClubs();
      alert('Tournament cancelled successfully. The tournament creation fee has been refunded to your wallet.');
      // Navigate back to tournament enrollments
      navigate('/organizer/tournament-enrollments');
    } catch (error) {
      console.error('Failed to cancel tournament:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to cancel tournament. Please try again.';
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  // Filter clubs based on search and payment status
  const filteredClubs = enrolledClubs.filter(club => {
    const matchesSearch = 
      club.club_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.enrolled_by_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || club.payment_status === paymentFilter;
    
    return matchesSearch && matchesPayment;
  });

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
              onClick={() => navigate('/organizer/tournament-enrollments')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Go back to Tournament Enrollments
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/organizer/tournament-enrollments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Enrollments</h1>
          <p className="text-gray-600">Manage clubs across your tournaments</p>
        </div>

        {/* Tournament Overview Card */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="bg-blue-600 rounded-lg p-3 text-white">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{tournament.tournament_name}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2" />
                    <span>{enrolledClubs.length} clubs enrolled</span>
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
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadge.color}`}>
              {statusBadge.icon} {statusBadge.label}
            </span>
            {canCancelTournament() && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center space-x-2"
              >
                <X size={18} />
                <span>Cancel Tournament</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clubs, managers, or emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">All Payments</option>
                <option value="success">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enrolled Clubs List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {filteredClubs.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {enrolledClubs.length === 0 
                  ? 'No clubs enrolled yet' 
                  : 'No clubs match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClubs.map((club) => {
                const paymentBadge = getPaymentStatusBadge(club.payment_status);
                return (
                  <div
                    key={club.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-blue-600 rounded-lg p-3 text-white">
                          <Trophy size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{club.club_name}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">{club.enrolled_by_name}</span>
                            {club.enrolled_by_email && (
                              <span className="text-gray-500"> • {club.enrolled_by_email}</span>
                            )}
                          </p>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar size={14} className="mr-2" />
                            <span>Enrolled {formatDate(club.created_at)}</span>
                            <span className="mx-2">•</span>
                            <span>Fee: {formatCurrency(club.enrolled_fee)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${paymentBadge.color}`}>
                          {paymentBadge.icon}
                          <span>{paymentBadge.label}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(club)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                          >
                            <Eye size={18} />
                            <span>View Details</span>
                          </button>
                          {club.payment_status === 'success' && (
                            <button
                              onClick={() => handleRemoveClub(club)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center space-x-2"
                            >
                              <X size={18} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Club Details Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Club Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {loadingClubDetails ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-gray-600">Loading club details...</p>
                  </div>
                ) : clubDetails ? (
                  <div className="space-y-6">
                    {/* Club Image and Name */}
                    <div className="flex items-start space-x-4">
                      {clubDetails.club.club_image ? (
                        <img
                          src={clubDetails.club.club_image}
                          alt={clubDetails.club.club_name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Trophy size={40} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {clubDetails.club.club_name}
                        </h3>
                        <p className="text-sm text-gray-600">{clubDetails.club.short_name}</p>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            clubDetails.club.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {clubDetails.club.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Club Description */}
                    {clubDetails.club.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{clubDetails.club.description}</p>
                      </div>
                    )}

                    {/* Club Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin size={20} className="text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{clubDetails.club.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Users size={20} className="text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Players</p>
                          <p className="text-sm font-semibold text-gray-900">{clubDetails.club.no_of_players} players</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar size={20} className="text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(clubDetails.club.created_at)}
                          </p>
                        </div>
                      </div>
                      {selectedClub && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <DollarSign size={20} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-500">Enrollment Fee</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(selectedClub.enrolled_fee)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manager Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Club Manager</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                          <UserIcon size={20} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {clubDetails.manager.full_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail size={20} className="text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {clubDetails.manager.email}
                            </p>
                          </div>
                        </div>
                        {clubDetails.manager.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone size={20} className="text-gray-600" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {clubDetails.manager.phone}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enrollment Information */}
                    {selectedClub && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Information</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Enrollment Date</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatDate(selectedClub.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Payment Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedClub.payment_status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : selectedClub.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedClub.payment_status === 'success' ? 'Paid' : 
                               selectedClub.payment_status === 'pending' ? 'Pending' : 
                               selectedClub.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Failed to load club details</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Club Confirmation Modal */}
        {showRemoveConfirm && clubToRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Remove Club from Tournament</h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to remove <strong>{clubToRemove.club_name}</strong> from this tournament?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The club will receive a refund of the enrollment fee (₹{formatCurrency(clubToRemove.enrolled_fee)}) paid during registration.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelRemoveClub}
                    disabled={removing}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveClub}
                    disabled={removing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {removing ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <X size={18} />
                        <span>Remove Club</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Tournament Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancel Tournament</h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel <strong>{tournament?.tournament_name}</strong>?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The tournament creation fee will be refunded to your wallet by the admin.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    No, Keep Tournament
                  </button>
                  <button
                    onClick={handleCancelTournament}
                    disabled={cancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {cancelling ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <X size={18} />
                        <span>Yes, Cancel Tournament</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnrolledClubs;

