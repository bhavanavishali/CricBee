"use client"
import { useDispatch } from 'react-redux';
import { useState, useEffect } from "react"
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
import Layout from '@/components/layouts/Layout'
import { getMyTournaments, getMyTransactions } from '@/api/organizer/tournament'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role;
  const [tournaments, setTournaments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)

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

  const getStatusColor = (status) => {
    const statusMap = {
      'pending_payment': 'bg-yellow-500',
      'registration_open': 'bg-blue-500',
      'registration_end': 'bg-orange-500',
      'tournament_start': 'bg-red-500',
      'tournament_end': 'bg-gray-500',
      'cancelled': 'bg-red-600'
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      'pending_payment': 'Pending Payment',
      'registration_open': 'Registration Open',
      'registration_end': 'Registration Closed',
      'tournament_start': 'Tournament Live',
      'tournament_end': 'Tournament Completed',
      'cancelled': 'Cancelled'
    };
    return labelMap[status] || status;
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'pending_payment': '⏳',
      'registration_open': '📢',
      'registration_end': '✅',
      'tournament_start': '🔴',
      'tournament_end': '🏁',
      'cancelled': '✕'
    };
    return iconMap[status] || '🔵';
  };
  const getPaymentStatusStyles = (status) => {
    const styleMap = {
      'success': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-blue-100 text-blue-800'
    };
    return styleMap[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingTournaments = tournaments.filter(t => t.status === 'pending_payment').length;
  const activeTournaments = tournaments.filter(t => t.status === 'tournament_start').length;
  const upcomingTournaments = tournaments.filter(t => t.status === 'registration_open').length;
  const totalRevenue = tournaments.reduce((sum, t) => {
    if (t.payment?.payment_status === 'success' && t.payment?.amount) {
      return sum + parseFloat(t.payment.amount);
    }
    return sum;
  }, 0);
  const recentTransactions = transactions.slice(0, 5);

  const statCards = [
    {
      title: "Total Tournaments",
      value: tournaments.length.toString(),
      change: `${upcomingTournaments} upcoming`,
      changeColor: "text-green-600",
      icon: Trophy,
      bgColor: "bg-green-100",
      iconBg: "bg-green-200",
    },
    {
      title: "Live Tournaments",
      value: activeTournaments.toString(),
      change: "Currently running",
      changeColor: "text-blue-600",
      icon: Users,
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-200",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: "From all tournaments",
      changeColor: "text-orange-600",
      icon: DollarSign,
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-200",
    },
    {
      title: "Pending Payment",
      value: pendingTournaments.toString(),
      change: "Awaiting payment",
      changeColor: "text-yellow-600",
      icon: Zap,
      bgColor: "bg-yellow-100",
      iconBg: "bg-yellow-200",
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
      <Layout title="My Tournaments" profilePath="/organizer/profile">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb and Welcome */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <BarChart3 size={16} />
            <span>Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name || 'Organizer'}! 👋</h1>
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
              onClick={() => navigate('/organizer/create-tournament')}
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
              const handleClick = () => {
                if (action.title === "My Tournaments") {
                  navigate('/organizer/tournaments');
                } else {
                  // Handle other actions
                  console.log('Action clicked:', action.title);
                }
              };
              
              return (
                <div
                  key={index}
                  onClick={handleClick}
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
            <button 
              onClick={() => navigate('/organizer/tournaments')}
              className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700"
            >
              <span>View All</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments yet</h3>
              <p className="text-gray-600 mb-4">Create your first tournament to get started</p>
              <button
                onClick={() => navigate('/organizer/create-tournament')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Create Tournament
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate to tournament details page when implemented
                    console.log('Tournament clicked:', tournament.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-3 text-white">
                        <Trophy size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{tournament.tournament_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {tournament.details?.location && `📍 ${tournament.details.location}`}
                          {tournament.details?.team_range && ` • ${tournament.details.team_range}`}
                          {tournament.details?.overs && ` • ${tournament.details.overs} overs`}
                        </p>
                        {tournament.details?.start_date && (
                          <p className="text-xs text-gray-500">
                            Start: {new Date(tournament.details.start_date).toLocaleDateString()}
                            {tournament.details?.end_date && ` - End: ${new Date(tournament.details.end_date).toLocaleDateString()}`}
                          </p>
                        )}
                        {tournament.payment && (
                          <p className="text-xs text-gray-500 mt-1">
                            Amount: ₹{parseFloat(tournament.payment.amount).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span
                          className={`${getStatusColor(tournament.status)} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                        >
                          {getStatusIcon(tournament.status)} {getStatusLabel(tournament.status)}
                        </span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-600">Track payments for your tournaments</p>
            </div>
            <button
              onClick={loadTransactions}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            {transactionsLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <DollarSign size={36} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((transaction, index) => (
                      <tr key={`${transaction.transaction_id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                          {transaction.transaction_id || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{transaction.tournament_name}</p>
                          <p className="text-xs text-gray-500">#{transaction.tournament_id}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusStyles(transaction.payment_status)}`}>
                            {transaction.payment_status?.replace('_', ' ') || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(transaction.payment_date || transaction.created_at).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
       </Layout>
    </div>
  )
}