"use client"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
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
import { getDashboardStats } from "@/api/adminService"

function formatRevenue(value) {
  const num = Number(value) || 0
  if (num >= 1e7) return `${(num / 1e7).toFixed(1)} Cr`
  if (num >= 1e5) return `${(num / 1e5).toFixed(1)} L`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)} K`
  return num.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_users: 0,
    total_tournaments: 0,
    active_tournaments: 0,
    total_revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      const result = await getDashboardStats()
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setStats({
          total_users: result.data.total_users ?? 0,
          total_tournaments: result.data.total_tournaments ?? 0,
          active_tournaments: result.data.active_tournaments ?? 0,
          total_revenue: result.data.total_revenue ?? 0,
        })
      } else {
        setError(result.message || "Failed to load stats")
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [])

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
              <div className="text-xl font-bold text-gray-900">
                {loading ? "—" : error ? "—" : stats.total_users.toLocaleString()}
              </div>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>

          {/* Total Tournaments */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">TOTAL TOURNAMENTS</div>
              <div className="text-xl font-bold text-gray-900">
                {loading ? "—" : error ? "—" : stats.total_tournaments.toLocaleString()}
              </div>
            </div>
            <Trophy size={24} className="text-amber-500" />
          </div>

          {/* Active Tournaments */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">ACTIVE TOURNAMENTS</div>
              <div className="text-xl font-bold text-gray-900">
                {loading ? "—" : error ? "—" : stats.active_tournaments.toLocaleString()}
              </div>
            </div>
            <Trophy size={24} className="text-pink-500" />
          </div>

          {/* Total Revenue */}
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#e0e7ff" }}>
            <div>
              <div className="text-[10px] font-bold text-gray-600 mb-1">TOTAL REVENUE</div>
              <div className="text-xl font-bold text-gray-900">
                {loading ? "—" : error ? "—" : `₹${formatRevenue(stats.total_revenue)}`}
              </div>
            </div>
            <DollarSign size={24} className="text-green-500" />
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
       
              <button
                onClick={() => navigate("/admin/transaction")}
                className="w-full py-2 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} />
                Manage Financial
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

        
      </main>
    </div>
  )
}