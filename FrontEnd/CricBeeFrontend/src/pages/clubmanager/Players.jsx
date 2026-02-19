"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import Layout from '@/components/layouts/Layout'
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  X,
  ArrowLeft
} from "lucide-react"
import { getMyFixtures, getClubPlayersForMatch, setPlayingXI, getPlayingXI, getClubPlayers, removePlayerFromClub } from '@/api/clubmanager/fixture'
import { getDashboardStats } from '@/api/clubmanager/dashboardService'
import Swal from 'sweetalert2'
import api from '@/api'

export default function PlayersPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPlayers, setFilteredPlayers] = useState([])
  const [clubId, setClubId] = useState(null)

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    const filtered = players.filter(player => 
      player.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.player_profile?.cricb_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPlayers(filtered)
  }, [searchTerm, players])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      
      // Get club ID from dashboard stats
      const statsResult = await getDashboardStats()
      if (statsResult.success && statsResult.data.club_id) {
        setClubId(statsResult.data.club_id)
      }
      
      const result = await getClubPlayers()
      
      if (result.success) {
        setPlayers(result.data.players || [])
      } else {
        console.error('Players API error:', result.message)
        
        // Try to get test data as fallback
        try {
          const testResponse = await api.get('/club-profile/players-test');
          if (testResponse.data && testResponse.data.players) {
            setPlayers(testResponse.data.players)
          } else {
            setPlayers([])
          }
        } catch (testError) {
          setPlayers([])
        }
        
        Swal.fire({
          icon: 'warning',
          title: 'API Error',
          text: result.message || 'Using test data.',
          confirmButtonColor: '#10b981',
        })
      }
    } catch (error) {
      console.error('Failed to load players:', error)
      
      // Try to get test data as fallback
      try {
        const testResponse = await api.get('/club-profile/players-test');
        if (testResponse.data && testResponse.data.players) {
          setPlayers(testResponse.data.players)
        } else {
          setPlayers([])
        }
      } catch (testError) {
        setPlayers([])
      }
      
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'Failed to load players. Using test data.',
        confirmButtonColor: '#10b981',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlayer = async (player) => {
    const result = await Swal.fire({
      title: 'Remove Player?',
      html: `
        <p>Are you sure you want to remove <strong>${player.user?.full_name || 'this player'}</strong> from the club?</p>
        <p class="text-sm text-gray-600 mt-2">Note: Players in Playing XI for upcoming/live matches cannot be removed.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      if (!clubId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Club information not found. Please refresh the page.',
          confirmButtonColor: '#10b981',
        })
        return
      }

      const removeResult = await removePlayerFromClub(clubId, player.player_profile.id)
      
      if (removeResult.success) {
        Swal.fire({
          icon: 'success',
          title: 'Player Removed',
          text: removeResult.message || 'Player has been removed from the club successfully',
          confirmButtonColor: '#10b981',
          timer: 2000,
        })
        loadPlayers() // Reload players list
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Remove Player',
          text: removeResult.message,
          confirmButtonColor: '#10b981',
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to remove player',
        confirmButtonColor: '#10b981',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="My Players" profilePath="/clubmanager/profile">
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Players</h1>
              <p className="text-gray-500">Manage all players in your club</p>
              <button
            onClick={() => navigate('/clubmanager/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </button>
            </div>
            
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search players by name or CricB ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-600">Loading players...</div>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No players match your search criteria.' : 'No players in your club yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CricB ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {player.user?.full_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {player.player_profile?.age ? `${player.player_profile.age} years` : 'Age not set'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {player.player_profile?.cricb_id || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              {player.user?.email || 'N/A'}
                            </div>
                            <div className="flex items-center mt-1">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {player.user?.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {player.joined_at ? new Date(player.joined_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemovePlayer(player)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Remove player from club"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </Layout>
    </div>
  )
}
