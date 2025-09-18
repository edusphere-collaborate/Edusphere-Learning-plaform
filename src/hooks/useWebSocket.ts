/**
 * EduSphere WebSocket React Hooks
 * Custom hooks for real-time communication with React components
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready React hooks for WebSocket integration with
 *              comprehensive state management, event handling, and type safety
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  EduSphereWebSocketManager,
  webSocketManager,
  ConnectionState,
} from '@/lib/websocket-manager';
import {
  WebSocketConfig,
  NewMessageEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserTypingEvent,
  RoomInfoEvent,
  WS_EVENTS,
} from '@/types/api';

// ============================================================================
// WEBSOCKET CONNECTION HOOK
// ============================================================================

/**
 * Main WebSocket connection hook with comprehensive state management
 * @param config - WebSocket configuration
 * @returns WebSocket connection state and methods
 */
export function useWebSocket(config?: WebSocketConfig) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    reconnectAttempts: 0,
    totalMessages: 0,
    connectTime: undefined as number | undefined,
    disconnectTime: undefined as number | undefined,
    lastMessageTime: undefined as number | undefined,
  });

  const managerRef = useRef<EduSphereWebSocketManager>(webSocketManager);

  // Connect to WebSocket server
  const connect = useCallback((wsConfig?: WebSocketConfig) => {
    const finalConfig = wsConfig || config;
    if (!finalConfig) {
      console.error('WebSocket configuration required');
      return;
    }

    managerRef.current.connect(finalConfig);
  }, [config]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    managerRef.current.disconnect();
  }, []);

  // Force reconnection
  const reconnect = useCallback(() => {
    managerRef.current.forceReconnect();
  }, []);

  // Set up connection state listeners
  useEffect(() => {
    const manager = managerRef.current;

    const handleConnectionStateChange = (data: {
      state: ConnectionState;
      stats: any;
    }) => {
      setConnectionState(data.state);
      setIsConnected(data.state === ConnectionState.CONNECTED);
      setStats(data.stats);
    };

    manager.on('connectionStateChange', handleConnectionStateChange);

    return () => {
      manager.off('connectionStateChange', handleConnectionStateChange);
    };
  }, []);

  // Auto-connect if config is provided
  useEffect(() => {
    if (config && !isConnected && connectionState === ConnectionState.DISCONNECTED) {
      connect(config);
    }
  }, [config, connect, isConnected, connectionState]);

  return {
    // Connection state
    connectionState,
    isConnected,
    stats,
    
    // Connection methods
    connect,
    disconnect,
    reconnect,
    
    // WebSocket manager instance
    manager: managerRef.current,
  };
}

// ============================================================================
// ROOM MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for managing room membership and events
 * @param roomId - Room ID to manage
 * @param userId - User ID for room operations
 * @returns Room management state and methods
 */
export function useRoom(roomId: string, userId: string) {
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const managerRef = useRef<EduSphereWebSocketManager>(webSocketManager);

  // Join room
  const joinRoom = useCallback(() => {
    if (!roomId || !userId) return;
    managerRef.current.joinRoom(roomId, userId);
  }, [roomId, userId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!roomId || !userId) return;
    managerRef.current.leaveRoom(roomId, userId);
  }, [roomId, userId]);

  // Get room information
  const getRoomInfo = useCallback(() => {
    if (!roomId) return;
    managerRef.current.getRoomInfo(roomId);
  }, [roomId]);

  // Set up room event listeners
  useEffect(() => {
    const manager = managerRef.current;

    const handleJoinedRoom = (data: any) => {
      if (data.room_id === roomId) {
        setIsJoined(true);
        console.log('Successfully joined room:', roomId);
      }
    };

    const handleLeftRoom = (data: any) => {
      if (data.room_id === roomId) {
        setIsJoined(false);
        console.log('Successfully left room:', roomId);
      }
    };

    const handleUserJoined = (data: UserJoinedEvent) => {
      setUsers(prev => [...prev.filter(id => id !== data.user_id), data.user_id]);
      console.log('User joined room:', data.username);
    };

    const handleUserLeft = (data: UserLeftEvent) => {
      setUsers(prev => prev.filter(id => id !== data.user_id));
      console.log('User left room:', data.username);
    };

    const handleRoomInfo = (data: RoomInfoEvent) => {
      setRoomInfo(data.room);
      if (data.room.users) {
        setUsers(data.room.users.map(user => user.id));
      }
    };

    // Register event handlers
    manager.on(WS_EVENTS.JOINED_ROOM, handleJoinedRoom);
    manager.on(WS_EVENTS.LEFT_ROOM, handleLeftRoom);
    manager.on(WS_EVENTS.USER_JOINED, handleUserJoined);
    manager.on(WS_EVENTS.USER_LEFT, handleUserLeft);
    manager.on(WS_EVENTS.ROOM_INFO, handleRoomInfo);

    return () => {
      // Clean up event handlers
      manager.off(WS_EVENTS.JOINED_ROOM, handleJoinedRoom);
      manager.off(WS_EVENTS.LEFT_ROOM, handleLeftRoom);
      manager.off(WS_EVENTS.USER_JOINED, handleUserJoined);
      manager.off(WS_EVENTS.USER_LEFT, handleUserLeft);
      manager.off(WS_EVENTS.ROOM_INFO, handleRoomInfo);
    };
  }, [roomId]);

  // Auto-join room when connected
  useEffect(() => {
    if (managerRef.current.isConnected() && roomId && userId && !isJoined) {
      joinRoom();
    }
  }, [joinRoom, roomId, userId, isJoined]);

  return {
    // State
    isJoined,
    users,
    roomInfo,
    
    // Actions
    joinRoom,
    leaveRoom,
    getRoomInfo,
  };
}

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

