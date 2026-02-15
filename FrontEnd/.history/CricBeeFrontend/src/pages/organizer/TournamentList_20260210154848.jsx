import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments, cancelTournament, getEnrolledClubs } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { Trophy, Users, Calendar, DollarSign, Eye, Edit, ArrowLeft, X, Ban } from 'lucide-react';

const TournamentList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    description: ''
  });
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
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-500', icon: '⏳ },
      'registration_open': { label: 'Registration Open', color: 'bg-blue-500', icon: '📢' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-500', icon: '✅' },
      'tournament_start': { label: 'Tournament Live', color: 'bg-red-500', icon: '🔴' },
      'tournament_end': { label: 'Tournament Completed', color: 'bg-gray-500', icon: '🏁' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-600', icon: '✕' }
    };

    return statusMap[status] || { label: status, color: 'bg-gray-500', icon: '' };
  };

  const canEdit = (status) => {
    return status === 'pending_payment' || status === 'registration_open' || status === 'registration_end';
  };

  const canCancel = (tournament) => {
   
    if (tournament.status === 'cancelled') return false;
    if (!tournament.payment || tournament.payment.payment_status !== 'success') return false;
    if (!tournament.details?.registration_end_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regEndDate = new Date(tournament.details.registration_end_date);
    regEndDate.setHours(0, 0, 0, 0);
    
    return today <= regEndDate;
  };

  const handleCancelTournament = async (tournamentId) => {
    try {
      // Validate notification form
      if (!notificationForm.title.trim() || !notificationForm.description.trim()) {
        alert('Please enter both notification title and description.');
        return;
      }

      // First check if there are enrolled clubs
      const enrolledClubs = await getEnrolledClubs(tournamentId);
      const enrolledClubsWithPayment = enrolledClubs.filter(club => club.payment_status === 'success');

      if (enrolledClubsWithPayment.length > 0) {
        // Show error popup if clubs are still enrolled
        setShowCancelConfirm(null);
        alert(`Please remove and refund all enrolled clubs before cancelling the tournament. ${enrolledClubsWithPayment.length} club(s) still enrolled.`);
        return;
      }
      
      // If no enrolled clubs, proceed with cancellation
      setCancellingId(tournamentId);
      await cancelTournament(tournamentId, {
        notification_title: notificationForm.title,
        notification_description: notificationForm.description
      });
      setShowCancelConfirm(null);
      setNotificationForm({ title: '', description: '' });
      // Reload tournaments to reflect the cancellation
      await loadTournaments();
      alert('Tournament cancelled successfully. Notifications have been sent to all users.');
    } catch (error) {
      console.error('Failed to cancel tournament:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to cancel tournament. Please try again.';
      alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFormatLabel = (overs) => {
    if (!overs) return 'Format: T20';
    if (overs === 10) return 'Format: T10';
    if (overs === 20) return 'Format: T20';
    if (overs === 50) return 'Format: One Day';
    return `Format: ${overs} overs`;
  };

  return (
    <Layout title="My Tournaments" profilePath="/organizer/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tournaments</h1>
            <p className="text-gray-600">Manage and view all your cricket tournaments</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments yet</h3>
              <p className="text-gray-600 mb-4">Create your first tournament to get started</p>
              <button
                onClick={() => navigate('/organizer/create-tournament')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Create Tournament
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => {
                const statusInfo = getStatusBadge(tournament.status);
                const format = getFormatLabel(tournament.details?.overs);
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Trophy Icon */}
                      <div className="bg-purple-600 rounded-lg p-4 flex-shrink-0">
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
                          <div className="flex items-center space-x-2">
                            {tournament.is_blocked && (
                              <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                                <Ban size={12} /> Blocked
                              </span>
                            )}
                            <span
                              className={`${statusInfo.color} text-white text-xs font-semibold px-3 py-1 rounded`}
                            >
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Users size={18} className="text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {tournament.details?.team_range || 'N/A'} teams
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={18} className="text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {tournament.details?.start_date ? formatDate(tournament.details.start_date) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign size={18} className="text-gray-500" />
                            <span className="text-sm text-gray-700">
                              ₹{tournament.payment?.amount ? parseFloat(tournament.payment.amount).toLocaleString('en-IN') : '0'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">{format}</span>
                          </div>
                        </div>

                        {/* Dates */}
                        {tournament.details?.start_date && tournament.details?.end_date && (
                          <div className="text-xs text-gray-500 mb-4">
                            {formatDate(tournament.details.start_date)} - {formatDate(tournament.details.end_date)}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            
                            console.log('View tournament:', tournament.id);
                            
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Tournament"
                        >
                          <Eye size={20} />
                        </button>
                        {canEdit(tournament.status) && (
                          <button
                            onClick={() => {
                           
                              console.log('Edit tournament:', tournament.id);
                             
                            }}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Tournament"
                          >
                            <Edit size={20} />
                          </button>
                        )}
                        {canCancel(tournament) && (
                          <button
                            onClick={() => setShowCancelConfirm(tournament.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Tournament"
                          >
                            <X size={20} />
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

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Tournament</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this tournament? Please enter notification details to inform all users about this cancellation.
            </p>
            
            {/* Notification Form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title *
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Tournament Cancelled"
                maxLength={100}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Description *
              </label>
              <textarea
                value={notificationForm.description}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Please explain why the tournament is being cancelled..."
                rows={3}
                maxLength={500}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowCancelConfirm(null);
                  setNotificationForm({ title: '', description: '' });
                }}
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

export default TournamentList;

