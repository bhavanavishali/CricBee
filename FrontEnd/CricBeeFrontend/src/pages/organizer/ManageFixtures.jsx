import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyTournaments } from '@/api/organizer/tournament';
import { checkCanCreateFixture, setTournamentFixtureMode } from '@/api/organizer/fixture';
import Layout from '@/components/layouts/Layout';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Settings, AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

const ManageFixtures = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixtureStatus, setFixtureStatus] = useState({});
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fixture type selection modal
  const [showFixtureTypeModal, setShowFixtureTypeModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  // Reload tournaments when location changes (user navigates back to this page)
  useEffect(() => {
    if (location.pathname === '/organizer/manage-fixtures') {
      loadTournaments();
    }
  }, [location.pathname]);

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
      'tournament_end': { label: 'Tournament End', color: 'bg-gray-100 text-gray-800' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const handleManageFixture = (tournament) => {
    const status = fixtureStatus[tournament.id];
    if (status?.can_create) {
      // Check if fixture_mode_id is already set
      if (tournament.fixture_mode_id) {
        // Fixture mode already set, navigate directly to fixtures page
        const fixtureModeId = tournament.fixture_mode_id;
        if (fixtureModeId === 2) {
          navigate(`/organizer/tournaments/${tournament.id}/fixtures?type=league`);
        } else {
          navigate(`/organizer/tournaments/${tournament.id}/fixtures`);
        }
      } else {
        // Fixture mode not set, show selection modal
        setSelectedTournament(tournament);
        setShowFixtureTypeModal(true);
      }
    } else {
      Swal.fire({ icon: 'info', title: 'Info', text: status?.message || 'Fixture creation is not available for this tournament' });
    }
  };

  const handleFixtureTypeSelection = async (fixtureType) => {
    if (!selectedTournament) return;
    
    try {
      // Set fixture mode in database before navigating
      const fixtureModeId = fixtureType === 'manual' ? 1 : 2;
      await setTournamentFixtureMode(selectedTournament.id, fixtureModeId);
      
      // Update the tournament in local state to reflect the change
      setTournaments(prevTournaments => 
        prevTournaments.map(t => 
          t.id === selectedTournament.id 
            ? { ...t, fixture_mode_id: fixtureModeId }
            : t
        )
      );
      
      // Navigate to fixtures page
      if (fixtureType === 'manual') {
        navigate(`/organizer/tournaments/${selectedTournament.id}/fixtures`);
      } else if (fixtureType === 'league') {
        navigate(`/organizer/tournaments/${selectedTournament.id}/fixtures?type=league`);
      }
    } catch (error) {
      console.error('Failed to set fixture mode:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to set fixture mode. Please try again.' });
      return;
    }
    
    setShowFixtureTypeModal(false);
    setSelectedTournament(null);
  };

  // Filter tournaments based on search query and status
  const filteredTournaments = tournaments.filter((tournament) => {
    // Search filter
    const matchesSearch = tournament.tournament_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.details?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTournaments = filteredTournaments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending_payment', label: 'Pending Payment', count: tournaments.filter(t => t.status === 'pending_payment').length },
    { value: 'registration_open', label: 'Registration Open', count: tournaments.filter(t => t.status === 'registration_open').length },
    { value: 'registration_end', label: 'Registration Closed', count: tournaments.filter(t => t.status === 'registration_end').length },
    { value: 'tournament_start', label: 'Tournament Live', count: tournaments.filter(t => t.status === 'tournament_start').length },
    { value: 'tournament_end', label: 'Completed', count: tournaments.filter(t => t.status === 'tournament_end').length },
    { value: 'cancelled', label: 'Cancelled', count: tournaments.filter(t => t.status === 'cancelled').length },
  ];

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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by tournament name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {paginatedTournaments.length} of {filteredTournaments.length} tournament(s)
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No tournaments match your filters'
                  : 'No tournaments found'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTournaments.map((tournament) => {
                const statusBadge = getStatusBadge(tournament.status);
                const fixtureStatusInfo = fixtureStatus[tournament.id];
                const canCreate = fixtureStatusInfo?.can_create || false;
                
                // Hide "Manage Fixture" button for Cancelled or Completed tournaments
                const isCancelledOrCompleted = tournament.status === 'cancelled' || tournament.status === 'tournament_end';
                
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
                          {!canCreate && fixtureStatusInfo?.message && !isCancelledOrCompleted && (
                            <div className="mt-2 text-sm text-orange-600 flex items-center">
                              <AlertCircle size={14} className="mr-1" />
                              <span>{fixtureStatusInfo.message}</span>
                            </div>
                          )}
                          {isCancelledOrCompleted && (
                            <div className="mt-2 text-sm text-gray-500 italic">
                              Fixture management is not available for {tournament.status === 'cancelled' ? 'cancelled' : 'completed'} tournaments.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {!isCancelledOrCompleted && (
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
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = page === 1 || 
                                      page === totalPages || 
                                      (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                          (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return (
                          <span key={page} className="px-3 py-2 text-gray-400">
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>

        {/* Fixture Type Selection Modal */}
        {showFixtureTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Fixture Type</h2>
              <p className="text-gray-600 mb-6">
                Choose how you want to generate fixtures for <strong>{selectedTournament?.tournament_name}</strong>
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleFixtureTypeSelection('manual')}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-left"
                >
                  <div className="font-bold text-lg mb-1">Manual Fixture Generation</div>
                  <div className="text-sm opacity-90">Create rounds and matches manually with full control</div>
                </button>
                
                <button
                  onClick={() => handleFixtureTypeSelection('league')}
                  className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-left"
                >
                  <div className="font-bold text-lg mb-1">League Fixture Generation</div>
                  <div className="text-sm opacity-90">Automated 3-round structure: League → Playoffs → Final</div>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowFixtureTypeModal(false);
                  setSelectedTournament(null);
                }}
                className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageFixtures;


