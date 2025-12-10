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
