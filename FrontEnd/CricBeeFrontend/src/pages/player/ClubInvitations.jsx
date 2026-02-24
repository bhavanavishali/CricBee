import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Building2, MapPin, Calendar } from 'lucide-react';
import { getPlayerInvitations, acceptInvitation, rejectInvitation } from '@/api/player/playerService';
import Swal from 'sweetalert2';

const ClubInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    const result = await getPlayerInvitations();
    if (result.success) {
      setInvitations(result.data.invitations || []);
    } else {
      setError(result.message || 'Failed to load invitations');
    }
    setLoading(false);
  };

  const handleAccept = async (invitationId) => {
    setProcessing(invitationId);
    const result = await acceptInvitation(invitationId);
    if (result.success) {
      await fetchInvitations(); // Refresh the list
    } else {
      Swal.fire({ icon: 'error', title: 'Error!', text: result.message || 'Failed to accept invitation' });
    }
    setProcessing(null);
  };

  const handleReject = async (invitationId) => {
    if (!window.confirm('Are you sure you want to reject this invitation?')) {
      return;
    }
    setProcessing(invitationId);
    const result = await rejectInvitation(invitationId);
    if (result.success) {
      await fetchInvitations(); // Refresh the list
    } else {
      Swal.fire({ icon: 'error', title: 'Error!', text: result.message || 'Failed to reject invitation' });
    }
    setProcessing(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle size={14} />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={24} />
            Club Invitations
          </h2>
          <p className="text-gray-600 mt-1">Manage your club membership invitations</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Invitations</h3>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg border-2 border-blue-200 shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{invitation.club.club_name}</h4>
                        <p className="text-sm text-gray-600">{invitation.club.short_name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>{invitation.club.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>Invited: {formatDate(invitation.requested_at)}</span>
                      </div>
                    </div>

                    {invitation.club.description && (
                      <p className="text-sm text-gray-700 mb-4">{invitation.club.description}</p>
                    )}

                    <div className="flex items-center gap-3">
                      {getStatusBadge(invitation.status)}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invitation.id)}
                          disabled={processing === invitation.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processing === invitation.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(invitation.id)}
                          disabled={processing === invitation.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Invitations */}
      {otherInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Previous Invitations</h3>
          <div className="space-y-4">
            {otherInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Building2 className="text-gray-600" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{invitation.club.club_name}</h4>
                        <p className="text-sm text-gray-600">{invitation.club.short_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(invitation.status)}
                      <div className="text-sm text-gray-600">
                        {invitation.status === 'accepted' || invitation.status === 'rejected' ? (
                          <span>Responded: {formatDate(invitation.responded_at)}</span>
                        ) : (
                          <span>Invited: {formatDate(invitation.requested_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No club invitations found</p>
          <p className="text-gray-500 text-sm mt-2">You'll see invitations here when clubs invite you to join</p>
        </div>
      )}
    </div>
  );
};

export default ClubInvitations;

