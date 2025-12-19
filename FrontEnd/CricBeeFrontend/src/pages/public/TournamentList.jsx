import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, CheckCircle, Star } from 'lucide-react';
import { getPublicTournaments } from '@/api/public';

const TournamentList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    loadTournaments();
  }, [statusFilter]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getPublicTournaments(statusFilter);
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tournaments</h1>
          <p className="text-gray-600">Browse all cricket tournaments</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('ongoing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'ongoing'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Ongoing
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No tournaments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">
                    {tournament.tournament_name}
                  </h3>
                  <div className="flex gap-2 ml-2">
                    {tournament.is_verified && (
                      <CheckCircle className="h-5 w-5 text-blue-600" title="Verified" />
                    )}
                    {tournament.is_premium && (
                      <Star className="h-5 w-5 text-yellow-500" title="Premium" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {tournament.organizer_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Organizer:</span>
                      <span className="ml-2">{tournament.organizer_name}</span>
                    </div>
                  )}
                  
                  {tournament.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tournament.location}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      tournament.status_badge
                    )}`}
                  >
                    {tournament.status_badge.charAt(0).toUpperCase() + tournament.status_badge.slice(1)}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;

