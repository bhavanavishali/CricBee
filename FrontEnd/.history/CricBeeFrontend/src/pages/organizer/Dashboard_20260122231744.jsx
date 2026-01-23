"use client"
import { useDispatch } from 'react-redux';
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Trophy,
  Users,
  Target,
  DollarSign,
  Plus,
  Calendar,
  BarChart3,
  ChevronRight,
  Bell,
  Settings,
  X,
  FileText,
} from "lucide-react"
import { useSelector } from "react-redux"
import { clearUser } from '@/store/slices/authSlice';
import api from '@/api';
import Layout from '@/components/layouts/Layout'
import { getMyTournaments, getMyTransactions, cancelTournament, getEnrolledClubs } from '@/api/organizer/tournament'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [tournaments, setTournaments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)

  useEffect(() => {
    loadTournaments();
    loadTransactions();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getMyTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const data = await getMyTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const getStatusBadge = (tournament) => {
    if (tournament.status === 'tournament_start') {
      return { text: '🔴 Live', bg: 'bg-red-100', textColor: 'text-red-700' };
    } else if (tournament.status === 'registration_open') {
      return { text: '✅ Registration Open', bg: 'bg-green-100', textColor: 'text-green-700' };
    } else if (tournament.status === 'pending_payment') {
      return { text: '📅 Upcoming', bg: 'bg-blue-100', textColor: 'text-blue-700' };
    } else {
      return { text: '📅 Upcoming', bg: 'bg-blue-100', textColor: 'text-blue-700' };
    }
  };

  const calculateProgress = (tournament) => {
  
    if (tournament.details?.total_matches && tournament.details?.completed_matches) {
      return (tournament.details.completed_matches / tournament.details.total_matches) * 100;
    }
    return 0;
  };

  const canCancel = (tournament) => {
    if (tournament.status === 'cancelled') return false;
    if (!tournament.payment || tournament.payment.payment_status !== 'success') return false;
    if (!tournament.details?.registration_end_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regEndDate = new Date(tournament.details.registration_end_date);
    regEndDate.setHours(0, 0, 0, 0);
    
    return today <= regEndDate;
  };

  const handleCancelTournament = async (tournamentId) => {
    try {
      const enrolledClubs = await getEnrolledClubs(tournamentId);
      const enrolledClubsWithPayment = enrolledClubs.filter(c => c.payment_status === 'success');
      
      if (enrolledClubsWithPayment.length > 0) {
        setShowCancelConfirm(null);
        alert(`Please remove and refund all enrolled clubs before cancelling the tournament. ${enrolledClubsWithPayment.length} club(s) still enrolled.`);
        return;
      }
      
      setCancellingId(tournamentId);
      await cancelTournament(tournamentId);
      setShowCancelConfirm(null);
      await loadTournaments();
      await loadTransactions();
      alert('Tournament cancelled successfully. The tournament creation fee has been refunded to your wallet.');
    } catch (error) {
      console.error('Failed to cancel tournament:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to cancel tournament. Please try again.';
      alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  // Calculate stats
  const totalTournaments = tournaments.length;
  const activeTournaments = tournaments.filter(t => t.status === 'tournament_start' || t.status === 'registration_open').length;

  // Get recent tournaments (limit to 3)
  const recentTournaments = tournaments.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      <Layout title="Dashboard" profilePath="/organizer/profile">
        {/* Main Content */}
        <main className="px-8 py-8">
          {/* Breadcrumb & Greeting */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>🏠</span>
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name || 'Demo'}!</h1>
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-gray-600 mt-2">Here's what's happening with your tournaments today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Total Tournaments */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Tournaments</p>
                  <p className="text-4xl font-bold text-gray-900">{totalTournaments}</p>
                  <p className="text-xs text-gray-600 mt-2">All time tournaments</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            {/* Active Tournaments */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">Active Tournaments</p>
                  <p className="text-4xl font-bold text-gray-900">{activeTournaments}</p>
                  <p className="text-xs text-green-600 mt-2">Currently running</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="text-green-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Get started with common tasks</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Featured Create Tournament Button */}
              <div 
                onClick={() => navigate('/organizer/create-tournament')}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Create Tournament</h3>
                    <p className="text-sm text-teal-50">Start a new tournament</p>
                  </div>
                </div>
              </div>

              {/* Manage Fixtures */}
              <div 
                onClick={() => navigate('/organizer/manage-fixtures')}
                className="bg-white rounded-lg p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Fixtures</h3>
                    <p className="text-sm text-gray-600">Schedule & organize matches</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* My Tournaments */}
              <div 
                onClick={() => navigate('/organizer/tournaments')}
                className="bg-white rounded-lg p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">My Tournaments</h3>
                    <p className="text-xs text-gray-600">View all tournaments</p>
                  </div>
                </div>
              </div>

              {/* Match Management */}
              <div 
                onClick={() => navigate('/organizer/manage-matches')}
                className="bg-white rounded-lg p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Manage Matches</h3>
                    <p className="text-xs text-gray-600">View tournaments & matches</p>
                  </div>
                </div>
              </div>

              {/* Tournament Enrollments */}
              <div 
                onClick={() => navigate('/organizer/tournament-enrollments')}
                className="bg-white rounded-lg p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Tournament Enrollments</h3>
                    <p className="text-xs text-gray-600">Manage club enrollments</p>
                  </div>
                </div>
              </div>

              {/* View Payments */}
              <div 
                onClick={() => navigate('/organizer/transactions')}
                className="bg-white rounded-lg p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">View Payments</h3>
                    <p className="text-xs text-gray-600">Track financial transactions</p>
                  </div>
                </div>
              </div>

              {/* Finance Report */}
              <div 
                onClick={() => navigate('/organizer/finance-report')}
                className="bg-white rounded-lg p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Finance Report</h3>
                    <p className="text-xs text-gray-600">Download detailed reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tournaments Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Tournaments</h2>
              <button 
                onClick={() => navigate('/organizer/tournaments')}
                className="text-sm font-semibold text-gray-900 flex items-center gap-1 hover:text-gray-600"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading tournaments...</p>
              </div>
            ) : recentTournaments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <Trophy size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tournaments yet</p>
                <p className="text-gray-400 text-sm">Create your first tournament to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTournaments.map((tournament) => {
                  const statusBadge = getStatusBadge(tournament);
                  const progress = calculateProgress(tournament);
                  const completedMatches = tournament.details?.completed_matches || 0;
                  const totalMatches = tournament.details?.total_matches || 0;
                  
                  return (
                    <div
                      key={tournament.id}
                      className="bg-white rounded-lg p-6 border border-gray-200 flex items-center justify-between hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Trophy className="text-white" size={32} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{tournament.tournament_name}</h3>
                          <p className="text-sm text-gray-600">
                            {tournament.details?.team_range || 'N/A'} clubs • {completedMatches}/{totalMatches} matches • ₹{tournament.payment?.amount ? parseFloat(tournament.payment.amount).toLocaleString('en-IN') : '0'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-2">Progress</p>
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${tournament.status === 'tournament_start' ? 'bg-green-500' : 'bg-blue-400'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 ${statusBadge.bg} ${statusBadge.textColor} rounded text-xs font-semibold whitespace-nowrap`}>
                          {statusBadge.text}
                        </div>
                        {canCancel(tournament) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCancelConfirm(tournament.id);
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Tournament"
                          >
                            <X size={20} />
                          </button>
                        ) : (
                          <ChevronRight className="text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Tournament</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this tournament? The tournament creation fee will be refunded to your account. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
                  disabled={cancellingId !== null}
                >
                  No, Keep Tournament
                </button>
                <button
                  onClick={() => handleCancelTournament(showCancelConfirm)}
                  disabled={cancellingId !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingId ? 'Cancelling...' : 'Yes, Cancel Tournament'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </div>
  )
}
