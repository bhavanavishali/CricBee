import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Play, Eye } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import { getLiveMatches, getPublicTournaments, getPublicTournamentDetails, getPublicScoreboard } from '@/api/public';

const ExploreMatches = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('All Formats');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [activeTab]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      if (activeTab === 'live') {
        // Load only live matches
        const liveMatches = await getLiveMatches();
        console.log('Live matches loaded:', liveMatches);
        // Transform live matches data to match our component structure
        const transformedMatches = liveMatches.map(match => ({
          ...match,
          status: 'live',
          status_badge: 'live',
          viewers: Math.floor(Math.random() * 2000) + 100,
          // For live matches, we need to get scoreboard for detailed scores
          scoreboard: null // Will be loaded if needed
        }));
        setMatches(transformedMatches);
      } else {
        // Load all matches from all tournaments
        const tournaments = await getPublicTournaments();
        console.log('Tournaments loaded:', tournaments.length);
        const allMatches = [];
        
        // Fetch matches from each tournament
        // Limit to first 20 tournaments to avoid too many API calls
        const limitedTournaments = tournaments.slice(0, 20);
        
        for (const tournament of limitedTournaments) {
          try {
            const tournamentDetails = await getPublicTournamentDetails(tournament.id);
            console.log(`Tournament ${tournament.id} has ${tournamentDetails.matches?.length || 0} matches`);
            
            if (tournamentDetails.matches && tournamentDetails.matches.length > 0) {
              // Get scoreboard for each match to get scores (only for live matches to reduce API calls)
              for (const match of tournamentDetails.matches) {
                let scoreboard = null;
                if (match.status === 'live' || match.status_badge === 'live') {
                  try {
                    scoreboard = await getPublicScoreboard(match.id);
                  } catch (error) {
                    // If scoreboard not available, continue without it
                    console.error(`Failed to load scoreboard for match ${match.id}:`, error);
                  }
                }
                
                allMatches.push({
                  ...match,
                  tournament_name: tournamentDetails.tournament_name,
                  scoreboard: scoreboard,
                  viewers: Math.floor(Math.random() * 2000) + 100 // Simulated viewer count
                });
              }
            }
          } catch (error) {
            console.error(`Failed to load tournament ${tournament.id}:`, error);
          }
        }
        
        console.log('Total matches loaded:', allMatches.length);
        
        // Sort by date (most recent first)
        allMatches.sort((a, b) => {
          const dateA = new Date(a.match_date || 0);
          const dateB = new Date(b.match_date || 0);
          return dateB - dateA;
        });
        
        setMatches(allMatches);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };


  const formatOvers = (overs) => {
    if (!overs) return '0.0';
    const overParts = overs.toString().split('.');
    return `${overParts[0]}.${overParts[1] || 0}`;
  };

  const filteredMatches = matches.filter(match => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (match.tournament_name || '').toLowerCase().includes(query) ||
        (match.team_a_name || '').toLowerCase().includes(query) ||
        (match.team_b_name || '').toLowerCase().includes(query) ||
        (match.venue || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      const matchStatus = match.status_badge || match.status || 'scheduled';
      if (statusFilter === 'Live' && matchStatus !== 'live') return false;
      if (statusFilter === 'Scheduled' && matchStatus !== 'scheduled' && matchStatus !== 'upcoming') return false;
      if (statusFilter === 'Completed' && matchStatus !== 'completed') return false;
    }

    return true;
  });

  const handleWatchLive = (matchId) => {
    navigate(`/watch-live/${matchId}`);
  };

  const handleViewScorecard = (matchId) => {
    navigate(`/matches/${matchId}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Tournaments</h1>
            <p className="text-gray-600">Discover and follow live cricket tournaments.</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tournaments or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option>All Formats</option>
                    <option>T20</option>
                    <option>ODI</option>
                    <option>Test</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Live</option>
                    <option>Scheduled</option>
                    <option>Completed</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Tournaments
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'live'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Live Matches
            </button>
          </div>

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p><strong>Debug:</strong> Total matches: {matches.length}, Filtered: {filteredMatches.length}, Tab: {activeTab}</p>
            </div>
          )}

          {/* Matches List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 text-lg mb-2">
                {matches.length === 0 
                  ? activeTab === 'live' 
                    ? 'No live matches at the moment' 
                    : 'No matches found in tournaments'
                  : 'No matches match your search or filters'}
              </p>
              <p className="text-gray-500 text-sm">
                {matches.length === 0 
                  ? activeTab === 'live'
                    ? 'Check back later for live action!'
                    : 'Tournaments may not have matches scheduled yet.'
                  : 'Try adjusting your search or filters'}
              </p>
              {matches.length > 0 && (
                <p className="text-gray-400 text-xs mt-2">
                  Showing {filteredMatches.length} of {matches.length} matches
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => {
                const isLive = match.status === 'live' || match.status_badge === 'live';
                const scoreboard = match.scoreboard;
                const battingScore = scoreboard?.batting_score;
                const bowlingScore = scoreboard?.bowling_score;
                const inningsNumber = scoreboard?.innings_number || 1;
                
                // For live matches from getLiveMatches API, use direct score data
                const directScore = match.score;
                const directOvers = match.overs;
                
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    {/* Tournament Name */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {match.tournament_name || 'Tournament'}
                      </h3>
                    </div>

                    {/* Match Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {/* Team A */}
                        <div className="mb-3">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-gray-900">{match.team_a_name || 'Team A'}</span>
                            {/* Show score from scoreboard if available */}
                            {scoreboard ? (
                              <>
                                {scoreboard.batting_team_name === match.team_a_name && battingScore && (
                                  <span className="text-sm text-gray-600">
                                    {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                  </span>
                                )}
                                {scoreboard.bowling_team_name === match.team_a_name && bowlingScore && inningsNumber === 2 && (
                                  <span className="text-sm text-gray-600">
                                    {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                  </span>
                                )}
                              </>
                            ) : (
                              /* Show direct score for live matches from API */
                              isLive && directScore && match.batting_team_name === match.team_a_name && (
                                <span className="text-sm text-gray-600">
                                  {directScore} ({formatOvers(directOvers || 0)})
                                </span>
                              )
                            )}
                          </div>
                          {scoreboard && scoreboard.batting_team_name === match.team_a_name && inningsNumber === 1 && (
                            <span className="text-xs text-gray-500">1st Innings</span>
                          )}
                          {scoreboard && scoreboard.batting_team_name === match.team_a_name && inningsNumber === 2 && (
                            <span className="text-xs text-gray-500">2nd Innings</span>
                          )}
                          {isLive && !scoreboard && match.batting_team_name === match.team_a_name && (
                            <span className="text-xs text-gray-500">1st Innings</span>
                          )}
                        </div>

                        {/* Team B */}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-gray-900">{match.team_b_name || 'Team B'}</span>
                            {/* Show score from scoreboard if available */}
                            {scoreboard ? (
                              <>
                                {scoreboard.batting_team_name === match.team_b_name && battingScore && (
                                  <span className="text-sm text-gray-600">
                                    {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                  </span>
                                )}
                                {scoreboard.bowling_team_name === match.team_b_name && bowlingScore && inningsNumber === 2 && (
                                  <span className="text-sm text-gray-600">
                                    {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                  </span>
                                )}
                              </>
                            ) : (
                              /* Show direct score for live matches from API */
                              isLive && directScore && match.batting_team_name === match.team_b_name && (
                                <span className="text-sm text-gray-600">
                                  {directScore} ({formatOvers(directOvers || 0)})
                                </span>
                              )
                            )}
                          </div>
                          {scoreboard && scoreboard.batting_team_name === match.team_b_name && inningsNumber === 1 && (
                            <span className="text-xs text-gray-500">1st Innings</span>
                          )}
                          {scoreboard && scoreboard.batting_team_name === match.team_b_name && inningsNumber === 2 && (
                            <span className="text-xs text-gray-500">2nd Innings</span>
                          )}
                          {isLive && !scoreboard && match.batting_team_name === match.team_b_name && (
                            <span className="text-xs text-gray-500">1st Innings</span>
                          )}
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                          {isLive && (
                            <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                              LIVE
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Eye size={16} />
                            <span className="text-sm font-semibold">{match.viewers || 0}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isLive && (
                            <button
                              onClick={() => handleWatchLive(match.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
                            >
                              <Play size={16} />
                              Watch Live
                            </button>
                          )}
                          <button
                            onClick={() => handleViewScorecard(match.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                          >
                            <Eye size={16} />
                            Scorecard
                          </button>
                        </div>
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

export default ExploreMatches;

