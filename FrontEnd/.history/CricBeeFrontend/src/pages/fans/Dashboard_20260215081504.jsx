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
      <h1 className="text-4xl md:text-5xl font-bold mb-6">Cricket Tournaments</h1>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Digital Cricket</h2>
      <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
        Discover and follow live cricket tournaments with real-time scores and streaming.
      </p>
    </div>
  )
}

function SearchSection({ searchQuery, setSearchQuery, onSearch }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournaments</h1>
        <p className="text-gray-600">Discover and follow cricket tournaments.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


export default function FansDashboard() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tournamentsPerPage = 4;

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search query changes
  }, [searchQuery]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Fetch all tournaments (excluding cancelled ones by default from API)
      const data = await getPublicTournaments();
      
      // Display all tournaments in creation order (no status filtering)
      const allTournaments = data;

      // Add gradient images and format data for display
      const formattedTournaments = allTournaments.map((tournament, index) => {
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

      // Sort by created_at date (newest first) as a fallback
      formattedTournaments.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });

      setTournaments(formattedTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchLive = (matchId) => {
    // Navigate to match-level streaming page
    navigate(`/watch-live/${matchId}`);
  };

  const handleViewDetails = (tournamentId) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  const handleSearch = () => {
    // Search functionality can be implemented here
    loadTournaments();
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

  // Pagination logic
  const indexOfLastTournament = currentPage * tournamentsPerPage;
  const indexOfFirstTournament = indexOfLastTournament - tournamentsPerPage;
  const currentTournaments = filteredTournaments.slice(indexOfFirstTournament, indexOfLastTournament);
  const totalPages = Math.ceil(filteredTournaments.length / tournamentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout>
        <HeroSection />
        <SearchSection 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />

        <main className="max-w-[1400px] mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No tournaments found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 rounded-lg font-medium transition ${
                          currentPage === pageNumber
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-medium transition ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
              
              <div className="text-center mt-4 text-sm text-gray-600">
                Showing {currentTournaments.length} of {filteredTournaments.length} tournaments
              </div>
            </>
          )}
        </main>
      </Layout>
    </div>
  );
};
