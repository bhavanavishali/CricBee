

// import { Users, Trophy, DollarSign, AlertCircle, Activity, Clock, UserCheck, Briefcase, Bell, Settings } from 'lucide-react'
// import { useNavigate } from 'react-router-dom'

// const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
//   <div className={`${bgColor} rounded-lg p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
//     <div className={`${color} p-3 rounded-lg`}>
//       <Icon className="w-6 h-6 text-white" />
//     </div>
//     <div>
//       <p className="text-sm font-medium text-gray-600">{label}</p>
//       <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
//   </div>
// )

// const ModuleCard = ({ icon: Icon, title, description, stats, buttonText, color, navigate }) => (
//   <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
//     <div className="flex items-center gap-3 mb-4">
//       <div className={`${color} p-3 rounded-lg`}>
//         <Icon className="w-5 h-5 text-white" />
//       </div>
//       <div>
//         <h3 className="font-semibold text-gray-900">{title}</h3>
//         <div className="flex gap-1 mt-1">
//           <div className="w-2 h-2 rounded-full bg-green-500"></div>
//         </div>
//       </div>
//     </div>

//     <p className="text-sm text-gray-600 mb-4">{description}</p>
    
//     {/* <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-gray-100">
//       {stats.map((stat, index) => (
//         <div key={index} className="text-center">
//           <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
//           <p className="font-semibold text-gray-900">{stat.value}</p>
//         </div>
//       ))}
//     </div> */}

//     <button
//       onClick={() => navigate("admin/user_management")}
//       className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors"
//     >
//       {buttonText}
//     </button>
//   </div>
// )

// export default function AdminDashboard() {
//   const navigate = useNavigate()

//   const stats = [
//     { icon: Users, label: 'TOTAL USERS', value: '15,847', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
//     { icon: Trophy, label: 'ACTIVE TOURNAMENTS', value: '23', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
//     // { icon: DollarSign, label: 'MONTHLY REVENUE', value: '₹285K', color: 'bg-green-500', bgColor: 'bg-green-50' },
//     // { icon: AlertCircle, label: 'PENDING APPROVALS', value: '12', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
//     // { icon: Activity, label: 'LIVE MATCHES', value: '8', color: 'bg-red-500', bgColor: 'bg-red-50' },
//     // { icon: Clock, label: 'RECENT ACTIVITIES', value: '47', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
//   ]
 
//   const modules = [
//     {
//       icon: UserCheck,
//       title: 'User & Role Management',
//       description: 'Manage organizers, clubs, players, and fans. Approve registrations.',
//       stats: [
//         { label: 'Pending', value: '8' },
//         { label: 'Suspended', value: '3' },
//         { label: 'Total', value: '15847' },
//       ],
//       buttonText: 'Manage User',
//       color: 'bg-blue-500',
//     },
//     {
//       icon: Briefcase,
//       title: 'Plans & Pricing',
//       description: 'Configure plans, features, and pricing.',
//       stats: [
//         { label: 'Active Plans', value: '3' },
//         { label: 'Subscribers', value: '234' },
//         { label: 'Revenue', value: '₹2.8L' },
//       ],
//       buttonText: 'Manage Plans',
//       color: 'bg-green-500',
//     },
//     {
//       icon: Trophy,
//       title: 'Tournament Oversight',
//       description: 'Monitor tournaments and approve requests.',
//       stats: [
//         { label: 'Active', value: '23' },
//         { label: 'Pending Approval', value: '5' },
//         { label: 'Flagged', value: '2' },
//       ],
//       buttonText: 'Manage Tournament',
//       color: 'bg-purple-500',
//     },
//   ]

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-6">
//           <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
//           <p className="text-gray-600 text-sm mt-1">Welcome back! Here's your platform overview.</p>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8">

//         <div className="mb-12">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {stats.map((stat, index) => (
//               <StatCard key={index} {...stat} />
//             ))}
//           </div>
//         </div>

//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Modules</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {modules.map((module, index) => (
//               <ModuleCard key={index} {...module} navigate={navigate} />
//             ))}
//           </div>
//         </div>

//       </div>
//     </div>
//   )
// }
