import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments, cancelTournament, getEnrolledClubs } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { Trophy, Users, MapPin, Calendar, ArrowLeft, Eye, X, AlertCircle } from 'lucide-react';

const TournamentEnrollments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [cancellableTournaments, setCancellableTournaments] = useState(new Set());

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getMyTournaments();
      setTournaments(data);
      

      const cancellable = new Set();
      for (const tournament of data) {
        if (tournament.status === 'cancelled') continue;
        if (!tournament.payment || tournament.payment.payment_status !== 'success') continue;
        
        // Check if registration end date has passed
        let registrationEnded = false;
        if (tournament.details?.registration_end_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const regEndDate = new Date(tournament.details.registration_end_date);
          regEndDate.setHours(0, 0, 0, 0);
          registrationEnded = today > regEndDate;
        }
        
        // If registration hasn't ended, allow cancellation
        if (!registrationEnded) {
          cancellable.add(tournament.id);
        } else {
          // If registration has ended, check if all clubs are removed
          try {
            const enrolledClubs = await getEnrolledClubs(tournament.id);
            const enrolledClubsWithPayment = enrolledClubs.filter(c => c.payment_status === 'success');
            if (enrolledClubsWithPayment.length === 0) {
              cancellable.add(tournament.id);
            }
          } catch (error) {
            console.error(`Error checking enrolled clubs for tournament ${tournament.id}:`, error);
          }
        }
      }
      setCancellableTournaments(cancellable);
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

  const canCancel = (tournament) => {
    // Check if tournament is in the cancellable set
    return cancellableTournaments.has(tournament.id);
  };

  const handleCancelTournament = async (tournamentId) => {
    try {
      // First check if there are enrolled clubs
      const enrolledClubs = await getEnrolledClubs(tournamentId);
      const enrolledClubsWithPayment = enrolledClubs.filter(c => c.payment_status === 'success');
      
      if (enrolledClubsWithPayment.length > 0) {
        // Show error popup if clubs are still enrolled
        setShowCancelConfirm(null);
        alert(`Please remove and refund all enrolled clubs before cancelling the tournament. ${enrolledClubsWithPayment.length} club(s) still enrolled.`);
        return;
      }
      
      // If no enrolled clubs, proceed with cancellation
      setCancellingId(tournamentId);
      await cancelTournament(tournamentId);
      setShowCancelConfirm(null);
      // Reload tournaments to reflect the cancellation
      await loadTournaments();
      setCancellableTournaments(new Set());
      alert('Tournament cancelled successfully. The tournament creation fee has been refunded to your wallet.');
    } catch (error) {
      console.error('Failed to cancel tournament:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to cancel tournament. Please try again.';
      alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
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
          <p className="text-gray-600 mb-4">Choose a tournament to view enrolled clubs</p>
          
          {/* Info Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-semibold mb-1">Important: Tournament Cancellation</p>
              <p className="text-sm text-yellow-700">
                If you want to cancel a tournament, you must first remove and refund all enrolled clubs. 
                Only after all clubs have been removed and refunded can you proceed with tournament cancellation.
              </p>
            </div>
          </div>

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
                        {/* {canCancel(tournament) && (
                          <button
                            onClick={() => setShowCancelConfirm(tournament.id)}
                            disabled={cancellingId !== null}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={18} />
                            <span>Cancel Tournament</span>
                          </button>
                        )} */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Tournament</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this tournament? The tournament creation fee will be refunded to your account. This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
                disabled={cancellingId !== null}
              >
                No, Keep Tournament
              </button>
              <button
                onClick={() => handleCancelTournament(showCancelConfirm)}
                disabled={cancellingId !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingId ? 'Cancelling...' : 'Yes, Cancel Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TournamentEnrollments;

