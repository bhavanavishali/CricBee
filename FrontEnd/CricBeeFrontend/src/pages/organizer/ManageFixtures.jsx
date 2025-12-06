import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTournaments } from '@/api/organizer/tournament';
import { checkCanCreateFixture } from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Settings, AlertCircle } from 'lucide-react';

const ManageFixtures = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixtureStatus, setFixtureStatus] = useState({});

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getMyTournaments();
      setTournaments(data);
      
      // Check fixture creation status for each tournament
      const statusPromises = data.map(async (tournament) => {
        try {
          const status = await checkCanCreateFixture(tournament.id);
          return { tournamentId: tournament.id, ...status };
        } catch (error) {
          return { tournamentId: tournament.id, can_create: false, message: 'Error checking status' };
        }
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.tournamentId] = status;
      });
      setFixtureStatus(statusMap);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const handleManageFixture = (tournament) => {
    const status = fixtureStatus[tournament.id];
    if (status?.can_create) {
      navigate(`/organizer/tournaments/${tournament.id}/fixtures`);
    } else {
      alert(status?.message || 'Fixture creation is not available for this tournament');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Fixtures</h1>
          <p className="text-gray-600">Create and manage tournament fixtures</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Fixture Creation Rules</p>
            <p className="text-sm text-blue-700">
              Fixture generation is only available after the registration deadline has ended.
            </p>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                const fixtureStatusInfo = fixtureStatus[tournament.id];
                const canCreate = fixtureStatusInfo?.can_create || false;
                
                return (
                  <div
                    key={tournament.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-gradient-to-br from-orange-500 to-teal-500 rounded-lg p-3 text-white">
                          <Trophy size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {tournament.tournament_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {tournament.details?.location && (
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-2" />
                                <span>{tournament.details.location}</span>
                              </div>
                            )}
                            {tournament.details?.registration_end_date && (
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                <span>Registration ends: {formatDate(tournament.details.registration_end_date)}</span>
                              </div>
                            )}
                          </div>
                          {!canCreate && fixtureStatusInfo?.message && (
                            <div className="mt-2 text-sm text-orange-600 flex items-center">
                              <AlertCircle size={14} className="mr-1" />
                              <span>{fixtureStatusInfo.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        <button
                          onClick={() => handleManageFixture(tournament)}
                          disabled={!canCreate}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 ${
                            canCreate
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Settings size={18} />
                          <span>Manage Fixture</span>
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

export default ManageFixtures;

