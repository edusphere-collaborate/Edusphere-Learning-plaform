// This file provides client-side utilities for AI interactions
// All actual OpenAI API calls are handled on the server for security

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIContext {
  roomId?: string;
  roomName?: string;
  subject?: string;
  recentMessages?: string[];
}

export const formatAIContext = (context: AIContext): string => {
  const parts = [];
  
  if (context.roomName && context.subject) {
    parts.push(`Discussion room: ${context.roomName} (${context.subject})`);
  }
  
  if (context.recentMessages && context.recentMessages.length > 0) {
    parts.push(`Recent discussion:\n${context.recentMessages.join('\n')}`);
  }
  
  return parts.join('\n\n');
};

export const generateAIPrompt = (userInput: string, context?: AIContext): string => {
  if (!context) return userInput;
  
  const contextStr = formatAIContext(context);
  if (!contextStr) return userInput;
  
  return `${userInput}\n\nContext:\n${contextStr}`;
};