/**
 * Hook for managing real-time messages in a room
 * @param roomId - Room ID to listen for messages
 * @param userId - User ID for sending messages
 * @returns Message state and methods
 */
export function useMessages(roomId: string, userId: string) {
  const [messages, setMessages] = useState<NewMessageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const managerRef = useRef<EduSphereWebSocketManager>(webSocketManager);

  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!roomId || !userId || !content.trim()) return;
    
    setIsLoading(true);
    managerRef.current.sendMessage(roomId, userId, content.trim());
    
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 500);
  }, [roomId, userId]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Set up message event listeners
  useEffect(() => {
    const manager = managerRef.current;

    const handleNewMessage = (data: NewMessageEvent) => {
      if (data.room_id === roomId) {
        setMessages(prev => [...prev, data]);
        setIsLoading(false);
      }
    };

    manager.on(WS_EVENTS.NEW_MESSAGE, handleNewMessage);

    return () => {
      manager.off(WS_EVENTS.NEW_MESSAGE, handleNewMessage);
    };
  }, [roomId]);

  // Clear messages when room changes
  useEffect(() => {
    clearMessages();
  }, [roomId, clearMessages]);

  return {
    // State
    messages,
    isLoading,
    
    // Actions
    sendMessage,
    clearMessages,
  };
}

// ============================================================================
// TYPING INDICATOR HOOKS
// ============================================================================

/**
 * Hook for managing typing indicators in a room
 * @param roomId - Room ID to manage typing for
 * @param userId - User ID for typing status
 * @returns Typing state and methods
 */
