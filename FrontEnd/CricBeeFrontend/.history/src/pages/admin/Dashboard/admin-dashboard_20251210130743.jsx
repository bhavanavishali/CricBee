// "use client"
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Users,
//   Trophy,
//   DollarSign,
//   AlertCircle,
//   UserCheck,
//   Briefcase,
//   BarChart3,
//   Bell,
//   Settings,
//   Calendar,
//   ChevronRight,
//   CheckCircle,
//   Star,
//   Gift,
//   Activity,
//   Clock,
//   ArrowRight
// } from 'lucide-react';
// import Layout from '@/components/layouts/Layout';
// import { getUsers } from '@/api/adminService';
// import { getTransactions, getWalletBalance } from '@/api/adminService';

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const user = useSelector((state) => state.auth.user);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     activeTournaments: 0,
//     monthlyRevenue: 0,
//     pendingApprovals: 0
//   });

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       // Load users
//       const usersResponse = await getUsers();
//       if (usersResponse.success) {
//         const totalUsers = usersResponse.data?.length || 0;
//         const pendingApprovals = usersResponse.data?.filter(u => !u.is_active)?.length || 0;
//         setStats(prev => ({
//           ...prev,
//           totalUsers,
//           pendingApprovals
//         }));
//       }

//       // Load wallet balance for revenue
//       const walletResponse = await getWalletBalance();
//       if (walletResponse.success && walletResponse.data) {
//         setStats(prev => ({
//           ...prev,
//           monthlyRevenue: parseFloat(walletResponse.data.balance || 0)
//         }));
//       }
//     } catch (error) {
//       console.error('Failed to load dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const statCards = [
//     {
//       title: "Total Users",
//       value: loading ? "..." : stats.totalUsers.toLocaleString('en-IN'),
//       change: "+12 this month",
//       changeColor: "text-green-600",
//       icon: Users,
//       bgColor: "bg-green-100",
//       iconBg: "bg-green-200",
//     },
//     {
//       title: "Active Tournaments",
//       value: loading ? "..." : "23",
//       change: "8 live now",
//       changeColor: "text-blue-600",
//       icon: Trophy,
//       bgColor: "bg-blue-100",
//       iconBg: "bg-blue-200",
//     },
//     {
//       title: "Monthly Revenue",
//       value: loading ? "..." : `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`,
//       change: "From all transactions",
//       changeColor: "text-orange-600",
//       icon: DollarSign,
//       bgColor: "bg-orange-100",
//       iconBg: "bg-orange-200",
//     },
//     {
//       title: "Pending Approvals",
//       value: loading ? "..." : stats.pendingApprovals.toString(),
//       change: "Awaiting review",
//       changeColor: "text-yellow-600",
//       icon: AlertCircle,
//       bgColor: "bg-yellow-100",
//       iconBg: "bg-yellow-200",
//     },
//   ];

//   const quickActions = [
//     {
//       icon: UserCheck,
//       title: "User Management",
//       description: "Manage users and roles",
//       bgColor: "from-teal-500 to-orange-500",
//       isPrimary: true,
//       route: "/admin/usermanagement"
//     },
//     {
//       icon: Briefcase,
//       title: "Plans & Pricing",
//       description: "Configure tournament plans",
//       bgColor: "bg-gray-200",
//       route: "/admin/plans"
//     },
//     {
//       icon: Trophy,
//       title: "Tournament Oversight",
//       description: "Monitor tournaments",
//       bgColor: "bg-gray-100",
//       route: "/admin/tournaments"
//     },
//     {
//       icon: DollarSign,
//       title: "Payments",
//       description: "Transaction history",
//       bgColor: "bg-gray-100",
//       route: "/admin/transaction"
//     },
//     {
//       icon: Bell,
//       title: "Notifications",
//       description: "Manage notifications",
//       bgColor: "bg-gray-100",
//       route: "/admin/content"
//     },
//     {
//       icon: Settings,
//       title: "Settings",
//       description: "Platform settings",
//       bgColor: "bg-gray-100",
//       route: "/admin/settings"
//     },
//   ];

