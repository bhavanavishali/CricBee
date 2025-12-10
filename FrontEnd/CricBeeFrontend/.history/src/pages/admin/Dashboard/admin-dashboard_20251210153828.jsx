// "use client";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { Users, Trophy, DollarSign, BarChart3, Megaphone, Cog } from "lucide-react";
// import Layout from "@/components/layouts/Layout";
// import { getUsers, getWalletBalance } from "@/api/adminService";

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const user = useSelector((state) => state.auth.user);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({ totalUsers: 0, monthlyRevenue: 0, pendingApprovals: 0 });

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       const usersResponse = await getUsers();
//       if (usersResponse.success) {
//         const totalUsers = usersResponse.data?.length || 0;
//         const pendingApprovals = usersResponse.data?.filter((u) => !u.is_active)?.length || 0;
//         setStats((prev) => ({ ...prev, totalUsers, pendingApprovals }));
//       }
//       const walletResponse = await getWalletBalance();
//       if (walletResponse.success && walletResponse.data) {
//         setStats((prev) => ({ ...prev, monthlyRevenue: parseFloat(walletResponse.data.balance || 0) }));
//       }
//     } catch (err) {
//       console.error("Failed to load dashboard data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const modules = [
//     {
//       title: "User & Role Management",
//       desc: "Manage organizations, clubs, players, and fans. Approve registrations and handle violations.",
//       icon: Users,
//       accent: "#2d64ff",
//       iconBg: "bg-blue-600",
//       stats: [
//         { label: "Pending", value: loading ? "..." : stats.pendingApprovals || 8 },
//         { label: "Suspended", value: 3 },
//         { label: "Total", value: loading ? "..." : stats.totalUsers || 15847 },
//       ],
//       action: { label: "Manage User", route: "/admin/usermanagement", color: "bg-blue-600 hover:bg-blue-700" },
//     },
//     {
//       title: "Plans & Pricing",
//       desc: "Configure tournament plans, features, and pricing. Track subscription metrics.",
//       icon: DollarSign,
//       accent: "#10b981",
//       iconBg: "bg-green-600",
//       stats: [
//         { label: "Active Plans", value: 3 },
//         { label: "Subscribers", value: 234 },
//         { label: "Revenue", value: `?${loading ? "..." : (stats.monthlyRevenue / 100000).toFixed(1)}L` },
//       ],
//       action: { label: "Manage Plans", route: "/admin/plans", color: "bg-green-600 hover:bg-green-700" },
//     },
//     {
//       title: "Tournament Oversight",
//       desc: "Monitor and approve tournaments. Interview in disputes and flag suspicious activities.",
//       icon: Trophy,
//       accent: "#a855f7",
//       iconBg: "bg-purple-600",
//       stats: [
//         { label: "Active", value: 23 },
//         { label: "Pending Approval", value: 5 },
//         { label: "Flagged", value: 2 },
//       ],
//       action: { label: "Manage Tournament", route: "/admin/tournaments", color: "bg-purple-600 hover:bg-purple-700" },
//     },
//     {
//       title: "Financial Control",
//       desc: "Manage payments, settlements, and revenue reports. Monitor gifting transactions.",
//       icon: BarChart3,
//       accent: "#f97316",
//       iconBg: "bg-orange-600",
//       stats: [
//         { label: "Monthly Revenue", value: `?${loading ? "..." : (stats.monthlyRevenue / 100000).toFixed(1)}L` },
//         { label: "Pending Settlements", value: 12 },
//         { label: "Gift Volume", value: "?45K" },
//       ],
//       action: { label: "Manage Financial", route: "/admin/transaction", color: "bg-orange-600 hover:bg-orange-700" },
//     },
//     {
//       title: "Content & Notifications",
//       desc: "Manage banners, promotions, news updates, and push notifications.",
//       icon: Megaphone,
//       accent: "#ec4899",
//       iconBg: "bg-pink-600",
//       stats: [
//         { label: "Active Banners", value: 4 },
//         { label: "Scheduled Notifications", value: 7 },
//         { label: "Featured Tournaments", value: 3 },
//       ],
//       action: { label: "Manage Content", route: "/admin/content", color: "bg-pink-600 hover:bg-pink-700" },
//     },
//     {
//       title: "Platform Settings",
//       desc: "Configure global settings, KYC policies, audit logs, and system configurations.",
//       icon: Cog,
//       accent: "#6b7280",
//       iconBg: "bg-gray-600",
//       stats: [
//         { label: "Configurations", value: 15 },
//         { label: "Policies", value: 8 },
//         { label: "Audit Logs", value: "2.3K" },
//       ],
//       action: { label: "Manage Platform", route: "/admin/settings", color: "bg-gray-600 hover:bg-gray-700" },
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-[#0b1224] text-slate-100">
//       <Layout title="Admin Dashboard" profilePath="/admin/profile">
//         <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
//           <div className="space-y-4">
//             <h2 className="text-2xl font-bold text-white">Admin Modules</h2>
//             <div className="grid grid-cols-1 gap-6">
//               {modules.map((module) => {
//                 const Icon = module.icon;
//                 return (
//                   <div
//                     key={module.title}
//                     className="relative rounded-xl p-6 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
//                     style={{ backgroundColor: "#10192f" }}
//                   >
//                     <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: module.accent }} />
//                     <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-green-400" />

//                     <div className="flex items-start gap-3 mb-4">
//                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.iconBg}`}>
//                         <Icon size={26} className="text-white" />
//                       </div>
//                     </div>

//                     <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
//                     <p className="text-sm text-slate-300 mb-6 leading-relaxed">{module.desc}</p>

//                     <div className="flex gap-6 mb-6 text-sm">
//                       {module.stats.map((stat) => (
//                         <div key={stat.label}>
//                           <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
//                           <div className="text-base font-bold text-white mt-1">{stat.value}</div>
//                         </div>
//                       ))}
//                     </div>

//                     <button
//                       onClick={() => navigate(module.action.route)}
//                       className={`w-full py-3 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${module.action.color}`}
//                     >
//                       <Icon size={16} className="text-white" />
//                       {module.action.label}
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </main>
//       </Layout>
//     </div>
//   );
// }



"use client"
import {
  Users,
  Trophy,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  Settings,
  BarChart3,
  Bell,
  Megaphone,
  Cog,
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "#1e293b", backgroundColor: "#0f172a" }}>
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏏</span>
            </div>
            <h1 className="text-lg font-semibold text-white">Cricket</h1>
          </div>
          <h2 className="text-gray-300">Admin Control Center</h2>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">
              <Bell size={20} />
            </button>
            <button className="text-gray-400 hover:text-white">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: "#1e293b", backgroundColor: "#0f172a" }}>
        <div className="p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>🏠</span>
            <span>Admin Dashboard</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          {/* Total Users */}
          <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">TOTAL USERS</div>
              <div className="text-4xl font-bold text-gray-900">15,847</div>
            </div>
            <Users size={40} className="text-blue-500" />
          </div>

          {/* Active Tournaments */}
          <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fce7f3" }}>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">ACTIVE TOURNAMENTS</div>
              <div className="text-4xl font-bold text-gray-900">23</div>
            </div>
            <Trophy size={40} className="text-pink-500" />
          </div>

          {/* Monthly Revenue */}
          <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#dcfce7" }}>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">MONTHLY REVENUE</div>
              <div className="text-4xl font-bold text-gray-900">₹285K</div>
            </div>
            <DollarSign size={40} className="text-green-500" />
          </div>

          {/* Pending Approvals */}
          <div className="p-6 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#fef3c7" }}>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">PENDING APPROVALS</div>
              <div className="text-4xl font-bold text-gray-900">12</div>
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

        {/* Admin Modules */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Admin Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User & Role Management */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #3b82f6" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">User & Role Management</h3>
              <p className="text-sm text-gray-400 mb-4">
                Manage organizations, clubs, players, and fans. Approve registrations and handle violations.
              </p>
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Pending</div>
                  <div className="font-bold text-white">8</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Suspended</div>
                  <div className="font-bold text-white">3</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Total</div>
                  <div className="font-bold text-white">15847</div>
                </div>
              </div>
              <button className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2">
                <Users size={16} />
                Manage User
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
                  <div className="font-bold text-white">₹2.8L</div>
                </div>
              </div>
              <button className="w-full py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium flex items-center justify-center gap-2">
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
                Monitor and approve tournaments. Interview in disputes and flag suspicious activities.
              </p>
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Active</div>
                  <div className="font-bold text-white">23</div>
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
              <button className="w-full py-2 px-3 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2">
                <Trophy size={16} />
                Manage Tournament
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
              <h3 className="text-lg font-semibold text-white mb-2">Financial Control</h3>
              <p className="text-sm text-gray-400 mb-4">
                Manage payments, settlements, and revenue reports. Monitor for gifting transactions.
              </p>
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Monthly Revenue</div>
                  <div className="font-bold text-white">₹2.8L</div>
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
              <button className="w-full py-2 px-3 rounded bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                Manage Financial
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
              <h3 className="text-lg font-semibold text-white mb-2">Content & Notifications</h3>
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
              <button className="w-full py-2 px-3 rounded bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium flex items-center justify-center gap-2">
                <Bell size={16} />
                Manage Content
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
              <h3 className="text-lg font-semibold text-white mb-2">Platform Settings</h3>
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
              <button className="w-full py-2 px-3 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium flex items-center justify-center gap-2">
                <Cog size={16} />
                Manage Platform
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Platform Activities */}
          <div className="lg:col-span-2 p-6 rounded-lg" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} />
              Recent Platform Activities
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 pb-4 border-b" style={{ borderColor: "#0f172a" }}>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">New organizer registration: Mumbai Cricket Association</p>
                  <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded">pending</span>
              </div>

              <div className="flex gap-4 pb-4 border-b" style={{ borderColor: "#0f172a" }}>
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Trophy size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">Tournament created: Delhi Corporate League 2024</p>
                  <p className="text-xs text-gray-500 mt-1">12 minutes ago</p>
                </div>
                <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">needs approval</span>
              </div>

              <div className="flex gap-4 pb-4 border-b" style={{ borderColor: "#0f172a" }}>
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">Payment processed: ₹15,000 tournament entry fee</p>
                  <p className="text-xs text-gray-500 mt-1">23 minutes ago</p>
                </div>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">completed</span>
              </div>

              <div className="flex gap-4 pb-4 border-b" style={{ borderColor: "#0f172a" }}>
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">User suspended for policy violation: fake_organizer@test.com</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">action taken</span>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center flex-shrink-0">
                  <Trophy size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">Fan gift processed: ₹500 to Chennai Super Kings</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">completed</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-center text-gray-400 hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-2">
              👁 View All Activities
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full p-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium text-left flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  👁
                </div>
                <div>
                  <p className="font-semibold">Review Pending Users</p>
                  <p className="text-xs opacity-90">12 users waiting for approval</p>
                </div>
              </button>

              <button
                className="w-full p-3 rounded-lg text-white text-sm font-medium text-left flex items-start gap-3"
                style={{ backgroundColor: "#334155" }}
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  🏆
                </div>
                <div>
                  <p className="font-semibold">Tournament Approvals</p>
                  <p className="text-xs text-gray-400">5 tournaments need approval</p>
                </div>
              </button>

              <button
                className="w-full p-3 rounded-lg text-white text-sm font-medium text-left flex items-start gap-3"
                style={{ backgroundColor: "#334155" }}
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  📊
                </div>
                <div>
                  <p className="font-semibold">Financial Reports</p>
                  <p className="text-xs text-gray-400">View revenue and payment analytics</p>
                </div>
              </button>

              <button
                className="w-full p-3 rounded-lg text-white text-sm font-medium text-left flex items-start gap-3"
                style={{ backgroundColor: "#334155" }}
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  🔔
                </div>
                <div>
                  <p className="font-semibold">Send Notification</p>
                  <p className="text-xs text-gray-400">Broadcast to all platform users</p>
                </div>
              </button>

              <button
                className="w-full p-3 rounded-lg text-white text-sm font-medium text-left flex items-start gap-3"
                style={{ backgroundColor: "#334155" }}
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ⚙
                </div>
                <div>
                  <p className="font-semibold">Platform Settings</p>
                  <p className="text-xs text-gray-400">Configure global system settings</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Platform Health & Performance */}
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
              <p className="text-4xl font-bold text-purple-400 mb-2">1.2K</p>
              <p className="text-gray-400 text-sm">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-400 mb-2">99.1%</p>
              <p className="text-gray-400 text-sm">Payment Success Rate</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}