export function useTyping(roomId: string, userId: string) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const managerRef = useRef<EduSphereWebSocketManager>(webSocketManager);

  // Start typing
  const startTyping = useCallback(() => {
    if (!roomId || !userId || isTyping) return;

    setIsTyping(true);
    managerRef.current.setTyping(roomId, userId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [roomId, userId, isTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!roomId || !userId || !isTyping) return;

    setIsTyping(false);
    managerRef.current.setTyping(roomId, userId, false);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [roomId, userId, isTyping]);

  // Handle typing input
  const handleTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  // Set up typing event listeners
  useEffect(() => {
    const manager = managerRef.current;

    const handleUserTyping = (data: UserTypingEvent) => {
      // Don't show own typing status
      if (data.user_id === userId) return;

      setTypingUsers(prev => {
        const newMap = new Map(prev);
        
        if (data.is_typing) {
          newMap.set(data.user_id, data.username);
        } else {
          newMap.delete(data.user_id);
        }
        
        return newMap;
      });

      // Auto-remove typing status after 5 seconds
      if (data.is_typing) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.user_id);
            return newMap;
          });
        }, 5000);
      }
    };

    manager.on(WS_EVENTS.USER_TYPING, handleUserTyping);

    return () => {
      manager.off(WS_EVENTS.USER_TYPING, handleUserTyping);
      
      // Clean up timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId]);

  // Clean up when room changes
  useEffect(() => {
    setTypingUsers(new Map());
    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [roomId]);

  return {
    // State
    typingUsers: Array.from(typingUsers.values()),
    isTyping,
    
    // Actions
    startTyping,
    stopTyping,
    handleTyping,
  };
}

// ============================================================================
// PRESENCE HOOKS
// ============================================================================

/**
 * Hook for managing user presence in a room
 * @param roomId - Room ID to track presence for
 * @returns Presence state
 */
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userCount, setUserCount] = useState(0);

  // Set up presence event listeners
  useEffect(() => {
    const manager = webSocketManager;

    const handleUserJoined = (data: UserJoinedEvent) => {
      setOnlineUsers(prev => new Set([...prev, data.user_id]));
      setUserCount(prev => prev + 1);
    };

    const handleUserLeft = (data: UserLeftEvent) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user_id);
        return newSet;
      });
      setUserCount(prev => Math.max(0, prev - 1));
    };

    const handleRoomInfo = (data: RoomInfoEvent) => {
      if (data.room.users) {
        const userIds = new Set(data.room.users.map(user => user.id));
        setOnlineUsers(userIds);
        setUserCount(userIds.size);
      }
    };

    manager.on(WS_EVENTS.USER_JOINED, handleUserJoined);
    manager.on(WS_EVENTS.USER_LEFT, handleUserLeft);
    manager.on(WS_EVENTS.ROOM_INFO, handleRoomInfo);

    return () => {
      manager.off(WS_EVENTS.USER_JOINED, handleUserJoined);
      manager.off(WS_EVENTS.USER_LEFT, handleUserLeft);
      manager.off(WS_EVENTS.ROOM_INFO, handleRoomInfo);
    };
  }, []);

  // Reset presence when room changes
  useEffect(() => {
    setOnlineUsers(new Set());
    setUserCount(0);
  }, [roomId]);

  return {
    onlineUsers: Array.from(onlineUsers),
    userCount,
    isUserOnline: (userId: string) => onlineUsers.has(userId),
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for handling WebSocket errors
 * @returns Error state and handlers
 */
export function useWebSocketError() {
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setHasError(false);
  }, []);

  // Set up error event listeners
  useEffect(() => {
    const manager = webSocketManager;

    const handleError = (errorData: any) => {
      setError(errorData.message || 'WebSocket error occurred');
      setHasError(true);
      console.error('WebSocket error:', errorData);
    };

    manager.on(WS_EVENTS.ERROR, handleError);

    return () => {
      manager.off(WS_EVENTS.ERROR, handleError);
    };
  }, []);

  return {
    error,
    hasError,
    clearError,
  };
}

/**
 * Hook for WebSocket connection health monitoring
 * @returns Connection health metrics
 */
export function useConnectionHealth() {
  const [health, setHealth] = useState({
    isHealthy: false,
    latency: 0,
    lastPingTime: 0,
  });

  const pingTimeRef = useRef<number>(0);

  // Ping server to measure latency
  const ping = useCallback(() => {
    if (!webSocketManager.isConnected()) return;

    pingTimeRef.current = Date.now();
    webSocketManager.emit('ping');
  }, []);

  // Set up health monitoring
  useEffect(() => {
    const manager = webSocketManager;

    const handlePong = () => {
      const latency = Date.now() - pingTimeRef.current;
      setHealth({
        isHealthy: latency < 1000, // Consider healthy if latency < 1s
        latency,
        lastPingTime: Date.now(),
      });
    };

    const handleConnect = () => {
      setHealth(prev => ({ ...prev, isHealthy: true }));
    };

    const handleDisconnect = () => {
      setHealth(prev => ({ ...prev, isHealthy: false }));
    };

    manager.on('pong', handlePong);
    manager.on(WS_EVENTS.CONNECT, handleConnect);
    manager.on(WS_EVENTS.DISCONNECT, handleDisconnect);

    // Ping every 30 seconds
    const pingInterval = setInterval(ping, 30000);

    return () => {
      manager.off('pong', handlePong);
      manager.off(WS_EVENTS.CONNECT, handleConnect);
      manager.off(WS_EVENTS.DISCONNECT, handleDisconnect);
      clearInterval(pingInterval);
    };
  }, [ping]);

  return {
    ...health,
    ping,
  };
}

/**
 * Hook for managing WebSocket event subscriptions
 * @param event - Event name to subscribe to
 * @param handler - Event handler function
 * @param dependencies - Dependencies for the handler
 */
export function useWebSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
) {
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  // Set up event subscription
  useEffect(() => {
    const manager = webSocketManager;
    
    const wrappedHandler = (data: T) => {
      handlerRef.current(data);
    };

    manager.on(event, wrappedHandler);

    return () => {
      manager.off(event, wrappedHandler);
    };
  }, [event]);
}
