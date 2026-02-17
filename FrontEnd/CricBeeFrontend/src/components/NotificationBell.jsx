"use client"
import { useState, useEffect } from "react"
import { Bell, X, Check } from "lucide-react"
import { getNotifications, markNotificationRead } from '@/api/notifications'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await getNotifications()
      setNotifications(response.notifications || [])
      setUnreadCount(response.unread_count || 0)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification)
    if (!notification.is_read) {
      markNotificationRead(notification.id)
      loadNotifications() // Refresh to update unread count
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId)
      loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedNotification.title}
              </h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-700 mb-4">
              {selectedNotification.description}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {new Date(selectedNotification.created_at).toLocaleString()}
              </span>
              {!selectedNotification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(selectedNotification.id)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Check size={16} />
                  Mark as read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
