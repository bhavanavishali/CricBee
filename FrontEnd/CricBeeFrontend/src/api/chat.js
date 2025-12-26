import api from '@/api';

// Get chat messages history
export const getChatMessages = async (matchId) => {
  try {
    const response = await api.get(`/chat/messages/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
};

// Send message via REST API (fallback)
export const sendChatMessage = async (matchId, message) => {
  try {
    const response = await api.post('/chat/send', {
      match_id: matchId,
      message
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Get access token from cookies
export const getAccessToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token') {
      return value;
    }
  }
  return null;
};