//   const recentActivities = [
//     {
//       icon: Users,
//       iconColor: "text-green-600",
//       text: "New organizer registration: Mumbai Cricket Association",
//       time: "2 hours ago",
//       status: "Live",
//       statusColor: "bg-red-100 text-red-700"
//     },
//     {
//       icon: DollarSign,
//       iconColor: "text-green-600",
//       text: "Payment processed: Corporate Cricket Championship • ₹25,000",
//       time: "1 day ago",
//       status: "✔ Paid",
//       statusColor: "bg-green-100 text-green-700"
//     },
//     {
//       icon: Users,
//       iconColor: "text-blue-600",
//       text: "User status updated: Added 2 new organizers",
//       time: "2 days ago",
//       status: "✓ Completed",
//       statusColor: "bg-purple-100 text-purple-700"
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Layout title="Admin Dashboard" profilePath="/admin/profile">
//         {/* Main Content */}
//         <main className="max-w-7xl mx-auto px-6 py-8">
//           {/* Breadcrumb and Welcome */}
//           <div className="mb-8">
//             <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
//               <BarChart3 size={16} />
//               <span>Dashboard</span>
//             </div>
//             <h1 className="text-4xl font-bold text-gray-900 mb-2">
//               Welcome back, {user?.full_name || 'Admin'}! 👋
//             </h1>
//             <p className="text-gray-600">Manage your platform and monitor activities from here.</p>
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//             {statCards.map((card, index) => {
//               const Icon = card.icon;
//               return (
//                 <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
//                   <div className="flex items-start justify-between mb-4">
//                     <div>
//                       <p className="text-sm text-gray-600 mb-1">{card.title}</p>
//                       <p className="text-3xl font-bold text-gray-900">{card.value}</p>
//                       <p className={`text-sm ${card.changeColor} mt-1`}>{card.change}</p>
//                     </div>
//                     <div className={`${card.iconBg} p-3 rounded-lg`}>
//                       <Icon size={24} className="text-gray-700" />
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Quick Actions */}
//           <div className="mb-8">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
//               <p className="text-sm text-gray-600">Manage your platform activities</p>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               {/* Primary User Management Button */}
//               <div
//                 onClick={() => navigate('/admin/usermanagement')}
//                 className={`lg:col-span-1 bg-gradient-to-r from-teal-500 to-orange-500 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <div className="bg-white/20 p-3 rounded-lg">
//                     <UserCheck size={24} />
//                   </div>
//                   <div>
//                     <p className="font-bold text-lg">User Management</p>
//                     <p className="text-sm text-white/90">Manage users and roles</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Other Quick Actions */}
//               {quickActions.slice(1).map((action, index) => {
//                 const Icon = action.icon;
//                 return (
//                   <div
//                     key={index}
//                     onClick={() => navigate(action.route)}
//                     className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
//                   >
//                     <div className="flex items-start space-x-4">
//                       <div className="bg-gray-100 p-3 rounded-lg">
//                         <Icon size={24} className="text-gray-600" />
//                       </div>
//                       <div className="flex-1">
//                         <p className="font-semibold text-gray-900">{action.title}</p>
//                         <p className="text-sm text-gray-600">{action.description}</p>
//                       </div>
//                       <ChevronRight size={20} className="text-gray-400" />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Recent Activities */}
//           <div className="mb-8">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
//               <button
//                 onClick={() => navigate('/admin/transactions')}
//                 className="text-blue-600 font-semibold flex items-center space-x-1 hover:text-blue-700"
//               >
//                 <span>Latest updates</span>
//                 <ChevronRight size={18} />
//               </button>
//             </div>

