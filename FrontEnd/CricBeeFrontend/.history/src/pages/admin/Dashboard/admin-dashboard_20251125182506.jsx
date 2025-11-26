

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

import { 
  Users, 
  Trophy, 
  DollarSign, 
  AlertCircle, 
  Activity, 
  Clock, 
  UserCheck, 
  Briefcase, 
  Bell, 
  Settings,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow flex-1 min-w-0`}>
    <div className={`${color} p-3 rounded-lg flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
)

const ModuleCard = ({ icon: Icon, title, description, stats, buttonText, color, navigate, route }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-1 mt-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>

    <p className="text-sm text-gray-600 mb-4">{description}</p>
    
    {stats && stats.length > 0 && (
      <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-gray-100">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    )}

    <button
      onClick={() => navigate(route || "admin/user_management")}
      className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors"
    >
      {buttonText}
    </button>
  </div>
)

export default function AdminDashboard() {
  const navigate = useNavigate()

  const stats = [
    { icon: Users, label: 'TOTAL USERS', value: '15,847', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { icon: Trophy, label: 'ACTIVE TOURNAMENTS', value: '23', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { icon: DollarSign, label: 'MONTHLY REVENUE', value: '₹285K', color: 'bg-green-500', bgColor: 'bg-green-50' },
    { icon: AlertCircle, label: 'PENDING APPROVALS', value: '12', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    { icon: Activity, label: 'LIVE MATCHES', value: '8', color: 'bg-red-500', bgColor: 'bg-red-50' },
    { icon: Clock, label: 'RECENT ACTIVITIES', value: '47', color: 'bg-gray-500', bgColor: 'bg-gray-50' },
  ]
 
  const modules = [
    {
      icon: UserCheck,
      title: 'User & Role Management',
      description: 'Manage organizers, clubs, players, and fans. Approve registrations and handle violations.',
      stats: [
        { label: 'Pending', value: '8' },
        { label: 'Suspended', value: '3' },
        { label: 'Total', value: '15847' },
      ],
      buttonText: 'Manage User',
      color: 'bg-blue-500',
      route: 'admin/user_management',
    },
    {
      icon: Briefcase,
      title: 'Plans & Pricing',
      description: 'Configure tournament plans, features, and pricing. Track subscription revenue.',
      stats: [
        { label: 'Active Plans', value: '3' },
        { label: 'Subscribers', value: '234' },
        { label: 'Revenue', value: '₹2.8L' },
      ],
      buttonText: 'Manage Plans',
      color: 'bg-green-500',
      route: 'admin/plans',
    },
    {
      icon: Trophy,
      title: 'Tournament Oversight',
      description: 'Monitor and approve tournaments. Intervene in disputes and flag suspicious activities.',
      stats: [
        { label: 'Active', value: '23' },
        { label: 'Pending Approval', value: '5' },
        { label: 'Flagged', value: '2' },
      ],
      buttonText: 'Manage Tournament',
      color: 'bg-purple-500',
      route: 'admin/tournaments',
    },
    {
      icon: BarChart3,
      title: 'Financial Control',
      description: 'Manage payments, settlements, and revenue reports. Monitor fan gifting transactions.',
      stats: [
        { label: 'Monthly Revenue', value: '₹2.8L' },
        { label: 'Pending Settlements', value: '12' },
        { label: 'Gift Volume', value: '₹45K' },
      ],
      buttonText: 'Manage Financial',
      color: 'bg-yellow-500',
      route: 'admin/financial',
    },
    {
      icon: Bell,
      title: 'Content & Notifications',
      description: 'Manage banners, promotions, news updates, and push notifications.',
      stats: [
        { label: 'Active Banners', value: '4' },
        { label: 'Scheduled Notifications', value: '7' },
        { label: 'Featured Tournaments', value: '3' },
      ],
      buttonText: 'Manage Content',
      color: 'bg-pink-500',
      route: 'admin/content',
    },
    {
      icon: Settings,
      title: 'Platform Settings',
      description: 'Configure global settings, KYC policies, audit logs, and system configurations.',
      stats: [
        { label: 'Configurations', value: '15' },
        { label: 'Policies', value: '8' },
        { label: 'Audit Logs', value: '2.3K' },
      ],
      buttonText: 'Manage Platform',
      color: 'bg-indigo-500',
      route: 'admin/settings',
    },
  ]

  const recentActivities = [
    {
      text: 'New organizer registration: Mumbai Cricket Association',
      time: '5 minutes ago',
      status: 'pending',
      statusColor: 'bg-yellow-100 text-yellow-700',
    },
    {
      text: 'Tournament created: Delhi Corporate League 2024',
      time: '12 minutes ago',
      status: 'needs approval',
      statusColor: 'bg-orange-100 text-orange-700',
    },
    {
      text: 'Payment processed: ₹15,000 tournament entry fee',
      time: '23 minutes ago',
      status: 'completed',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      text: 'User suspended for policy violation: fake_organizer@test.com',
      time: '1 hour ago',
      status: 'action taken',
      statusColor: 'bg-red-100 text-red-700',
    },
    {
      text: 'Fan gift processed: ₹500 to Chennai Super Kings',
      time: '2 hours ago',
      status: 'completed',
      statusColor: 'bg-green-100 text-green-700',
    },
  ]

  const quickActions = [
    {
      title: 'Review Pending Users',
      description: '12 users waiting for approval',
      gradient: 'from-green-500 to-orange-500',
      route: 'admin/user_management',
    },
    {
      title: 'Tournament Approvals',
      description: '5 tournaments need approval',
      route: 'admin/tournaments',
    },
    {
      title: 'Financial Reports',
      description: 'View revenue and payment analytics',
      route: 'admin/financial',
    },
    {
      title: 'Send Notification',
      description: 'Broadcast to all platform users',
      route: 'admin/content',
    },
    {
      title: 'Platform Settings',
      description: 'Configure global system settings',
      route: 'admin/settings',
    },
  ]

  const platformHealth = [
    { label: 'System Uptime', value: '98.7%' },
    { label: 'Avg Response Time', value: '2.3s' },
    { label: 'Active Users', value: '1.2K' },
    { label: 'Payment Success Rate', value: '99.1%' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-gray-600 text-sm mt-1">Welcome back! Here's your platform overview.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards - All in One Row */}
        <div className="mb-12">
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>

        {/* Admin Modules - 6 Cards in 3x2 Grid */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <ModuleCard key={index} {...module} navigate={navigate} />
            ))}
          </div>
        </div> */}

        {/* Recent Activities and Quick Actions - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Recent Platform Activities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Platform Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-gray-900 mb-2">{activity.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.statusColor}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
              View All Activities
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.route)}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    index === 0
                      ? `bg-gradient-to-r ${action.gradient} text-white hover:shadow-lg`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="font-semibold mb-1">{action.title}</div>
                  <div className={`text-sm ${index === 0 ? 'text-white/90' : 'text-gray-600'}`}>
                    {action.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Health & Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Health & Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platformHealth.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}