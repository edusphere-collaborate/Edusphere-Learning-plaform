import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

// WebSocket event types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_status' | 'room_update' | 'error';
  payload: any;
  roomId?: string;
  userId?: string;
  timestamp: string;
}

// Typing indicator data
export interface TypingData {
  userId: string;
  roomId: string;
  isTyping: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// User status data
export interface UserStatusData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

// Message data
export interface MessageData {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'code';
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
  replyToId?: string;
  metadata?: any;
}

interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Message functions
  sendMessage: (roomId: string, content: string, type?: string, replyToId?: string) => void;
  
  // Typing indicators
  sendTypingIndicator: (roomId: string, isTyping: boolean) => void;
  typingUsers: Record<string, TypingData[]>; // roomId -> typing users
  
  // User status
  onlineUsers: Record<string, UserStatusData>; // userId -> status
  
  // Room management
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  
  // Event listeners
  onMessage: (callback: (message: MessageData) => void) => () => void;
  onTyping: (callback: (typing: TypingData) => void) => () => void;
  onUserStatus: (callback: (status: UserStatusData) => void) => () => void;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Custom hook for WebSocket context
// Using React.useMemo to make it compatible with Fast Refresh
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return React.useMemo(() => context, [context]);
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

export function WebSocketProvider({ 
  children, 
  url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001' 
}: WebSocketProviderProps) {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Real-time data
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingData[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserStatusData>>({});
  
  // Event listeners
  const messageListeners = useRef<Set<(message: MessageData) => void>>(new Set());
  const typingListeners = useRef<Set<(typing: TypingData) => void>>(new Set());
  const statusListeners = useRef<Set<(status: UserStatusData) => void>>(new Set());

  // Connection management with enhanced error handling and fallback
  const connect = useCallback(() => {
    if (!user || ws.current?.readyState === WebSocket.OPEN) return;

    try {
      setConnectionStatus('connecting');
      const token = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
      
      // Enhanced WebSocket URL validation and fallback
      let wsUrl = url;
      if (!token) {
        console.warn('[WebSocket] No authentication token found, skipping connection');
        setConnectionStatus('error');
        return;
      }

      // Construct WebSocket URL with proper error handling
      try {
        wsUrl = `${url}?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(token)}`;
        console.log('[WebSocket] Attempting connection to:', wsUrl.replace(/token=[^&]+/, 'token=[REDACTED]'));
      } catch (urlError) {
        console.error('[WebSocket] Failed to construct WebSocket URL:', urlError);
        setConnectionStatus('error');
        return;
      }

      ws.current = new WebSocket(wsUrl);

      // Connection timeout handling
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CONNECTING) {
          console.warn('[WebSocket] Connection timeout, closing...');
          ws.current?.close();
          setConnectionStatus('error');
        }
      }, 10000); // 10 second timeout

      ws.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Start heartbeat with error handling
        heartbeatInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            try {
              ws.current.send(JSON.stringify({ type: 'ping' }));
            } catch (pingError) {
              console.error('[WebSocket] Failed to send ping:', pingError);
            }
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`[WebSocket] Disconnected: ${event.code} ${event.reason || '(no reason)'}`);
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        
        // Handle different close codes appropriately
        if (event.code === 1000) {
          // Normal closure
          setConnectionStatus('disconnected');
        } else if (event.code === 1006) {
          // Abnormal closure (server unavailable)
          console.warn('[WebSocket] Server unavailable, operating in offline mode');
          setConnectionStatus('error');
        } else if (event.code === 1001) {
          // Going away
          setConnectionStatus('disconnected');
        } else {
          // Other errors - attempt reconnection
          setConnectionStatus('error');
          if (user) {
            scheduleReconnect();
          }
        }
      };

      ws.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('[WebSocket] Connection error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('[WebSocket] Failed to initialize connection:', error);
      setConnectionStatus('error');
    }
  }, [user, url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    // Exponential backoff with maximum delay
    const baseDelay = 3000;
    const maxDelay = 30000;
    const attempt = Math.min(5, (reconnectTimeout.current as any)?.attempt || 0);
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    reconnectTimeout.current = setTimeout(() => {
      console.log(`[WebSocket] Attempting reconnection (attempt ${attempt + 1})...`);
      connect();
    }, delay) as any;
    
    (reconnectTimeout.current as any).attempt = attempt + 1;
  }, [connect]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Message handling
  const handleMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'message':
        messageListeners.current.forEach(listener => listener(data.payload));
        break;
        
      case 'typing':
        const typingData = data.payload as TypingData;
        setTypingUsers(prev => {
          const roomTyping = prev[typingData.roomId] || [];
          
          if (typingData.isTyping) {
            // Add user to typing list if not already there
            const existingIndex = roomTyping.findIndex(t => t.userId === typingData.userId);
            if (existingIndex === -1) {
              return {
                ...prev,
                [typingData.roomId]: [...roomTyping, typingData]
              };
            }
          } else {
            // Remove user from typing list
            return {
              ...prev,
              [typingData.roomId]: roomTyping.filter(t => t.userId !== typingData.userId)
            };
          }
          
          return prev;
        });
        typingListeners.current.forEach(listener => listener(typingData));
        break;
        
      case 'user_status':
        const statusData = data.payload as UserStatusData;
        setOnlineUsers(prev => ({
          ...prev,
          [statusData.userId]: statusData
        }));
        statusListeners.current.forEach(listener => listener(statusData));
        break;
        
      case 'error':
        console.error('WebSocket error:', data.payload);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Send functions with offline fallback
  const sendMessage = useCallback((roomId: string, content: string, type = 'text', replyToId?: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message - not connected. Operating in offline mode.');
      // In a production app, you might queue messages for later sending
      return;
    }

    try {
      const message: WebSocketMessage = {
        type: 'message',
        payload: {
          roomId,
          content,
          type,
          replyToId
        },
        roomId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      };

      ws.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  }, [user]);

  const sendTypingIndicator = useCallback((roomId: string, isTyping: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      // Silently fail for typing indicators when offline
      return;
    }

    try {
      const message: WebSocketMessage = {
        type: 'typing',
        payload: {
          roomId,
          isTyping,
          userId: user?.id,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName
          } : null
        },
        roomId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      };

      ws.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send typing indicator:', error);
    }
  }, [user]);

  const joinRoom = useCallback((roomId: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot join room - not connected');
      return;
    }

    try {
      ws.current.send(JSON.stringify({
        type: 'join_room',
        payload: { roomId },
        roomId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[WebSocket] Failed to join room:', error);
    }
  }, [user]);

  const leaveRoom = useCallback((roomId: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      // Silently fail for leave room when offline
      return;
    }

    try {
      ws.current.send(JSON.stringify({
        type: 'leave_room',
        payload: { roomId },
        roomId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[WebSocket] Failed to leave room:', error);
    }
  }, [user]);

  // Event listener management
  const onMessage = useCallback((callback: (message: MessageData) => void) => {
    messageListeners.current.add(callback);
    return () => messageListeners.current.delete(callback);
  }, []);

  const onTyping = useCallback((callback: (typing: TypingData) => void) => {
    typingListeners.current.add(callback);
    return () => typingListeners.current.delete(callback);
  }, []);

  const onUserStatus = useCallback((callback: (status: UserStatusData) => void) => {
    statusListeners.current.add(callback);
    return () => statusListeners.current.delete(callback);
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !isConnected) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    sendMessage,
    sendTypingIndicator,
    typingUsers,
    onlineUsers,
    joinRoom,
    leaveRoom,
    onMessage,
    onTyping,
    onUserStatus,
    connect,
    disconnect,
    reconnect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
