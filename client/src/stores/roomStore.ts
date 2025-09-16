/**
 * Room State Store using Zustand
 * Manages room data, messages, participants, and real-time interactions
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Room, Message, User, MessageReaction } from '@/types/api';

/**
 * Room participant with online status
 */
export interface RoomParticipant extends User {
  isOnline: boolean;
  lastSeen: Date;
  isTyping: boolean;
}

/**
 * Message with extended metadata
 */
export interface ExtendedMessage extends Message {
  user: User;
  isOptimistic?: boolean; // For optimistic updates
  sendingFailed?: boolean; // For failed message handling
}

/**
 * Room state interface
 */
export interface RoomState {
  // Current room data
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  
  // Room list management
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  
  // Messages management
  messages: { [roomId: string]: ExtendedMessage[] };
  setMessages: (roomId: string, messages: ExtendedMessage[]) => void;
  addMessage: (roomId: string, message: ExtendedMessage) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<ExtendedMessage>) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  
  // Optimistic message handling
  addOptimisticMessage: (roomId: string, message: Omit<ExtendedMessage, 'id' | 'createdAt'>) => string;
  confirmOptimisticMessage: (roomId: string, tempId: string, confirmedMessage: ExtendedMessage) => void;
  failOptimisticMessage: (roomId: string, tempId: string) => void;
  
  // Participants management
  participants: { [roomId: string]: RoomParticipant[] };
  setParticipants: (roomId: string, participants: RoomParticipant[]) => void;
  updateParticipant: (roomId: string, userId: string, updates: Partial<RoomParticipant>) => void;
  
  // Typing indicators
  typingUsers: { [roomId: string]: string[] };
  setUserTyping: (roomId: string, userId: string, isTyping: boolean) => void;
  clearTypingUsers: (roomId: string) => void;
  
  // Message reactions
  addReaction: (roomId: string, messageId: string, reaction: MessageReaction) => void;
  removeReaction: (roomId: string, messageId: string, reactionId: string) => void;
  
  // Room search and filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredRooms: Room[];
  
  // Room creation/joining
  isJoiningRoom: boolean;
  setIsJoiningRoom: (joining: boolean) => void;
  joinedRooms: Set<string>;
  addJoinedRoom: (roomId: string) => void;
  removeJoinedRoom: (roomId: string) => void;
  
  // Message drafts (auto-save)
  messageDrafts: { [roomId: string]: string };
  setMessageDraft: (roomId: string, draft: string) => void;
  clearMessageDraft: (roomId: string) => void;
  
  // Room settings
  roomSettings: { [roomId: string]: RoomSettings };
  updateRoomSettings: (roomId: string, settings: Partial<RoomSettings>) => void;
  
  // Utility methods
  getRoomMessages: (roomId: string) => ExtendedMessage[];
  getRoomParticipants: (roomId: string) => RoomParticipant[];
  getTypingUsers: (roomId: string) => string[];
  reset: () => void;
}

/**
 * Room-specific settings
 */
export interface RoomSettings {
  notifications: boolean;
  soundEnabled: boolean;
  showTypingIndicators: boolean;
  messagePreview: boolean;
  autoScroll: boolean;
}

/**
 * Default room settings
 */
const defaultRoomSettings: RoomSettings = {
  notifications: true,
  soundEnabled: true,
  showTypingIndicators: true,
  messagePreview: true,
  autoScroll: true
};

/**
 * Zustand store for room state management
 * Uses subscribeWithSelector for fine-grained reactivity
 */
