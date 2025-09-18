import { createContext, useContext, useState } from 'react';
import { Room, Message, User } from '@/types/api';

interface RoomContextType {
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  messages: (Message & { user: User })[];
  setMessages: (messages: (Message & { user: User })[]) => void;
  addMessage: (message: Message & { user: User }) => void;
  isTyping: { [userId: string]: boolean };
  setUserTyping: (userId: string, isTyping: boolean) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<(Message & { user: User })[]>([]);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});

  const addMessage = (message: Message & { user: User }) => {
    setMessages(prev => [...prev, message]);
  };

  const setUserTyping = (userId: string, typing: boolean) => {
    setIsTyping(prev => ({
      ...prev,
      [userId]: typing
    }));
  };

  return (
    <RoomContext.Provider value={{
      currentRoom,
      setCurrentRoom,
      messages,
      setMessages,
      addMessage,
      isTyping,
      setUserTyping
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