//             <div className="bg-white rounded-lg border border-gray-200 p-6">
//               <div className="space-y-4">
//                 {recentActivities.map((activity, index) => {
//                   const Icon = activity.icon;
//                   return (
//                     <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
//                       <div className={`${activity.iconColor} p-2 rounded-lg bg-gray-50`}>
//                         <Icon size={20} />
//                       </div>
//                       <div className="flex-1">
//                         <p className="text-sm text-gray-900 mb-1">{activity.text}</p>
//                         <div className="flex items-center justify-between">
//                           <span className="text-xs text-gray-500">{activity.time}</span>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.statusColor}`}>
//                             {activity.status}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Platform Performance Summary */}
//           <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="bg-green-100 p-3 rounded-lg">
//                 <Star className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="font-semibold text-green-900">
//                   Excellent Performance! Your platform has processed 98% of transactions successfully.
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-3">
//               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
//                 ✔ Verified Platform
//               </span>
//               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
//                 ★4.9 Rating
//               </span>
//             </div>
//           </div>
//         </main>
//       </Layout>
//     </div>
//   );
// }
/from '@/components/layouts/Layout';
import { getUsers } from '@/api/adminService';
import { getTransactions, getWalletBalance } from '@/api/adminService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTournaments: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load users
      const usersResponse = await getUsers();
      if (usersResponse.success) {
        const totalUsers = usersResponse.data?.length || 0;
        const pendingApprovals = usersResponse.data?.filter(u => !u.is_active)?.length || 0;
        setStats(prev => ({
          ...prev,
          totalUsers,
          pendingApprovals
        }));
      }

      // Load wallet balance for revenue
      const walletResponse = await getWalletBalance();
      if (walletResponse.success && walletResponse.data) {
        setStats(prev => ({
          ...prev,
          monthlyRevenue: parseFloat(walletResponse.data.balance || 0)
        }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: "👁",
      title: "Review Pending Users",
      description: "12 users waiting for approval",
      route: "/admin/usermanagement"
    },
    {
      icon: "🏆",
      title: "Tournament Approvals",
      description: "5 tournaments need approval",
      route: "/admin/tournaments"
    },
    {
      icon: "📊",
      title: "Financial Reports",
      description: "View revenue and payment analytics",
      route: "/admin/transaction"
    },
    {
      icon: "🔔",
      title: "Send Notification",
      description: "Broadcast to all platform users",
      route: "/admin/content"
    },
    {
      icon: "⚙",
      title: "Platform Settings",
      description: "Configure global system settings",
      route: "/admin/settings"
    },
  ];

  const recentActivities = [
    {
      icon: Users,
      iconColor: "bg-blue-600",
      text: "New organizer registration: Mumbai Cricket Association",
      time: "5 minutes ago",
      status: "pending",
      statusColor: "bg-yellow-500/20 text-yellow-400"
    },
    {
      icon: Trophy,
      iconColor: "bg-purple-600",
      text: "Tournament created: Delhi Corporate League 2024",
      time: "12 minutes ago",
      status: "needs approval",
      statusColor: "bg-orange-500/20 text-orange-400"
    },
    {
      icon: DollarSign,
      iconColor: "bg-green-600",
      text: "Payment processed: ₹15,000 tournament entry fee",
      time: "23 minutes ago",
      status: "completed",
      statusColor: "bg-green-500/20 text-green-400"
    },
    {
      icon: AlertCircle,
      iconColor: "bg-red-600",
      text: "User suspended for policy violation: fake_organizer@test.com",
      time: "1 hour ago",
      status: "action taken",
      statusColor: "bg-blue-500/20 text-blue-400"
    },
    {
      icon: Trophy,
      iconColor: "bg-pink-600",
      text: "Fan gift processed: ₹500 to Chennai Super Kings",
      time: "2 hours ago",
      status: "completed",
      statusColor: "bg-green-500/20 text-green-400"
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f172a" }}>
      <Layout title="Admin Dashboard" profilePath="/admin/profile">
        {/* Breadcrumb and Welcome - Adapted to new dark theme */}
        <div className="border-b" style={{ borderColor: "#1e293b", backgroundColor: "#0f172a" }}>
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <span>🏠</span>
              <span>Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user?.full_name || 'Admin'}! 👋
            </h1>
            <p className="text-gray-400">Manage your platform and monitor activities from here.</p>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            {/* Total Users */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">TOTAL USERS</div>
                <div className="text-4xl font-bold text-gray-900">{loading ? "..." : stats.totalUsers.toLocaleString('en-IN')}</div>
              </div>
              <Users size={40} className="text-blue-500" />
            </div>

            {/* Active Tournaments */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fce7f3" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">ACTIVE TOURNAMENTS</div>
                <div className="text-4xl font-bold text-gray-900">{loading ? "..." : "23"}</div>
              </div>
              <Trophy size={40} className="text-pink-500" />
            </div>

            {/* Monthly Revenue */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#dcfce7" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">MONTHLY REVENUE</div>
                <div className="text-4xl font-bold text-gray-900">₹{loading ? "..." : stats.monthlyRevenue.toLocaleString('en-IN')}</div>
              </div>
              <DollarSign size={40} className="text-green-500" />
            </div>

            {/* Pending Approvals */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fef3c7" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">PENDING APPROVALS</div>
                <div className="text-4xl font-bold text-gray-900">{loading ? "..." : stats.pendingApprovals}</div>
              </div>
              <AlertCircle size={40} className="text-yellow-500" />
            </div>

            {/* Live Matches */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fed7aa" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">LIVE MATCHES</div>
                <div className="text-4xl font-bold text-gray-900">8</div>
              </div>
              <TrendingUp size={40} className="text-orange-500" />
            </div>

            {/* Recent Activities */}
            <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#f5f3ff" }}>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">RECENT ACTIVITIES</div>
                <div className="text-4xl font-bold text-gray-900">47</div>
              </div>
              <Clock size={40} className="text-purple-500" />
            </div>
          </div>

          {/* Admin Modules - Grid layout, navigations preserved */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Modules</h2>
              <p className="text-sm text-gray-400">Manage your platform activities</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User & Role Management */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #3b82f6" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Manage users and roles. Approve registrations and handle violations.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Pending</div>
                    <div className="font-bold text-white">{loading ? "..." : stats.pendingApprovals}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Suspended</div>
                    <div className="font-bold text-white">3</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Total</div>
                    <div className="font-bold text-white">{loading ? "..." : stats.totalUsers.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/usermanagement')}
                  className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Users size={16} />
                  Manage Users
                </button>
              </div>

              {/* Plans & Pricing */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #10b981" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Plans & Pricing</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Configure tournament plans, features, and pricing. Track subscription metrics.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Active Plans</div>
                    <div className="font-bold text-white">3</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Subscribers</div>
                    <div className="font-bold text-white">234</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Revenue</div>
                    <div className="font-bold text-white">₹{loading ? "..." : stats.monthlyRevenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/plans')}
                  className="w-full py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <DollarSign size={16} />
                  Manage Plans
                </button>
              </div>

              {/* Tournament Oversight */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #a855f7" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tournament Oversight</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Monitor and approve tournaments. Intervene in disputes and flag suspicious activities.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Active</div>
                    <div className="font-bold text-white">{loading ? "..." : "23"}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Pending Approval</div>
                    <div className="font-bold text-white">5</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Flagged</div>
                    <div className="font-bold text-white">2</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/tournaments')}
                  className="w-full py-2 px-3 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Trophy size={16} />
                  Manage Tournaments
                </button>
              </div>

              {/* Financial Control */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #f97316" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Payments</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Manage payments, settlements, and revenue reports. Monitor all transactions.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Monthly Revenue</div>
                    <div className="font-bold text-white">₹{loading ? "..." : stats.monthlyRevenue.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Pending Settlements</div>
                    <div className="font-bold text-white">12</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Gift Volume</div>
                    <div className="font-bold text-white">₹45K</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/transaction')}
                  className="w-full py-2 px-3 rounded bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <BarChart3 size={16} />
                  Manage Payments
                </button>
              </div>

              {/* Content & Notifications */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #ec4899" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-600 flex items-center justify-center">
                    <Megaphone size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Notifications</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Manage banners, promotions, news updates, and push notifications.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Active Banners</div>
                    <div className="font-bold text-white">4</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Scheduled Notifications</div>
                    <div className="font-bold text-white">7</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Featured Tournaments</div>
                    <div className="font-bold text-white">3</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/content')}
                  className="w-full py-2 px-3 rounded bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell size={16} />
                  Manage Notifications
                </button>
              </div>

              {/* Platform Settings */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #6b7280" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                    <Cog size={24} className="text-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Configure global settings, KYC policies, audit logs, and system configurations.
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Configurations</div>
                    <div className="font-bold text-white">15</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Policies</div>
                    <div className="font-bold text-white">8</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Audit Logs</div>
                    <div className="font-bold text-white">2.3K</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="w-full py-2 px-3 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Cog size={16} />
                  Manage Settings
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activities & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Platform Activities */}
            <div className="lg:col-span-2 p-6 rounded-lg" style={{ backgroundColor: "#1e293b" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock size={20} />
                  Recent Activity
                </h3>
                <button
                  onClick={() => navigate('/admin/transactions')}
                  className="text-blue-400 font-semibold flex items-center space-x-1 hover:text-blue-300 transition-colors"
                >
                  <span>Latest updates</span>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: "#334155" }}>
                      <div className={`w-8 h-8 rounded-full ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-1">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${activity.statusColor}`}>
                        {activity.status}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => navigate('/admin/transactions')}
                className="w-full mt-4 py-2 text-center text-gray-400 hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                👁 View All Activities
              </button>
            </div>

            {/* Quick Actions - Vertically aligned, with preserved routes */}
            <div className="p-6 rounded-lg space-y-3" style={{ backgroundColor: "#1e293b" }}>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.route)}
                  className="w-full p-3 rounded-lg text-white text-sm font-medium text-left flex items-start gap-3 transition-colors cursor-pointer hover:shadow-lg"
                  style={{ backgroundColor: index === 0 ? "#0d9488" : "#334155" }}
                >
                  <div className={`w-6 h-6 rounded ${index === 0 ? "bg-teal-700" : "bg-gray-700"} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="text-white text-sm">{action.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-xs text-gray-400">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Health & Performance - Adapted from current summary */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 size={20} />
              Platform Health & Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-400 mb-2">98.7%</p>
                <p className="text-gray-400 text-sm">System Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-400 mb-2">2.3s</p>
                <p className="text-gray-400 text-sm">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-400 mb-2">{loading ? "..." : stats.totalUsers}</p>
                <p className="text-gray-400 text-sm">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-400 mb-2">99.1%</p>
                <p className="text-gray-400 text-sm">Payment Success Rate</p>
              </div>
            </div>
            <div className="mt-6 bg-green-900/20 border border-green-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-800/50 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-300">
                    Excellent Performance! Your platform has processed 98% of transactions successfully.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-green-800/50 text-green-300 rounded-full text-xs font-semibold">
                  ✔ Verified Platform
                </span>
                <span className="px-3 py-1 bg-green-800/50 text-green-300 rounded-full text-xs font-semibold">
                  ★4.9 Rating
                </span>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </div>
  );
}