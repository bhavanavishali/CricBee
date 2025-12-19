import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, CheckCircle, Star, ArrowLeft, Clock } from 'lucide-react';
import { getPublicTournamentDetails } from '@/api/public';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournamentDetails();
  }, [id]);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const data = await getPublicTournamentDetails(id);
      setTournament(data);
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'toss_completed':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Tournament not found</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/tournaments')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Tournaments
        </button>

        {/* Tournament Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{tournament.tournament_name}</h1>
                {tournament.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-600" title="Verified" />
                )}
                {tournament.is_premium && (
                  <Star className="h-6 w-6 text-yellow-500" title="Premium" />
                )}
              </div>
              {tournament.organizer_name && (
                <p className="text-lg text-gray-600">Organized by {tournament.organizer_name}</p>
              )}
            </div>
          </div>

          {/* Tournament Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {tournament.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{tournament.location}</span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>
                {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
              </span>
            </div>
          </div>

          {tournament.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-700">{tournament.description}</p>
            </div>
          )}

          {tournament.prize_details && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Prize Details</h3>
              <p className="text-gray-700">{tournament.prize_details}</p>
            </div>
          )}
        </div>

        {/* Matches List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Matches</h2>
          
          {tournament.matches && tournament.matches.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No matches scheduled yet</p>
          ) : (
            <div className="space-y-4">
              {tournament.matches.map((match) => (
                <div
                  key={match.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold text-lg">{match.team_a_name}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-bold text-lg">{match.team_b_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        {match.match_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(match.match_date)}
                          </div>
                        )}
                        {match.match_time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(match.match_time)}
                          </div>
                        )}
                        {match.ground && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {match.ground}
                          </div>
                        )}
                        {match.round_name && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {match.round_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          match.status_badge
                        )}`}
                      >
                        {match.status_badge.charAt(0).toUpperCase() + match.status_badge.slice(1)}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View Match →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;

