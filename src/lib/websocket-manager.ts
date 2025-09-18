/**
 * EduSphere Professional WebSocket Manager
 * Enterprise-grade real-time communication client
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready WebSocket manager with comprehensive error handling,
 *              reconnection logic, event management, and type safety
 */

import { io, Socket } from 'socket.io-client';
import {
  IWebSocketManager,
  WebSocketConfig,
  // WebSocket event types
  JoinRoomEvent,
  LeaveRoomEvent,
  SendMessageEvent,
  TypingEvent,
  GetRoomInfoEvent,
  UserJoinedEvent,
  UserLeftEvent,
  NewMessageEvent,
  UserTypingEvent,
  RoomInfoEvent,
  WebSocketError,
  // Constants
  WS_EVENTS,
  DEFAULT_CONFIG,
} from '@/types/api';

/**
 * Event handler type definition
 */
type EventHandler<T = any> = (data: T) => void;

/**
 * Connection state enumeration
 */
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * WebSocket connection statistics
 */
interface ConnectionStats {
  connectTime?: number;
  disconnectTime?: number;
  reconnectAttempts: number;
  totalMessages: number;
  lastMessageTime?: number;
}

/**
 * Professional WebSocket Manager for EduSphere Real-time Features
 * Implements comprehensive connection management, event handling, and error recovery
 */
export class EduSphereWebSocketManager implements IWebSocketManager {
  private socket: Socket | null = null;
  private config: WebSocketConfig | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private stats: ConnectionStats = {
    reconnectAttempts: 0,
    totalMessages: 0,
  };

  // Configuration constants
  private readonly MAX_RECONNECT_ATTEMPTS = DEFAULT_CONFIG.WS_RECONNECT_ATTEMPTS;
  private readonly RECONNECT_DELAY = DEFAULT_CONFIG.WS_RECONNECT_DELAY;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds

