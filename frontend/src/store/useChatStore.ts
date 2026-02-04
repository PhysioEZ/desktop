import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  unread_count: number;
}

export interface ChatMessage {
  message_id: number;
  sender_employee_id: number;
  message_type: string;
  message_text: string;
  created_at: string;
  is_read: number;
  is_sender: boolean;
}

interface ChatStore {
  cachedUsers: ChatUser[];
  usersLastFetched: number;
  messagesCache: Record<number, { data: ChatMessage[]; lastFetched: number }>;
  
  setCachedUsers: (users: ChatUser[]) => void;
  setCachedMessages: (partnerId: number, messages: ChatMessage[]) => void;
  clearChatCache: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      cachedUsers: [],
      usersLastFetched: 0,
      messagesCache: {},

      setCachedUsers: (users) => 
        set({ cachedUsers: users, usersLastFetched: Date.now() }),
        
      setCachedMessages: (partnerId, messages) =>
        set((state) => ({
          messagesCache: {
            ...state.messagesCache,
            [partnerId]: { data: messages, lastFetched: Date.now() },
          },
        })),
        
      clearChatCache: () => 
        set({ cachedUsers: [], usersLastFetched: 0, messagesCache: {} }),
    }),
    {
      name: "chat-store-cache",
    }
  )
);
