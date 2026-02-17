import api from '../api'

export const getNotifications = async () => {
  const response = await api.get('/api/v1/notifications/')
  return response.data
}

export const markNotificationRead = async (notificationId) => {
  const response = await api.post(`/api/v1/notifications/${notificationId}/mark-read`)
  return response.data
}
