"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux"
import { clearUser } from '@/store/slices/authSlice';
import { getDashboardStats } from '@/api/clubmanager/dashboardService';
import Layout from '@/components/layouts/Layout'
import {
  Bell,
  Settings,
  LogOut,
  Trophy,
  Users,
  Calendar,
  Play,
  DollarSign,
  User,
} from "lucide-react"

export default function ClubManagerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [tournamentCount, setTournamentCount] = useState(0)

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getDashboardStats();
      if (result.success) {
        setTotalPlayers(result.data.player_count || 0);
        setTournamentCount(result.data.tournament_count || 0);
      } else {
        console.error('Failed to load dashboard data:', result.message);
        setTotalPlayers(0);
        setTournamentCount(0);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setTotalPlayers(0);
      setTournamentCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(clearUser());
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="Dashboard" profilePath="/clubmanager/profile">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Welcome Section */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.full_name || 'Demo'}! 👋
              </h1>
              <p className="text-gray-500">Manage your club and tournament participation from here.</p>
            </div>
            <button 
              onClick={() => navigate('/clubmanager/profile')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ⚙️ Club Settings
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Enrolled Tournaments */}
            <div 
              onClick={() => navigate('/clubmanager/enrollments')}
              className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Enrolled Tournaments</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : tournamentCount}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    View all enrollments
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Active Teams */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">My Players</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : totalPlayers}</p>
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                    👥 Total team members
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Manage your club activities</a>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Featured: Enroll in Tournament */}
              <div 
                onClick={() => navigate('/clubmanager/tournaments')}
                className="col-span-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6" fill="white" />
                  <div>
                    <p className="font-semibold">Enroll in Tournament</p>
                    <p className="text-sm opacity-90">Browse and join tournaments</p>
                  </div>
                </div>
              </div>

              {/* My Enrollments */}
              <div 
                onClick={() => navigate('/clubmanager/enrollments')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Enrollments</p>
                    <p className="text-sm text-gray-500">View enrolled tournaments</p>
                  </div>
                </div>
              </div>

              {/* My Players */}
              <div 
                onClick={() => navigate('/clubmanager/players')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Players</p>
                    <p className="text-sm text-gray-500">Manage all players</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* My Fixtures */}
              <div 
                onClick={() => navigate('/clubmanager/fixtures')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Fixtures</p>
                    <p className="text-sm text-gray-500">View matches & schedules</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Payments */}
              <div 
                onClick={() => navigate('/clubmanager/payments')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Payments</p>
                    <p className="text-sm text-gray-500">Transaction history</p>
                  </div>
                </div>
              </div>

              {/* Profile */}
              <div 
                onClick={() => navigate('/clubmanager/profile')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Profile</p>
                    <p className="text-sm text-gray-500">Club info & achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </div>
  )
}
