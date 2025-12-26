import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/api';

export const useChatWebSocket = (matchId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!matchId || !user) {
      return; // Don't connect if no matchId or user not logged in
    }

    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      const baseUrl = api?.defaults?.baseURL || 'http://localhost:8000';
      const wsBaseUrl = baseUrl
        .replace(/^https:/i, 'wss:')
        .replace(/^http:/i, 'ws:')
        .replace(/\/$/, '');

      // Cookies (HttpOnly access_token) will be sent automatically to wsBaseUrl domain.
      const wsUrl = `${wsBaseUrl}/chat/ws/${matchId}`;

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
        // Reconnect with small backoff (useful when token refresh happens or server restarts)
        if (!isCancelled) {
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, 1500);
        }
      };
    };

    connect();
    return () => {
      isCancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
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