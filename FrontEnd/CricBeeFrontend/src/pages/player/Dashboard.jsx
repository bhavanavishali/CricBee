"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Calendar,
  Users,
  Target,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Clock,
} from "lucide-react"
import { useNavigate } from "react-router-dom";
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';
import { useDispatch } from "react-redux";
import Layout from '@/components/layouts/Layout'
import ClubInvitations from '@/components/player/ClubInvitations'
import { getPlayerDashboard } from '@/api/playerService'

export default function PlayerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    club: null,
    tournaments: [],
    matches: [],
    stats: {
      total_tournaments: 0,
      upcoming_matches: 0,
      completed_matches: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getPlayerDashboard();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('Failed to load dashboard data:', result.message);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'live':
        return 'bg-red-500';
      case 'upcoming':
      default:
        return 'bg-blue-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    // timeString is in HH:MM:SS format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Layout title="Player Dashboard" profilePath="/player/profile">
          <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          </main>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="Player Dashboard" profilePath="/player/profile">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-gray-600">Track your club, tournaments, and matches here.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tournaments</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.total_tournaments}</p>
                  <p className="text-sm text-green-600 mt-1">Enrolled</p>
                </div>
                <div className="bg-green-200 p-3 rounded-lg">
                  <Trophy size={24} className="text-gray-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming Matches</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.upcoming_matches}</p>
                  <p className="text-sm text-blue-600 mt-1">Scheduled</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-lg">
                  <Calendar size={24} className="text-gray-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed Matches</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.completed_matches}</p>
                  <p className="text-sm text-purple-600 mt-1">This season</p>
                </div>
                <div className="bg-purple-200 p-3 rounded-lg">
                  <Target size={24} className="text-gray-700" />
                </div>
              </div>
            </div>
          </div>

          {/* My Club Section */}
          {dashboardData.club ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Club</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
                    <Users size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">{dashboardData.club.club_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="inline mr-1" />
                      {dashboardData.club.location}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined: {formatDate(dashboardData.club.joined_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {dashboardData.club.short_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Club</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <Users size={48} className="mx-auto text-yellow-600 mb-3" />
                <p className="text-gray-700 font-medium">You are not part of any club yet</p>
                <p className="text-sm text-gray-600 mt-1">Accept a club invitation to get started</p>
              </div>
            </div>
          )}

          {/* Club Invitations */}
          <div className="mb-8">
            <ClubInvitations />
          </div>

          {/* Tournaments Section */}
          {dashboardData.tournaments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Enrolled Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{tournament.tournament_name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        {tournament.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <MapPin size={14} className="inline mr-1" />
                        {tournament.location}
                      </p>
                      <p>
                        <Calendar size={14} className="inline mr-1" />
                        {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                      </p>
                      <p className="text-xs">
                        <Trophy size={14} className="inline mr-1" />
                        {tournament.overs} Overs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matches Section */}
          {dashboardData.matches.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Matches</h2>
              </div>

              <div className="space-y-4">
                {dashboardData.matches.map((match) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">vs {match.opponent_name}</h3>
                            {match.round_name && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {match.round_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{match.tournament_name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-3">
                            <span className="flex items-center">
                              <Calendar size={14} className="inline mr-1" />
                              {formatDate(match.match_date)}
                            </span>
                            <span className="flex items-center">
                              <Clock size={14} className="inline mr-1" />
                              {formatTime(match.match_time)}
                            </span>
                            <span className="flex items-center">
                              <MapPin size={14} className="inline mr-1" />
                              {match.venue}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`${getStatusColor(match.match_status)} text-white text-xs font-semibold px-3 py-1 rounded-full capitalize`}
                        >
                          {match.match_status}
                        </span>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            dashboardData.club && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Matches</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium">No matches scheduled yet</p>
                  <p className="text-sm text-gray-600 mt-1">Matches will appear here once fixtures are published</p>
                </div>
              </div>
            )
          )}
        </main>
      </Layout>
    </div>
  )
}

