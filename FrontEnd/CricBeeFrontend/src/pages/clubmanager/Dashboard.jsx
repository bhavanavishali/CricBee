

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Users,
  Trophy,
  Calendar,
  DollarSign,
  BarChart3,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
} from "lucide-react"

export default function ClubManagerDashboard() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState([
    {
      id: 1,
      name: "Kochi Cricket Club",
      tournaments: 3,
      players: 25,
      matches: 12,
      status: "Active",
      statusColor: "bg-green-500",
    },
    {
      id: 2,
      name: "Thrissur Warriors",
      tournaments: 2,
      players: 20,
      matches: 8,
      status: "Active",
      statusColor: "bg-green-500",
    },
  ])

  const statCards = [
    {
      title: "My Clubs",
      value: "2",
      change: "Active clubs",
      changeColor: "text-green-600",
      icon: Users,
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      title: "Active Tournaments",
      value: "5",
      change: "Enrolled tournaments",
      changeColor: "text-blue-600",
      icon: Trophy,
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      title: "Total Players",
      value: "45",
      change: "Across all clubs",
      changeColor: "text-purple-600",
      icon: Users,
      bgColor: "bg-purple-100",
      iconBg: "bg-purple-200",
    },
    {
      title: "Upcoming Matches",
      value: "20",
      change: "Next 7 days",
      changeColor: "text-orange-600",
      icon: Calendar,
      bgColor: "bg-teal-100",
      iconBg: "bg-teal-200",
    },
  ]

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Clear any auth tokens or localStorage data (adjust as per your auth implementation)
    localStorage.removeItem('authToken') // Example: remove token if stored
    navigate('/signin') // Redirect to login page
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <p className="text-sm font-semibold text-gray-900">Club Manager</p>
                <p className="text-xs text-blue-600">Manager</p>
              </div>
              <div onClick={() => navigate("/club_manager/profile")}
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                CM
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
          <p className="text-gray-600">Manage your clubs and tournaments from here.</p>
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

        {/* My Clubs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Clubs</h2>
            <button className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700">
              <span>View All</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-3 text-white">
                      <Trophy size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{club.name}</h3>
                      <p className="text-sm text-gray-600">
                        {club.tournaments} tournaments • {club.players} players • {club.matches} matches
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`${club.statusColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                    >
                      {club.status}
                    </span>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
