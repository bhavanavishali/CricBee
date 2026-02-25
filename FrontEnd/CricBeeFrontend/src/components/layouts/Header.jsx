"use client"

import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Settings, LogOut, ChevronRight } from "lucide-react"
import { clearUser } from '@/store/slices/authSlice'
import api from '@/api'
import NotificationBell from '@/components/NotificationBell'

export default function Header({ title, profilePath }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const userRole = user?.role?.toLowerCase()?.replace(/\s+/g, '_') // Convert to lowercase and replace spaces with underscores

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout`)
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      dispatch(clearUser())
      navigate('/signin')
    }
  }

  const getRoleLabel = (role) => {
    const roleMap = {
      organizer: "Organizer",
      club_manager: "Manager",
      player: "Player",
      fan: "Fan",
      admin: "Admin"
    }
    return roleMap[role] || role
  }

  const getAvatarInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase()
    }
    return userRole?.charAt(0).toUpperCase() || "U"
  }

  const getAvatarBgColor = () => {
    const colorMap = {
      organizer: "bg-green-100",
      club_manager: "bg-blue-100",
      player: "bg-orange-100",
      fan: "bg-purple-100",
      admin: "bg-gray-100"
    }
    return colorMap[userRole] || "bg-gray-100"
  }

  const getAvatarTextColor = () => {
    const colorMap = {
      organizer: "text-green-600",
      club_manager: "text-blue-600",
      player: "text-orange-600",
      fan: "text-purple-600",
      admin: "text-gray-600"
    }
    return colorMap[userRole] || "text-gray-600"
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
  type="button"
  onClick={() => navigate('/')}
  className="focus:outline-none"
  aria-label="Go to home"
>
  <img
    src="/Image (1).png"
    alt="CricB Logo"
    className="h-12 w-auto object-contain hover:opacity-100 transition-opacity"
  />
</button>
          {title && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-gray-600 font-medium">{title}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-6">
          {/* Show NotificationBell for club_manager and fan */}
          {(userRole === 'club_manager' || userRole === 'fan') && <NotificationBell />}
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            {/* <Settings size={20} className="text-gray-600" /> */}
          </button>
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.full_name || "User"}
              </p>
              <p className={`text-xs ${getAvatarTextColor()}`}>
                {getRoleLabel(userRole)}
              </p>
            </div>
            {profilePath && (
              <div
                onClick={() => navigate(profilePath)}
                className={`w-10 h-10 ${getAvatarBgColor()} rounded-full flex items-center justify-center ${getAvatarTextColor()} font-bold cursor-pointer hover:opacity-80 transition-all`}
              >
                {getAvatarInitial()}
              </div>
            )}
            {!profilePath && (
              <div
                className={`w-10 h-10 ${getAvatarBgColor()} rounded-full flex items-center justify-center ${getAvatarTextColor()} font-bold`}
              >
                {getAvatarInitial()}
              </div>
            )}
            <ChevronRight size={18} className="text-gray-400" />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}