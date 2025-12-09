import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { getMyFixtures } from '@/api/clubmanager/fixture';

export default function MyFixtures() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await getMyFixtures();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getOpponentName = (match) => {
    return `${match.team_a_name} vs ${match.team_b_name}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="My Fixtures" profilePath="/clubmanager/profile">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Fixtures</h1>
            <p className="text-gray-600">View and manage your club's match fixtures</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No fixtures available</p>
              <p className="text-gray-400 text-sm">Published matches will appear here once your club is enrolled in tournaments</p>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">
                            {getOpponentName(match)}
                          </h3>
                          <p className="text-sm text-gray-600">{match.match_number}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={18} />
                          <span>{formatDate(match.match_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={18} />
                          <span>{formatTime(match.match_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={18} />
                          <span>{match.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 ml-4">
                      <button
                        onClick={() => navigate(`/clubmanager/fixtures/${match.id}/playing-xi`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Users size={18} />
                        <span>Add Playing XI</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}

