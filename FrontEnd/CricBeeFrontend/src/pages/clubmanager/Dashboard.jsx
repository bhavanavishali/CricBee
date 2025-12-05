"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux"
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';
import Layout from '@/components/layouts/Layout'
import {
  Users,
  Trophy,
  Calendar,
  DollarSign,
  Gift,
  BarChart3,
  ChevronRight,
  Zap,
  Eye,
  CheckCircle,
  Star,
} from "lucide-react"

export default function ClubManagerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState([])
  const [enrolledTournaments, setEnrolledTournaments] = useState(0)
  const [activeTeams, setActiveTeams] = useState(0)
  const [upcomingMatchesCount, setUpcomingMatchesCount] = useState(0)
  const [fanGifts, setFanGifts] = useState(0)

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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Enrolled Tournaments",
      value: loading ? "..." : enrolledTournaments.toString(),
      change: "+1 this month",
      changeColor: "text-green-600",
      icon: Trophy,
      bgColor: "bg-green-100",
      iconBg: "bg-green-200",
    },
    {
      title: "Active Teams",
      value: loading ? "..." : activeTeams.toString(),
      change: "28 total players",
      changeColor: "text-blue-600",
      icon: Users,
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      title: "Upcoming Matches",
      value: loading ? "..." : upcomingMatchesCount.toString(),
      change: "Next: Tomorrow 2:00 PM",
      changeColor: "text-orange-600",
      icon: Calendar,
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      title: "Fan Gifts Received",
      value: loading ? "..." : `₹${fanGifts.toLocaleString('en-IN')}`,
      change: "From 42 fans",
      changeColor: "text-purple-600",
      icon: Gift,
      bgColor: "bg-purple-100",
      iconBg: "bg-purple-200",
    },
  ]

  const quickActions = [
    {
      icon: Trophy,
      title: "Enroll in Tournament",
      description: "Browse and join tournaments",
      bgColor: "from-teal-500 to-orange-500",
      isPrimary: true,
      route: "/clubmanager/tournaments"
    },
    {
      icon: Users,
      title: "My Teams",
      description: "Manage tournament teams",
      bgColor: "bg-gray-200",
      route: "/clubmanager/teams"
    },
    {
      icon: Calendar,
      title: "My Fixtures",
      description: "View matches & schedules",
      bgColor: "bg-gray-100",
      route: "/clubmanager/fixtures"
    },
    {
      icon: DollarSign,
      title: "Payments",
      description: "Transaction history",
      bgColor: "bg-gray-100",
      route: "/clubmanager/payments"
    },
    {
      icon: Gift,
      title: "Fan Gifting",
      description: "View fan contributions",
      bgColor: "bg-gray-100",
      route: "/clubmanager/fan-gifts"
    },
    {
      icon: Users,
      title: "Profile",
      description: "Club info & achievements",
      bgColor: "bg-gray-100",
      route: "/clubmanager/profile"
    },
  ]

  const upcomingMatches = [
    {
      id: 1,
      tournamentName: "Mumbai Premier League 2024",
      opponent: "vs Delhi Tigers",
      venue: "Wankhede Stadium",
      date: "20/03/2024",
      time: "14:00",
      status: "Upcoming",
      statusColor: "bg-blue-100 text-blue-700"
    },
    {
      id: 2,
      tournamentName: "Corporate Cricket Championship",
      opponent: "vs Chennai Strikers",
      venue: "DY Patil Stadium",
      date: "22/03/2024",
      time: "16:00",
      status: "Upcoming",
      statusColor: "bg-blue-100 text-blue-700"
    },
  ]

  const recentActivities = [
    {
      icon: Trophy,
      iconColor: "text-green-600",
      text: "Fixture published • Next match vs Delhi Tigers",
      tournament: "Mumbai Premier League 2024",
      time: "2 hours ago",
      status: "Live",
      statusColor: "bg-red-100 text-red-700"
    },
    {
      icon: DollarSign,
      iconColor: "text-green-600",
      text: "Payment Received • ₹25,000",
      tournament: "Corporate Cricket Championship",
      time: "1 day ago",
      status: "✔ Paid",
      statusColor: "bg-green-100 text-green-700"
    },
    {
      icon: Users,
      iconColor: "text-blue-600",
      text: "Team Squad Updated • Added 2 new players",
      tournament: "Weekend Warriors Cup",
      time: "2 days ago",
      status: "✓ Completed",
      statusColor: "bg-purple-100 text-purple-700"
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="My Clubs" profilePath="/clubmanager/profile">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb and Welcome */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.full_name || 'Club Manager'}! 👋
            </h1>
            <p className="text-gray-600">Manage your club and tournament participation from here.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                      <p className={`text-sm ${card.changeColor} mt-1`}>{card.change}</p>
                    </div>
                    <div className={`${card.iconBg} p-3 rounded-lg`}>
                      <Icon size={24} className="text-gray-700" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Manage your club activities</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Enroll in Tournament Button */}
              <div
                onClick={() => navigate('/clubmanager/tournaments')}
                className={`lg:col-span-1 bg-gradient-to-r from-teal-500 to-orange-500 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Enroll in Tournament</p>
                    <p className="text-sm text-white/90">Browse and join tournaments</p>
                  </div>
                </div>
              </div>

              {/* Other Quick Actions */}
              {quickActions.slice(1).map((action, index) => {
                const Icon = action.icon
                return (
                  <div
                    key={index}
                    onClick={() => navigate(action.route)}
                    className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Icon size={24} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Matches</h2>
              <button
                onClick={() => navigate('/clubmanager/fixtures')}
                className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700"
              >
                <span>View All Fixtures</span>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-3 text-white">
                      <Trophy size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{match.tournamentName}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {match.opponent} • {match.venue}
                      </p>
                      <p className="text-xs text-gray-500">
                        {match.date} • {match.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`${match.statusColor} text-xs font-semibold px-3 py-1 rounded-full`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => navigate('/clubmanager/activity')}
                className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700"
              >
                <span>Latest updates</span>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className={`${activity.iconColor} p-2 rounded-lg bg-gray-50`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{activity.tournament}</p>
                        <p className="text-sm text-gray-600 mb-2">{activity.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{activity.time}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.statusColor}`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">
                  Excellent Performance! Your club has completed 88% of matches successfully.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                ✔ Verified Club
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                ★4.8 Rating
              </span>
            </div>
          </div>
        </main>
      </Layout>
    </div>
  )
}
