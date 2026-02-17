import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { getLiveMatches } from '@/api/public';

const LiveMatches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveMatches();
    // Refresh every 5 seconds for live matches
    const interval = setInterval(loadLiveMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveMatches = async () => {
    try {
      const data = await getLiveMatches();
      setMatches(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load live matches:', error);
      setLoading(false);
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
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-8 w-8 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">Live Matches</h1>
          </div>
          <p className="text-gray-600">Watch live cricket matches in real-time</p>
        </div>

        {/* Live Matches List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading live matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Radio className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No live matches at the moment</p>
            <p className="text-gray-500">Check back later for live action!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-red-600"
                onClick={() => navigate(`/matches/${match.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                      {match.tournament_name && (
                        <span className="text-sm text-gray-600">{match.tournament_name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-bold text-xl">{match.team_a_name}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-bold text-xl">{match.team_b_name}</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-lg text-gray-900">
                          {match.score}
                        </span>
                        <span className="text-gray-500">
                          ({match.overs.toFixed(1)} overs)
                        </span>
                      </div>
                      {match.ground && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {match.ground}
                        </div>
                      )}
                      {match.match_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(match.match_date)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <span>View Score</span>
                    <ArrowRight className="h-5 w-5" />
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

export default LiveMatches;

