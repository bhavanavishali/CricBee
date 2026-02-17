import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { Trophy, ArrowLeft, Eye, Calendar, MapPin, Users, DollarSign } from 'lucide-react';

const ManageMatches = () => {
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
      'pending_payment': { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
      'registration_open': { label: 'Registration Open', color: 'bg-green-100 text-green-800' },
      'registration_end': { label: 'Registration Closed', color: 'bg-orange-100 text-orange-800' },
      'tournament_start': { label: 'Tournament Live', color: 'bg-red-100 text-red-800' },
      'tournament_end': { label: 'Tournament Completed', color: 'bg-gray-100 text-gray-800' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFormatLabel = (overs) => {
    if (!overs) return 'T20';
    if (overs === 10) return 'T10';
    if (overs === 20) return 'T20';
    if (overs === 50) return 'One Day';
    return `${overs} overs`;
  };

  return (
    <Layout title="Manage Matches" profilePath="/organizer/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Matches</h1>
            <p className="text-gray-600">View tournament details and manage matches</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tournaments.map((tournament) => {
                const statusBadge = getStatusBadge(tournament.status);
                const format = getFormatLabel(tournament.details?.overs);
                
                return (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Tournament Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Trophy className="text-white" size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {tournament.tournament_name}
                        </h3>
                        <span className={`inline-block ${statusBadge.color} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Tournament Details */}
                    <div className="space-y-2 mb-4">
                      {tournament.details?.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={16} className="mr-2 text-gray-400" />
                          <span>{tournament.details.location}</span>
                        </div>
                      )}
                      {tournament.details?.start_date && tournament.details?.end_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          <span>{formatDate(tournament.details.start_date)} - {formatDate(tournament.details.end_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users size={16} className="mr-2 text-gray-400" />
                        <span>{tournament.details?.team_range || 'N/A'} teams • {format}</span>
                      </div>
                      {tournament.payment?.amount && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign size={16} className="mr-2 text-gray-400" />
                          <span>₹{parseFloat(tournament.payment.amount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => navigate(`/organizer/tournaments/${tournament.id}/details`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Eye size={18} />
                        Tournament Details
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/tournaments/${tournament.id}/fixtures`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <Calendar size={18} />
                        View Matches
                      </button>
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

export default ManageMatches;

