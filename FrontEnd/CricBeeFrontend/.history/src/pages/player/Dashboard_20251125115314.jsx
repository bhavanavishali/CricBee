"use client"

import { useState } from "react"
import {
  Trophy,
  Calendar,
  BarChart3,
  Target,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
} from "lucide-react"
import { useNavigate } from "react-router-dom";
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';
import { useDispatch } from "react-redux";
import Layout from '@/components/layouts/Layout'
export default function PlayerDashboard() {
  const dispatch = useDispatch();
  const [matches, setMatches] = useState([
    {
      id: 1,
      opponent: "Kochi Cricket Club",
      date: "2024-01-15",
      time: "10:00 AM",
      venue: "Kochi Stadium",
      status: "Upcoming",
      statusColor: "bg-blue-500",
    },
    {
      id: 2,
      opponent: "Thrissur Warriors",
      date: "2024-01-18",
      time: "2:00 PM",
      venue: "Thrissur Ground",
      status: "Upcoming",
      statusColor: "bg-blue-500",
    },
    {
      id: 3,
      opponent: "Calicut Kings",
      date: "2024-01-10",
      time: "4:00 PM",
      venue: "Calicut Stadium",
      status: "Completed",
      statusColor: "bg-green-500",
    },
  ])
  const navigate = useNavigate();
  const statCards = [
    {
      title: "Matches Played",
      value: "12",
      change: "This season",
      changeColor: "text-green-600",
      icon: Trophy,
      bgColor: "bg-green-100",
      iconBg: "bg-green-200",
    },
    {
      title: "Upcoming Matches",
      value: "5",
      change: "Next 2 weeks",
      changeColor: "text-blue-600",
      icon: Calendar,
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      title: "Runs Scored",
      value: "450",
      change: "+50 this month",
      changeColor: "text-orange-600",
      icon: Target,
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      title: "Wickets Taken",
      value: "18",
      change: "+3 this month",
      changeColor: "text-purple-600",
      icon: BarChart3,
      bgColor: "bg-purple-100",
      iconBg: "bg-purple-200",
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
      {/* Header */}
      <Layout title="My Matches" profilePath="/player/profile"></Layout>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb and Welcome */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <BarChart3 size={16} />
            <span>Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
          <p className="text-gray-600">Track your matches and performance here.</p>
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

        {/* Upcoming Matches */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Matches</h2>
            <button className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700">
              <span>View All</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white">
                      <Calendar size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">vs {match.opponent}</h3>
                      <p className="text-sm text-gray-600">
                        {match.date} • {match.time} • {match.venue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`${match.statusColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                    >
                      {match.status}
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

