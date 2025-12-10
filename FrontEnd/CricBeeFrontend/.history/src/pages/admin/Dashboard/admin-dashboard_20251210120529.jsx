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


