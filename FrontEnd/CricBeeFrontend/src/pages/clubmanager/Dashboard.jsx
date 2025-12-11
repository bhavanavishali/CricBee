"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux"
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';
import Layout from '@/components/layouts/Layout'
import {
  Bell,
  Settings,
  LogOut,
  Trophy,
  Users,
  Calendar,
  Gift,
  Play,
  DollarSign,
  User,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react"

export default function ClubManagerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true)
  const [enrolledTournaments, setEnrolledTournaments] = useState(0)
  const [activeTeams, setActiveTeams] = useState(0)
  const [upcomingMatchesCount, setUpcomingMatchesCount] = useState(0)
  const [fanGifts, setFanGifts] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(28)

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load club profile to get club data
      // You can add API calls here to fetch real data
      // For now using mock data structure
      setEnrolledTournaments(4);
      setActiveTeams(3);
      setUpcomingMatchesCount(2);
      setFanGifts(15000);
      setTotalPlayers(28);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

  const upcomingMatches = [
    {
      id: 1,
      tournamentName: "Mumbai Premier League 2024",
      opponent: "vs Delhi Tigers",
      venue: "Wankhede Stadium",
      date: "20/03/2024",
      time: "14:00",
      status: "Upcoming",
    },
    {
      id: 2,
      tournamentName: "Corporate Cricket Championship",
      opponent: "vs Chennai Strikers",
      venue: "DY Patil Stadium",
      date: "22/03/2024",
      time: "16:00",
      status: "Upcoming",
    },
  ]

  const recentActivities = [
    {
      icon: Trophy,
      tournament: "Mumbai Premier League 2024",
      text: "Fixture published • Next match vs Delhi Tigers",
      time: "2 hours ago",
      status: "🔴 Live",
      statusColor: "bg-red-100 text-red-600",
    },
    {
      icon: DollarSign,
      tournament: "Payment Received",
      text: "Corporate Cricket Championship • ₹25,000",
      time: "1 day ago",
      status: "✓ Paid",
      statusColor: "bg-green-100 text-green-600",
    },
  ]

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
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Enrolled Tournaments */}
            <div 
              onClick={() => navigate('/clubmanager/enrollments')}
              className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Enrolled Tournaments</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : enrolledTournaments}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    ✓ +1 this month
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
                  <p className="text-sm text-gray-500 mb-2">Active Teams</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : activeTeams}</p>
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                    👥 {totalPlayers} total players
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Upcoming Matches</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : upcomingMatchesCount}</p>
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                    📅 Next: Tomorrow 2:00 PM
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Fan Gifts Received */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Fan Gifts Received</p>
                  <p className="text-4xl font-bold text-gray-900">{loading ? "..." : `₹${fanGifts.toLocaleString('en-IN')}`}</p>
                  <p className="text-sm text-purple-600 mt-2 flex items-center gap-1">
                    👥 From 42 fans
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-purple-600" />
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

              {/* My Teams */}
              <div 
                onClick={() => navigate('/clubmanager/teams')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Teams</p>
                    <p className="text-sm text-gray-500">Manage tournament teams</p>
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

              {/* Fan Gifting */}
              <div 
                onClick={() => navigate('/clubmanager/fan-gifts')}
                className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fan Gifting</p>
                    <p className="text-sm text-gray-500">View fan contributions</p>
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

          {/* Upcoming Matches Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Matches</h2>
              <button
                onClick={() => navigate('/clubmanager/fixtures')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All Fixtures <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-lg p-6 border border-gray-100 cursor-pointer hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg"></div>
                      <div>
                        <p className="font-semibold text-gray-900">{match.tournamentName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                          <span>{match.opponent}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {match.venue}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{match.date}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {match.time}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                        Upcoming
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Latest updates</a>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="bg-white rounded-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{activity.tournament}</p>
                          <p className="text-sm text-gray-500">{activity.text}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{activity.time}</span>
                        <span className={`px-2 py-1 ${activity.statusColor} text-xs font-semibold rounded flex items-center gap-1`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </Layout>
    </div>
  )
}
