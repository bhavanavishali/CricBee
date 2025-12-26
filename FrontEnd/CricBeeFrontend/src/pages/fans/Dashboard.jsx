"use client"

import { useState, useEffect } from "react"
import { MapPin, Calendar, Users, Trophy, Eye, Play, Search, ChevronDown } from "lucide-react"
import Layout from '@/components/layouts/Layout'
import { getPublicTournaments, getPublicTournamentDetails, getPublicScoreboard, getLiveMatches } from '@/api/public'
import { useNavigate } from 'react-router-dom'

function TournamentCard({ tournament, onViewDetails }) {
  const statusColor = {
    "Live": "bg-red-500",
    "Upcoming": "bg-purple-600",
    "Registration Open": "bg-green-500",
    "ongoing": "bg-red-500",
    "upcoming": "bg-purple-600",
    "completed": "bg-gray-600",
  }

  // Map status_badge to display status
  const getDisplayStatus = () => {
    if (tournament.status_badge === 'ongoing') return 'Live';
    if (tournament.status_badge === 'upcoming') return 'Upcoming';
    if (tournament.status === 'registration_open') return 'Registration Open';
    return tournament.status || 'Upcoming';
  }

  const displayStatus = getDisplayStatus();

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Image Section */}
      <div
        className="h-32 relative flex-shrink-0"
        style={{
          background: tournament.image,
        }}
      >
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${statusColor[displayStatus] || statusColor["Upcoming"]} text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full`}>
            ● {displayStatus}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{tournament.tournament_name || tournament.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">{tournament.organizer_name || tournament.organization || 'N/A'}</p>

        {/* Details */}
        <div className="space-y-2 mb-4 flex-1">
          {tournament.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              <span>{tournament.location}</span>
            </div>
          )}
          {tournament.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              <span>{new Date(tournament.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          )}
          {tournament.team_range && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={16} className="text-gray-400" />
              <span>{tournament.team_range}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Eye size={16} />
              {tournament.views || 0}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onViewDetails(tournament.id)}
          className="w-full mt-3 bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition"
        >
          View Details
        </button>
      </div>
    </div>
  )
}


function HeroSection() {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">Cricket Stadium Wide Hero Image</h1>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Digital Cricket</h2>
      <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
        Complete cricket ecosystem with live scoring, streaming, tournament management, and fan engagement for the
        grassroots cricket community.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button className="bg-teal-500 text-white px-6 py-3 rounded font-semibold hover:bg-teal-600 transition">
          Register Tournament
        </button>
        <button className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition">
          Join as Club Manager
        </button>
        <button className="bg-orange-500 text-white px-6 py-3 rounded font-semibold hover:bg-orange-600 transition">
          Start a Score
        </button>
      </div>
    </div>
  )
}

function SearchSection({ searchQuery, setSearchQuery, onSearch, formatFilter, setFormatFilter, statusFilter, setStatusFilter, activeTab, setActiveTab }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
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
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
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
    </div>
  )
}


export default function FansDashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formatFilter, setFormatFilter] = useState('All Formats');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    loadTournaments();
    loadAllMatches();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Fetch all tournaments (excluding cancelled ones by default from API)
      const data = await getPublicTournaments();
      
      // Filter to show only active (ongoing) and upcoming tournaments
      // Exclude completed and cancelled tournaments
      const filteredTournaments = data.filter(t => {
        const status = t.status_badge || t.status;
        // Show only ongoing and upcoming tournaments
        return status === 'ongoing' || status === 'upcoming' || 
               t.status === 'registration_open' || t.status === 'registration_end' ||
               t.status === 'tournament_start';
      });

      // Add gradient images and format data for display
      const formattedTournaments = filteredTournaments.map((tournament, index) => {
        const gradients = [
          "linear-gradient(135deg, #10B981 0%, #8B5CF6 100%)",
          "linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)",
          "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
          "linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)",
        ];
        return {
          ...tournament,
          image: gradients[index % gradients.length],
        };
      });

      setTournaments(formattedTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (tournamentId) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const handleSearch = () => {
    // Search functionality can be implemented here
    loadTournaments();
  };

  const loadAllMatches = async () => {
    try {
      setMatchesLoading(true);
      const allMatches = [];
      const matchIds = new Set(); // To avoid duplicates
      
      // First, try to get live matches directly (faster and more reliable)
      try {
        const liveMatches = await getLiveMatches();
        console.log('Live matches from API:', liveMatches.length);
        liveMatches.forEach(match => {
          if (!matchIds.has(match.id)) {
            matchIds.add(match.id);
            allMatches.push({
              ...match,
              status: 'live',
              status_badge: 'live',
              viewers: Math.floor(Math.random() * 2000) + 100,
              scoreboard: null // Will load if needed
            });
          }
        });
      } catch (error) {
        console.error('Failed to load live matches:', error);
      }
      
      // Get all tournaments and load matches from each
      const tournamentsList = await getPublicTournaments();
      console.log('Loading matches from', tournamentsList.length, 'tournaments');
      console.log('Tournament IDs:', tournamentsList.map(t => t.id));
      
      // Load from all tournaments
      for (const tournament of tournamentsList) {
        try {
          const tournamentDetails = await getPublicTournamentDetails(tournament.id);
          const matchCount = tournamentDetails.matches?.length || 0;
          console.log(`Tournament ${tournament.id} (${tournamentDetails.tournament_name}): ${matchCount} matches`);
          
          if (tournamentDetails.matches && Array.isArray(tournamentDetails.matches) && tournamentDetails.matches.length > 0) {
            // Get scoreboard only for live matches to reduce API calls
            for (const match of tournamentDetails.matches) {
              // Skip if already added from live matches API
              if (matchIds.has(match.id)) {
                continue;
              }
              
              matchIds.add(match.id);
              let scoreboard = null;
              
              if (match.status === 'live' || match.status_badge === 'live') {
                try {
                  scoreboard = await getPublicScoreboard(match.id);
                } catch (error) {
                  console.error(`Failed to load scoreboard for match ${match.id}:`, error);
                }
              }
              
              allMatches.push({
                ...match,
                tournament_name: tournamentDetails.tournament_name,
                scoreboard: scoreboard,
                viewers: Math.floor(Math.random() * 2000) + 100
              });
            }
          }
        } catch (error) {
          console.error(`Failed to load tournament ${tournament.id}:`, error);
          // Log the full error for debugging
          if (error.response) {
            console.error('Error response:', error.response.data);
          }
        }
      }
      
      // Sort by date (most recent first)
      allMatches.sort((a, b) => {
        const dateA = new Date(a.match_date || 0);
        const dateB = new Date(b.match_date || 0);
        return dateB - dateA;
      });
      
      console.log('Total matches loaded:', allMatches.length);
      if (allMatches.length > 0) {
        console.log('Sample matches:', allMatches.slice(0, 3).map(m => ({
          id: m.id,
          tournament: m.tournament_name,
          teams: `${m.team_a_name} vs ${m.team_b_name}`,
          status: m.status_badge || m.status
        })));
      } else {
        console.warn('No matches found! Check if tournaments have matches in the database.');
      }
      setMatches(allMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
      console.error('Error details:', error.message, error.stack);
      setMatches([]);
    } finally {
      setMatchesLoading(false);
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

  // Filter tournaments based on search query
  const filteredTournaments = tournaments.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (t.tournament_name || '').toLowerCase().includes(query) ||
      (t.organizer_name || '').toLowerCase().includes(query) ||
      (t.location || '').toLowerCase().includes(query)
    );
  });

  // Separate ongoing and upcoming tournaments
  const ongoingTournaments = filteredTournaments.filter(t => 
    t.status_badge === 'ongoing' || t.status === 'tournament_start'
  );
  const upcomingTournaments = filteredTournaments.filter(t => 
    t.status_badge === 'upcoming' || 
    t.status === 'registration_open' || 
    t.status === 'registration_end'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout>
        <HeroSection />
        <SearchSection 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          formatFilter={formatFilter}
          setFormatFilter={setFormatFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="max-w-[1400px] mx-auto px-4 py-12">
          {activeTab === 'live' ? (
            /* Live Matches Tab */
            matchesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                <p className="mt-4 text-gray-600">Loading matches...</p>
              </div>
            ) : filteredMatches.filter(m => m.status === 'live' || m.status_badge === 'live').length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600 text-lg mb-2">No live matches at the moment</p>
                <p className="text-gray-500 text-sm">Check back later for live action!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMatches.filter(m => m.status === 'live' || m.status_badge === 'live').map((match) => {
                  const isLive = match.status === 'live' || match.status_badge === 'live';
                  const scoreboard = match.scoreboard;
                  const battingScore = scoreboard?.batting_score;
                  const bowlingScore = scoreboard?.bowling_score;
                  const inningsNumber = scoreboard?.innings_number || 1;
                  
                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{match.tournament_name}</h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* Team A */}
                          <div className="mb-3">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-gray-900">{match.team_a_name || 'Team A'}</span>
                              {scoreboard && scoreboard.batting_team_name === match.team_a_name && battingScore && (
                                <span className="text-sm text-gray-600">
                                  {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                </span>
                              )}
                              {scoreboard && scoreboard.bowling_team_name === match.team_a_name && bowlingScore && inningsNumber === 2 && (
                                <span className="text-sm text-gray-600">
                                  {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                </span>
                              )}
                            </div>
                            {scoreboard && scoreboard.batting_team_name === match.team_a_name && (
                              <span className="text-xs text-gray-500">
                                {inningsNumber === 1 ? '1st' : '2nd'} Innings
                              </span>
                            )}
                          </div>

                          {/* Team B */}
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-gray-900">{match.team_b_name || 'Team B'}</span>
                              {scoreboard && scoreboard.batting_team_name === match.team_b_name && battingScore && (
                                <span className="text-sm text-gray-600">
                                  {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                </span>
                              )}
                              {scoreboard && scoreboard.bowling_team_name === match.team_b_name && bowlingScore && inningsNumber === 2 && (
                                <span className="text-sm text-gray-600">
                                  {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                </span>
                              )}
                            </div>
                            {scoreboard && scoreboard.batting_team_name === match.team_b_name && (
                              <span className="text-xs text-gray-500">
                                {inningsNumber === 1 ? '1st' : '2nd'} Innings
                              </span>
                            )}
                          </div>
                        </div>

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
            )
          ) : (
            /* All Tournaments Tab */
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading tournaments...</p>
              </div>
            ) : (
              <>
                {/* Active Tournaments Section */}
                {ongoingTournaments.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Tournaments</h2>
                    <div
                      className="gap-6"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
                    >
                      {ongoingTournaments.map((tournament) => (
                        <TournamentCard
                          key={tournament.id}
                          tournament={tournament}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Tournaments Section */}
                {upcomingTournaments.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Tournaments</h2>
                    <div
                      className="gap-6"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
                    >
                      {upcomingTournaments.map((tournament) => (
                        <TournamentCard
                          key={tournament.id}
                          tournament={tournament}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Matches Section */}
                {!matchesLoading && matches.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">All Matches</h2>
                    {filteredMatches.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-600">No matches match your search or filters</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredMatches.map((match) => {
                          const isLive = match.status === 'live' || match.status_badge === 'live';
                          const scoreboard = match.scoreboard;
                          const battingScore = scoreboard?.batting_score;
                          const bowlingScore = scoreboard?.bowling_score;
                          const inningsNumber = scoreboard?.innings_number || 1;
                          
                          return (
                            <div
                              key={match.id}
                              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                              <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{match.tournament_name}</h3>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {/* Team A */}
                                  <div className="mb-3">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="font-bold text-gray-900">{match.team_a_name || 'Team A'}</span>
                                      {scoreboard && scoreboard.batting_team_name === match.team_a_name && battingScore && (
                                        <span className="text-sm text-gray-600">
                                          {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                        </span>
                                      )}
                                      {scoreboard && scoreboard.bowling_team_name === match.team_a_name && bowlingScore && inningsNumber === 2 && (
                                        <span className="text-sm text-gray-600">
                                          {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                        </span>
                                      )}
                                    </div>
                                    {scoreboard && scoreboard.batting_team_name === match.team_a_name && (
                                      <span className="text-xs text-gray-500">
                                        {inningsNumber === 1 ? '1st' : '2nd'} Innings
                                      </span>
                                    )}
                                  </div>

                                  {/* Team B */}
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="font-bold text-gray-900">{match.team_b_name || 'Team B'}</span>
                                      {scoreboard && scoreboard.batting_team_name === match.team_b_name && battingScore && (
                                        <span className="text-sm text-gray-600">
                                          {battingScore.runs || 0}/{battingScore.wickets || 0} ({formatOvers(battingScore.overs || 0)})
                                        </span>
                                      )}
                                      {scoreboard && scoreboard.bowling_team_name === match.team_b_name && bowlingScore && inningsNumber === 2 && (
                                        <span className="text-sm text-gray-600">
                                          {bowlingScore.runs || 0}/{bowlingScore.wickets || 0} ({formatOvers(bowlingScore.overs || 0)})
                                        </span>
                                      )}
                                    </div>
                                    {scoreboard && scoreboard.batting_team_name === match.team_b_name && (
                                      <span className="text-xs text-gray-500">
                                        {inningsNumber === 1 ? '1st' : '2nd'} Innings
                                      </span>
                                    )}
                                  </div>
                                </div>

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
                )}

                {/* No Tournaments Message */}
                {filteredTournaments.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No active or upcoming tournaments found</p>
                    <p className="text-gray-500 text-sm mt-2">Check back later for new tournaments!</p>
                  </div>
                )}
              </>
            )
          )}
        </main>
      </Layout>
    </div>
  );
}
