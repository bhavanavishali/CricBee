import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAccessToken } from '@/api/chat';

export const useChatWebSocket = (matchId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!matchId || !user) {
      return; // Don't connect if no matchId or user not logged in
    }

    const token = getAccessToken();
    if (!token) {
      console.log('No access token, skipping WebSocket connection');
      return;
    }

    // WebSocket URL with token as query parameter
    const wsUrl = `ws://localhost:8000/chat/ws/${matchId}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [matchId, user]);

  const sendMessage = (messageText) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: messageText
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  return { messages, isConnected, sendMessage };
};