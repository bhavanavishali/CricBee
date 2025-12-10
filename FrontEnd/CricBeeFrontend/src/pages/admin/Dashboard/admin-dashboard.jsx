"use client"
import { useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "#1e293b", backgroundColor: "#0f172a" }}>
        <div className="flex items-center justify-between p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center">
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
        <div className="grid grid-cols-6 gap-3 mb-8">
          {/* Total Users */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">TOTAL USERS</div>
              <div className="text-xl font-bold text-gray-900">15,847</div>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>

          {/* Active Tournaments */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">ACTIVE TOURNAMENTS</div>
              <div className="text-xl font-bold text-gray-900">23</div>
            </div>
            <Trophy size={24} className="text-pink-500" />
          </div>

          {/* Monthly Revenue */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">MONTHLY REVENUE</div>
              <div className="text-xl font-bold text-gray-900">₹285K</div>
            </div>
            <DollarSign size={24} className="text-green-500" />
          </div>

          {/* Pending Approvals */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">PENDING APPROVALS</div>
              <div className="text-xl font-bold text-gray-900">12</div>
            </div>
            <AlertCircle size={24} className="text-yellow-500" />
          </div>

          {/* Live Matches */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">LIVE MATCHES</div>
              <div className="text-xl font-bold text-gray-900">8</div>
            </div>
            <TrendingUp size={24} className="text-orange-500" />
          </div>

          {/* Recent Activities */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">RECENT ACTIVITIES</div>
              <div className="text-xl font-bold text-gray-900">47</div>
            </div>
            <Clock size={24} className="text-purple-500" />
          </div>
        </div>

        {/* Admin Modules */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Admin Modules</h2>
          <div className="grid grid-cols-3 gap-6">
            {/* User & Role Management */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/usermanagement")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <Users size={16} />
                Manage User
              </button>
            </div>

            {/* Plans & Pricing */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/plans")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <DollarSign size={16} />
                Manage Plans
              </button>
            </div>

            {/* Tournament Oversight */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/tournaments")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trophy size={16} />
                Manage Tournament
              </button>
            </div>

            {/* Financial Control */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/transaction")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} />
                Manage Financial
              </button>
            </div>

            {/* Content & Notifications */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/content")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <Bell size={16} />
                Manage Content
              </button>
            </div>

            {/* Platform Settings */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b", borderTop: "4px solid #0d9488" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
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
              <button
                onClick={() => navigate("/admin/settings")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <Cog size={16} />
                Manage Platform
              </button>
            </div>
          </div>
        </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-lg mb-8" style={{ backgroundColor: "#1e293b" }}>
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
                className="w-full p-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium text-left flex items-start gap-3"
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
                className="w-full p-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium text-left flex items-start gap-3"
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
                className="w-full p-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium text-left flex items-start gap-3"
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
                className="w-full p-3 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium text-left flex items-start gap-3"
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

        {/* Platform Health & Performance */}
        <div className="p-6 rounded-lg" style={{ backgroundColor: "#1e293b" }}>
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} />
            Platform Health & Performance
          </h3>
          <div className="grid grid-cols-4 gap-6">
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