export const useRoomStore = create<RoomState>()(
  subscribeWithSelector((set, get) => ({
    // Current room data
    currentRoom: null,
    setCurrentRoom: (room: Room | null) => {
      set({ currentRoom: room });
      
      // Clear typing users when switching rooms
      if (room) {
        get().clearTypingUsers(room.id);
      }
    },
    
    // Room list management
    rooms: [],
    setRooms: (rooms: Room[]) => set({ rooms }),
    
    addRoom: (room: Room) => {
      set((state) => ({
        rooms: [...state.rooms, room]
      }));
    },
    
    updateRoom: (roomId: string, updates: Partial<Room>) => {
      set((state) => ({
        rooms: state.rooms.map(room => 
          room.id === roomId ? { ...room, ...updates } : room
        ),
        currentRoom: state.currentRoom?.id === roomId 
          ? { ...state.currentRoom, ...updates }
          : state.currentRoom
      }));
    },
    
    removeRoom: (roomId: string) => {
      set((state) => ({
        rooms: state.rooms.filter(room => room.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom
      }));
      
      // Clean up related data
      const { messages, participants, typingUsers, messageDrafts, roomSettings } = get();
      const newMessages = { ...messages };
      const newParticipants = { ...participants };
      const newTypingUsers = { ...typingUsers };
      const newMessageDrafts = { ...messageDrafts };
      const newRoomSettings = { ...roomSettings };
      
      delete newMessages[roomId];
      delete newParticipants[roomId];
      delete newTypingUsers[roomId];
      delete newMessageDrafts[roomId];
      delete newRoomSettings[roomId];
      
      set({
        messages: newMessages,
        participants: newParticipants,
        typingUsers: newTypingUsers,
        messageDrafts: newMessageDrafts,
        roomSettings: newRoomSettings
      });
    },
    
    // Messages management
    messages: {},
    setMessages: (roomId: string, messages: ExtendedMessage[]) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: messages.sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          )
        }
      }));
    },
    
    addMessage: (roomId: string, message: ExtendedMessage) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = [...roomMessages, message].sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    updateMessage: (roomId: string, messageId: string, updates: Partial<ExtendedMessage>) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.map(msg => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    removeMessage: (roomId: string, messageId: string) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.filter(msg => msg.id !== messageId);
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    // Optimistic message handling
    addOptimisticMessage: (roomId: string, message: Omit<ExtendedMessage, 'id' | 'createdAt'>) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage: ExtendedMessage = {
        ...message,
        id: tempId,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };
      
      get().addMessage(roomId, optimisticMessage);
      return tempId;
    },
    
    confirmOptimisticMessage: (roomId: string, tempId: string, confirmedMessage: ExtendedMessage) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.map(msg => 
          msg.id === tempId ? { ...confirmedMessage, isOptimistic: false } : msg
        );
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    failOptimisticMessage: (roomId: string, tempId: string) => {
      get().updateMessage(roomId, tempId, { sendingFailed: true, isOptimistic: false });
    },
    
    // Participants management
    participants: {},
    setParticipants: (roomId: string, participants: RoomParticipant[]) => {
      set((state) => ({
        participants: {
          ...state.participants,
          [roomId]: participants
        }
      }));
    },
    
    updateParticipant: (roomId: string, userId: string, updates: Partial<RoomParticipant>) => {
      set((state) => {
        const roomParticipants = state.participants[roomId] || [];
        const updatedParticipants = roomParticipants.map(participant => 
          participant.id === userId ? { ...participant, ...updates } : participant
        );
        
        return {
          participants: {
            ...state.participants,
            [roomId]: updatedParticipants
          }
        };
      });
    },
    
    // Typing indicators
    typingUsers: {},
    setUserTyping: (roomId: string, userId: string, isTyping: boolean) => {
      set((state) => {
        const currentTyping = state.typingUsers[roomId] || [];
        let updatedTyping: string[];
        
        if (isTyping) {
          updatedTyping = currentTyping.includes(userId) 
            ? currentTyping 
            : [...currentTyping, userId];
        } else {
          updatedTyping = currentTyping.filter(id => id !== userId);
        }
        
        return {
          typingUsers: {
            ...state.typingUsers,
            [roomId]: updatedTyping
          }
        };
      });
      
      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          get().setUserTyping(roomId, userId, false);
        }, 3000);
      }
    },
    
    clearTypingUsers: (roomId: string) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomId]: []
        }
      }));
    },
    
    // Message reactions
    addReaction: (roomId: string, messageId: string, reaction: MessageReaction) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.map(msg => {
          if (msg.id === messageId) {
            const existingReactions = msg.reactions || [];
            return {
              ...msg,
              reactions: [...existingReactions, reaction]
            };
          }
          return msg;
        });
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    removeReaction: (roomId: string, messageId: string, reactionId: string) => {
      set((state) => {
        const roomMessages = state.messages[roomId] || [];
        const updatedMessages = roomMessages.map(msg => {
          if (msg.id === messageId) {
            const filteredReactions = (msg.reactions || []).filter(r => r.id !== reactionId);
            return {
              ...msg,
              reactions: filteredReactions
            };
          }
          return msg;
        });
        
        return {
          messages: {
            ...state.messages,
            [roomId]: updatedMessages
          }
        };
      });
    },
    
    // Room search and filtering
    searchQuery: '',
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    
    get filteredRooms() {
      const { rooms, searchQuery } = get();
      if (!searchQuery.trim()) return rooms;
      
      const query = searchQuery.toLowerCase();
      return rooms.filter(room => 
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.subject?.toLowerCase().includes(query)
      );
    },
    
    // Room creation/joining
    isJoiningRoom: false,
    setIsJoiningRoom: (joining: boolean) => set({ isJoiningRoom: joining }),
    
    joinedRooms: new Set<string>(),
    addJoinedRoom: (roomId: string) => {
      set((state) => ({
        joinedRooms: new Set([...state.joinedRooms, roomId])
      }));
    },
    
    removeJoinedRoom: (roomId: string) => {
      set((state) => {
        const newJoinedRooms = new Set(state.joinedRooms);
        newJoinedRooms.delete(roomId);
        return { joinedRooms: newJoinedRooms };
      });
    },
    
    // Message drafts
    messageDrafts: {},
    setMessageDraft: (roomId: string, draft: string) => {
      set((state) => ({
        messageDrafts: {
          ...state.messageDrafts,
          [roomId]: draft
        }
      }));
    },
    
    clearMessageDraft: (roomId: string) => {
      set((state) => {
        const newDrafts = { ...state.messageDrafts };
        delete newDrafts[roomId];
        return { messageDrafts: newDrafts };
      });
    },
    
    // Room settings
    roomSettings: {},
    updateRoomSettings: (roomId: string, settings: Partial<RoomSettings>) => {
      set((state) => ({
        roomSettings: {
          ...state.roomSettings,
          [roomId]: {
            ...defaultRoomSettings,
            ...state.roomSettings[roomId],
            ...settings
          }
        }
      }));
    },
    
    // Utility methods
    getRoomMessages: (roomId: string) => {
      return get().messages[roomId] || [];
    },
    
    getRoomParticipants: (roomId: string) => {
      return get().participants[roomId] || [];
    },
    
    getTypingUsers: (roomId: string) => {
      return get().typingUsers[roomId] || [];
    },
    
    reset: () => {
      set({
        currentRoom: null,
        rooms: [],
        messages: {},
        participants: {},
        typingUsers: {},
        searchQuery: '',
        isJoiningRoom: false,
        joinedRooms: new Set<string>(),
        messageDrafts: {},
        roomSettings: {}
      });
    }
  }))
);

/**
 * Selector hooks for optimized component re-renders
 */

// Get current room messages with memoization
export const useCurrentRoomMessages = () => {
  return useRoomStore((state) => {
    if (!state.currentRoom) return [];
    return state.getRoomMessages(state.currentRoom.id);
  });
};

// Get current room participants with online status
export const useCurrentRoomParticipants = () => {
  return useRoomStore((state) => {
    if (!state.currentRoom) return [];
    return state.getRoomParticipants(state.currentRoom.id);
  });
};

// Get typing users for current room
export const useCurrentRoomTypingUsers = () => {
  return useRoomStore((state) => {
    if (!state.currentRoom) return [];
    return state.getTypingUsers(state.currentRoom.id);
  });
};

// Get message draft for current room
export const useCurrentRoomDraft = () => {
  return useRoomStore((state) => {
    if (!state.currentRoom) return '';
    return state.messageDrafts[state.currentRoom.id] || '';
  });
};
