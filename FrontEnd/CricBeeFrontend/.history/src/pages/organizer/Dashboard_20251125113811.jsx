"use client"
import { useDispatch } from 'react-redux';
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Trophy,
  Users,
  Zap,
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
} from "lucide-react"
import { useSelector } from "react-redux"
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role;
  console.log("User Role in Dashboard:", userRole);
  console.log("User in Dashboard:", user);
  const [tournaments, setTournaments] = useState([
    {
      id: 1,
      name: "Broto Type Premier League 2024",
      clubs: 12,
      matches: 24,
      revenue: "₹85,000",
      progress: 65,
      status: "Live",
      statusColor: "bg-red-500",
    },
    {
      id: 2,
      name: "Broto Type Kerala Cricket League",
      clubs: 8,
      matches: 16,
      revenue: "₹65,000",
      progress: 40,
      status: "Registration Open",
      statusColor: "bg-green-500",
    },
    {
      id: 3,
      name: "Broto Type Kochi Hub League",
      clubs: 16,
      matches: 32,
      revenue: "₹95,000",
      progress: 25,
      status: "Upcoming",
      statusColor: "bg-blue-500",
    },
  ])

  const statCards = [
    {
      title: "Active Tournaments",
      value: "3",
      change: "+2 this month",
      changeColor: "text-green-600",
      icon: Trophy,
      bgColor: "bg-green-100",
      iconBg: "bg-green-200",
    },
    {
      title: "Enrolled Clubs",
      value: "48",
      change: "Across all tournaments",
      changeColor: "text-blue-600",
      icon: Users,
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      title: "Total Matches",
      value: "156",
      change: "+24 this week",
      changeColor: "text-orange-600",
      icon: Zap,
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      title: "Total Revenue",
      value: "₹245,000",
      change: "+12.5% this month",
      changeColor: "text-green-600",
      icon: DollarSign,
      bgColor: "bg-green-100",
      iconBg: "bg-green-200",
    },
  ]

  const quickActions = [
    {
      icon: Zap,
      title: "Create Tournament",
      description: "Start a new tournament",
      bgColor: "from-teal-500 to-orange-500",
      isPrimary: true,
    },
    {
      icon: BarChart3,
      title: "My Tournaments",
      description: "View all tournaments",
      bgColor: "bg-gray-200",
    },
    {
      icon: Calendar,
      title: "Manage Fixtures",
      description: "Schedule & organize matches",
      bgColor: "bg-gray-100",
    },
    {
      icon: Users,
      title: "Tournament Enrollments",
      description: "Manage club enrollments",
      bgColor: "bg-gray-100",
    },
    {
      icon: Zap,
      title: "Match Management",
      description: "Monitor ongoing matches",
      bgColor: "bg-gray-100",
    },
    {
      icon: DollarSign,
      title: "View Payments",
      description: "Track financial transactions",
      bgColor: "bg-gray-100",
    },
  ]

  const handleLogout = async () => {
    try {
      // Call backend to invalidate session and clear httpOnly cookies
      await api.post(`/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
      // Don't fail the logout if the backend call fails—still clear local state
    } finally {
      // Clear the Redux state (this also clears persisted data via Redux Persist)
      dispatch(clearUser());
      // Redirect to signin page
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      Header
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-300 px-3 py-2 rounded font-bold text-gray-700">CricB</div>
            <div className="h-6 w-px bg-gray-300" />
          </div>
          <div className="flex items-center space-x-6">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-xs text-blue-600">{userRole}</p>
              </div>
               <div
      onClick={() => navigate("/organizer/profile")}
      className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold cursor-pointer hover:bg-blue-200 transition-all"
    >
      D
    </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb and Welcome */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <BarChart3 size={16} />
            <span>Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, Demo! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your tournaments today.</p>
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
            <p className="text-sm text-gray-600">Get started with common tasks</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Create Tournament Button */}
            <div
              className={`lg:col-span-1 bg-gradient-to-r from-teal-500 to-orange-500 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg">Create Tournament</p>
                  <p className="text-sm text-white/90">Start a new tournament</p>
                </div>
              </div>
            </div>

            {/* Other Quick Actions */}
            {quickActions.slice(1).map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
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

        {/* Recent Tournaments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Tournaments</h2>
            <button className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700">
              <span>View All</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-3 text-white">
                      <Trophy size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{tournament.name}</h3>
                      <p className="text-sm text-gray-600">
                        {tournament.clubs} clubs • {tournament.matches} matches • {tournament.revenue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-2">Progress</p>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-green-400"
                          style={{ width: `${tournament.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`${tournament.statusColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                      >
                        {tournament.status === "Live" ? "🔴" : tournament.status === "Registration Open" ? "✅" : "🔵"}{" "}
                        {tournament.status}
                      </span>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Verification Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start space-x-4">
          <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Account Verified</h3>
            <p className="text-sm text-green-700">Your organizer account is fully verified and active</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-green-700 font-semibold">Identity Verified</p>
              <CheckCircle size={16} className="text-green-600 mx-auto mt-1" />
            </div>
            <div className="text-center">
              <p className="text-xs text-green-700 font-semibold">Payment Verified</p>
              <CheckCircle size={16} className="text-green-600 mx-auto mt-1" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}