  /**
   * Connect to WebSocket server with configuration
   * @param config - WebSocket connection configuration
   */
  public connect(config: WebSocketConfig): void {
    // Store configuration for reconnection
    this.config = config;

    // Prevent multiple connections
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    // Clean up existing connection
    this.disconnect();

    try {
      this.connectionState = ConnectionState.CONNECTING;
      this.emitConnectionStateChange();

      // Create socket connection with configuration
      this.socket = io(config.url, {
        auth: config.auth || {},
        secure: config.secure || config.url.startsWith('wss://'),
        timeout: this.CONNECTION_TIMEOUT,
        reconnection: false, // We handle reconnection manually
        transports: ['websocket', 'polling'], // Fallback to polling if needed
      });

      // Set up core event listeners
      this.setupCoreEventListeners();

      // Set up application event listeners
      this.setupApplicationEventListeners();

      console.log(`Connecting to WebSocket: ${config.url}`);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    // Clear timers
    this.clearTimers();

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Update state
    this.connectionState = ConnectionState.DISCONNECTED;
    this.stats.disconnectTime = Date.now();
    this.stats.reconnectAttempts = 0;

    this.emitConnectionStateChange();
    console.log('WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   * @returns boolean indicating connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ============================================================================
  // ROOM OPERATIONS
  // ============================================================================

  /**
   * Join a discussion room
   * @param roomId - Room ID to join
   * @param userId - User ID joining the room
   */
  public joinRoom(roomId: string, userId: string): void {
    if (!this.isConnected()) {
      console.error('Cannot join room: WebSocket not connected');
      return;
    }

    const event: JoinRoomEvent = {
      room_id: roomId,
      user_id: userId,
    };

    this.emit(WS_EVENTS.JOIN_ROOM, event);
    console.log(`Joining room: ${roomId} as user: ${userId}`);
  }

  /**
   * Leave a discussion room
   * @param roomId - Room ID to leave
   * @param userId - User ID leaving the room
   */
  public leaveRoom(roomId: string, userId: string): void {
    if (!this.isConnected()) {
      console.error('Cannot leave room: WebSocket not connected');
      return;
    }

    const event: LeaveRoomEvent = {
      room_id: roomId,
      user_id: userId,
    };

    this.emit(WS_EVENTS.LEAVE_ROOM, event);
    console.log(`Leaving room: ${roomId} as user: ${userId}`);
  }

  /**
   * Get room information
   * @param roomId - Room ID to get information for
   */
  public getRoomInfo(roomId: string): void {
    if (!this.isConnected()) {
      console.error('Cannot get room info: WebSocket not connected');
      return;
    }

    const event: GetRoomInfoEvent = {
      room_id: roomId,
    };

    this.emit(WS_EVENTS.GET_ROOM_INFO, event);
    console.log(`Getting room info: ${roomId}`);
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Send message to room
   * @param roomId - Room ID to send message to
   * @param userId - User ID sending the message
   * @param content - Message content
   */
  public sendMessage(roomId: string, userId: string, content: string): void {
    if (!this.isConnected()) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    if (!content.trim()) {
      console.error('Cannot send empty message');
      return;
    }

    const event: SendMessageEvent = {
      room_id: roomId,
      user_id: userId,
      content: content.trim(),
    };

    this.emit(WS_EVENTS.SEND_MESSAGE, event);
    this.stats.totalMessages++;
    this.stats.lastMessageTime = Date.now();

    console.log(`Sending message to room: ${roomId}`);
  }

  /**
   * Set typing indicator status
   * @param roomId - Room ID to set typing status for
   * @param userId - User ID setting typing status
   * @param isTyping - Whether user is typing
   */
  public setTyping(roomId: string, userId: string, isTyping: boolean): void {
    if (!this.isConnected()) {
      return; // Silently fail for typing indicators
    }

    const event: TypingEvent = {
      room_id: roomId,
      user_id: userId,
      is_typing: isTyping,
    };

    this.emit(WS_EVENTS.TYPING, event);
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Register event handler
   * @param event - Event name to listen for
   * @param handler - Event handler function
   */
  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    const handlers = this.eventHandlers.get(event)!;
    handlers.push(handler);

    console.log(`Registered handler for event: ${event}`);
  }

  /**
   * Unregister event handler
   * @param event - Event name to stop listening for
   * @param handler - Specific handler to remove (optional)
   */
  public off(event: string, handler?: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    if (handler) {
      // Remove specific handler
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers for event
      this.eventHandlers.delete(event);
    }

    console.log(`Unregistered handler(s) for event: ${event}`);
  }

  /**
   * Emit event to server
   * @param event - Event name to emit
   * @param data - Event data to send
   */
  public emit(event: string, data?: any): void {
    if (!this.socket) {
      console.error(`Cannot emit event ${event}: Socket not available`);
      return;
    }

    try {
      this.socket.emit(event, data);
    } catch (error) {
      console.error(`Failed to emit event ${event}:`, error);
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Set up core WebSocket event listeners
   */
  private setupCoreEventListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on(WS_EVENTS.CONNECT, () => {
      this.connectionState = ConnectionState.CONNECTED;
      this.stats.connectTime = Date.now();
      this.stats.reconnectAttempts = 0;

      console.log('WebSocket connected successfully');
      this.emitConnectionStateChange();
      this.startHeartbeat();
    });

    // Connection lost
    this.socket.on(WS_EVENTS.DISCONNECT, (reason: string) => {
      this.connectionState = ConnectionState.DISCONNECTED;
      this.stats.disconnectTime = Date.now();

      console.log(`WebSocket disconnected: ${reason}`);
      this.emitConnectionStateChange();
      this.stopHeartbeat();

      // Attempt reconnection if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnection();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error);
    });

    // Generic error handling
    this.socket.on(WS_EVENTS.ERROR, (error: WebSocketError) => {
      console.error('WebSocket error:', error);
      this.emitToHandlers(WS_EVENTS.ERROR, error);
    });
  }

  /**
   * Set up application-specific event listeners
   */
  private setupApplicationEventListeners(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on(WS_EVENTS.JOINED_ROOM, (data: any) => {
      console.log('Successfully joined room:', data);
      this.emitToHandlers(WS_EVENTS.JOINED_ROOM, data);
    });

    this.socket.on(WS_EVENTS.LEFT_ROOM, (data: any) => {
      console.log('Successfully left room:', data);
      this.emitToHandlers(WS_EVENTS.LEFT_ROOM, data);
    });

    this.socket.on(WS_EVENTS.USER_JOINED, (data: UserJoinedEvent) => {
      console.log('User joined room:', data);
      this.emitToHandlers(WS_EVENTS.USER_JOINED, data);
    });

    this.socket.on(WS_EVENTS.USER_LEFT, (data: UserLeftEvent) => {
      console.log('User left room:', data);
      this.emitToHandlers(WS_EVENTS.USER_LEFT, data);
    });

    // Message events
    this.socket.on(WS_EVENTS.NEW_MESSAGE, (data: NewMessageEvent) => {
      console.log('New message received:', data);
      this.emitToHandlers(WS_EVENTS.NEW_MESSAGE, data);
    });

    this.socket.on(WS_EVENTS.USER_TYPING, (data: UserTypingEvent) => {
      this.emitToHandlers(WS_EVENTS.USER_TYPING, data);
    });

    // Room info events
    this.socket.on(WS_EVENTS.ROOM_INFO, (data: RoomInfoEvent) => {
      console.log('Room info received:', data);
      this.emitToHandlers(WS_EVENTS.ROOM_INFO, data);
    });
  }

  /**
   * Emit event to registered handlers
   * @param event - Event name
   * @param data - Event data
   */
  private emitToHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Emit connection state change event
   */
  private emitConnectionStateChange(): void {
    this.emitToHandlers('connectionStateChange', {
      state: this.connectionState,
      stats: { ...this.stats },
    });
  }

  /**
   * Handle connection errors
   * @param error - Connection error
   */
  private handleConnectionError(error: Error): void {
    this.connectionState = ConnectionState.ERROR;
    this.emitConnectionStateChange();
    this.emitToHandlers(WS_EVENTS.ERROR, { message: error.message });

    // Attempt reconnection after delay
    this.attemptReconnection();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    if (!this.config) return;

    if (this.stats.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.connectionState = ConnectionState.ERROR;
      this.emitConnectionStateChange();
      return;
    }

    this.connectionState = ConnectionState.RECONNECTING;
    this.stats.reconnectAttempts++;
    this.emitConnectionStateChange();

    // Calculate delay with exponential backoff
    const delay = this.RECONNECT_DELAY * Math.pow(2, this.stats.reconnectAttempts - 1);
    
    console.log(`Attempting reconnection ${this.stats.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.config!);
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.emit('ping');
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get connection statistics
   * @returns Connection statistics object
   */
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Get current connection state
   * @returns Current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Force reconnection (useful for testing)
   */
  public forceReconnect(): void {
    if (this.config) {
      this.disconnect();
      setTimeout(() => this.connect(this.config!), 1000);
    }
  }

  /**
   * Clean up resources when manager is no longer needed
   */
  public destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
    console.log('WebSocket manager destroyed');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create configured WebSocket manager instance
 * @param config - WebSocket configuration
 * @returns Configured WebSocket manager instance
 */
export function createWebSocketManager(config?: WebSocketConfig): EduSphereWebSocketManager {
  const manager = new EduSphereWebSocketManager();
  
  if (config) {
    manager.connect(config);
  }

  return manager;
}

/**
 * Default WebSocket manager instance for development
 */
export const webSocketManager = new EduSphereWebSocketManager();

// Export connection state enum for use in components
export { ConnectionState };
