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
"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Users, Trophy, DollarSign, BarChart3, Megaphone, Cog } from "lucide-react";
import Layout from "@/components/layouts/Layout";
import { getUsers, getWalletBalance } from "@/api/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, monthlyRevenue: 0, pendingApprovals: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const usersResponse = await getUsers();
      if (usersResponse.success) {
        const totalUsers = usersResponse.data?.length || 0;
        const pendingApprovals = usersResponse.data?.filter((u) => !u.is_active)?.length || 0;
        setStats((prev) => ({ ...prev, totalUsers, pendingApprovals }));
      }
      const walletResponse = await getWalletBalance();
      if (walletResponse.success && walletResponse.data) {
        setStats((prev) => ({ ...prev, monthlyRevenue: parseFloat(walletResponse.data.balance || 0) }));
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: "User & Role Management",
      desc: "Manage organizations, clubs, players, and fans. Approve registrations and handle violations.",
      icon: Users,
      accent: "#2d64ff",
      iconBg: "bg-blue-600",
      stats: [
        { label: "Pending", value: loading ? "..." : stats.pendingApprovals || 8 },
        { label: "Suspended", value: 3 },
        { label: "Total", value: loading ? "..." : stats.totalUsers || 15847 },
      ],
      action: { label: "Manage User", route: "/admin/usermanagement", color: "bg-blue-600 hover:bg-blue-700" },
    },
    {
      title: "Plans & Pricing",
      desc: "Configure tournament plans, features, and pricing. Track subscription metrics.",
      icon: DollarSign,
      accent: "#10b981",
      iconBg: "bg-green-600",
      stats: [
        { label: "Active Plans", value: 3 },
        { label: "Subscribers", value: 234 },
        { label: "Revenue", value: `₹${loading ? "..." : (stats.monthlyRevenue / 100000).toFixed(1)}L` },
      ],
      action: { label: "Manage Plans", route: "/admin/plans", color: "bg-green-600 hover:bg-green-700" },
    },
    {
      title: "Tournament Oversight",
      desc: "Monitor and approve tournaments. Interview in disputes and flag suspicious activities.",
      icon: Trophy,
      accent: "#a855f7",
      iconBg: "bg-purple-600",
      stats: [
        { label: "Active", value: 23 },
        { label: "Pending Approval", value: 5 },
        { label: "Flagged", value: 2 },
      ],
      action: { label: "Manage Tournament", route: "/admin/tournaments", color: "bg-purple-600 hover:bg-purple-700" },
    },
    {
      title: "Financial Control",
      desc: "Manage payments, settlements, and revenue reports. Monitor gifting transactions.",
      icon: BarChart3,
      accent: "#f97316",
      iconBg: "bg-orange-600",
      stats: [
        { label: "Monthly Revenue", value: `₹${loading ? "..." : (stats.monthlyRevenue / 100000).toFixed(1)}L` },
        { label: "Pending Settlements", value: 12 },
        { label: "Gift Volume", value: "₹45K" },
      ],
      action: { label: "Manage Financial", route: "/admin/transaction", color: "bg-orange-600 hover:bg-orange-700" },
    },
    {
      title: "Content & Notifications",
      desc: "Manage banners, promotions, news updates, and push notifications.",
      icon: Megaphone,
      accent: "#ec4899",
      iconBg: "bg-pink-600",
      stats: [
        { label: "Active Banners", value: 4 },
        { label: "Scheduled Notifications", value: 7 },
        { label: "Featured Tournaments", value: 3 },
      ],
      action: { label: "Manage Content", route: "/admin/content", color: "bg-pink-600 hover:bg-pink-700" },
    },
    {
      title: "Platform Settings",
      desc: "Configure global settings, KYC policies, audit logs, and system configurations.",
      icon: Cog,
      accent: "#6b7280",
      iconBg: "bg-gray-600",
      stats: [
        { label: "Configurations", value: 15 },
        { label: "Policies", value: 8 },
        { label: "Audit Logs", value: "2.3K" },
      ],
      action: { label: "Manage Platform", route: "/admin/settings", color: "bg-gray-600 hover:bg-gray-700" },
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b1224] text-slate-100">
      <Layout title="Admin Dashboard" profilePath="/admin/profile">
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Admin Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.title}
                    className="relative rounded-xl p-6 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                    style={{ backgroundColor: "#10192f" }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: module.accent }} />
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-green-400" />

                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.iconBg}`}>
                        <Icon size={26} className="text-white" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">{module.desc}</p>

                    <div className="flex gap-6 mb-6 text-sm">
                      {module.stats.map((stat) => (
                        <div key={stat.label}>
                          <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                          <div className="text-base font-bold text-white mt-1">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate(module.action.route)}
                      className={`w-full py-3 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${module.action.color}`}
                    >
                      <Icon size={16} className="text-white" />
                      {module.action.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </Layout>
    </div>
  );
}