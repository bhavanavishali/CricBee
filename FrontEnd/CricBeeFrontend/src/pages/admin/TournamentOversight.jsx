// FrontEnd/CricBeeFrontend/src/pages/admin/TournamentOversight.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { getTournaments, getTournamentDetails, updateTournamentBlockStatus } from '@/api/adminService';
import { Trophy, Eye, Ban, CheckCircle, ArrowLeft, Calendar, MapPin, Users, DollarSign, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TournamentOversight() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadTournaments();
  }, [skip]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const result = await getTournaments(skip, limit);
      if (result.success) {
        setTournaments(result.data.tournaments);
        setTotal(result.data.total);
      } else {
        await Swal.fire({
          title: 'Error!',
          text: result.message || 'Failed to load tournaments',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to load tournaments',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (tournamentId) => {
    try {
      const result = await getTournamentDetails(tournamentId);
      if (result.success) {
        setSelectedTournament(result.data);
        setShowDetails(true);
      } else {
        await Swal.fire({
          title: 'Error!',
          text: result.message || 'Failed to fetch tournament details',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (error) {
      console.error('Failed to fetch tournament details:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch tournament details',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleToggleBlock = async (tournament, currentBlockedStatus) => {
    const action = currentBlockedStatus ? 'unblock' : 'block';
    const actionText = currentBlockedStatus ? 'Unblock' : 'Block';
    const confirmText = currentBlockedStatus
      ? 'This tournament will be unblocked and become visible to users.'
      : 'This tournament will be blocked and hidden from users.';

    const result = await Swal.fire({
      title: `${actionText} Tournament?`,
      html: `
        <div class="text-left">
          <p class="mb-3">Are you sure you want to ${action} <strong>${tournament.tournament_name}</strong>?</p>
          <p class="text-sm text-gray-600">${confirmText}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentBlockedStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const newStatus = !currentBlockedStatus;
        const updateResult = await updateTournamentBlockStatus(tournament.id, newStatus);

        if (updateResult.success) {
          setTournaments(
            tournaments.map((t) =>
              t.id === tournament.id ? { ...t, is_blocked: newStatus } : t
            )
          );

          await Swal.fire({
            title: 'Success!',
            text: `Tournament has been ${action}ed successfully.`,
            icon: 'success',
            confirmButtonColor: '#10b981',
            timer: 2000,
          });
        } else {
          throw new Error(updateResult.message);
        }
      } catch (err) {
        console.error('Error updating tournament status:', err);
        await Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to update tournament status',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-500' },
      'registration_open': { label: 'Registration Open', color: 'bg-blue-500' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-500' },
      'tournament_start': { label: 'Tournament Live', color: 'bg-red-500' },
      'tournament_end': { label: 'Completed', color: 'bg-gray-500' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-600' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Layout title="Tournament Oversight" showFooter={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Back to Dashboard */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Admin Dashboard</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Tournaments ({total})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="text-gray-600">Loading tournaments...</div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tournament
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tournaments.map((tournament) => {
                        const statusInfo = getStatusBadge(tournament.status);
                        return (
                          <tr key={tournament.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                  <Trophy size={20} className="text-teal-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {tournament.tournament_name}
                                  </div>
                                  {tournament.is_blocked && (
                                    <span className="text-xs text-red-600 font-medium">Blocked</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              ID: {tournament.organizer_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(tournament.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewDetails(tournament.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>
                                {tournament.is_blocked ? (
                                  <button
                                    onClick={() => handleToggleBlock(tournament, tournament.is_blocked)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Unblock Tournament"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleBlock(tournament, tournament.is_blocked)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Block Tournament"
                                  >
                                    <Ban size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {tournaments.length === 0 && (
                    <div className="text-center py-12">
                      <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">No tournaments found</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    disabled={skip === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
                  </span>
                  <button
                    onClick={() => setSkip(skip + limit)}
                    disabled={skip + limit >= total}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tournament Details Modal */}
        {showDetails && selectedTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tournament Details</h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTournament(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tournament Name</label>
                    <p className="text-gray-900">{selectedTournament.tournament_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900 capitalize">{selectedTournament.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blocked</label>
                    <p className="text-gray-900">{selectedTournament.is_blocked ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{formatDate(selectedTournament.created_at)}</p>
                  </div>
                  {selectedTournament.details && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-gray-900">{selectedTournament.details.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Date</label>
                        <p className="text-gray-900">{formatDate(selectedTournament.details.start_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Date</label>
                        <p className="text-gray-900">{formatDate(selectedTournament.details.end_date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Enrollment Fee</label>
                        <p className="text-gray-900">₹{selectedTournament.details.enrollment_fee}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTournament(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}