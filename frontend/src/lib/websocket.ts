// WebSocket Service for Real-time Updates
// Handles Socket.IO connection and event-based cache invalidation

import { io, Socket } from 'socket.io-client';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type UpdateEvent = 
  | 'registration:created'
  | 'registration:updated'
  | 'registration:deleted'
  | 'test:created'
  | 'test:updated'
  | 'test:deleted'
  | 'patient:updated'
  | 'inquiry:created'
  | 'inquiry:updated'
  | 'payment:created'
  | 'approval:pending'
  | 'approval:resolved'
  | 'notification:new'
  | 'schedule:updated';

interface UpdatePayload {
  event: UpdateEvent;
  branchId?: number;
  employeeId?: number;
  targetId?: number;
  role?: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private queryClient: QueryClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  connect(url: string, queryClient: QueryClient, authToken?: string) {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.queryClient = queryClient;

    this.socket = io(url, {
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
    });

    // Listen for data update events
    this.socket.on('data:update', (payload: UpdatePayload) => {
      this.handleDataUpdate(payload);
    });

    // Role-specific events
    this.socket.on('role:update', (payload: UpdatePayload) => {
      this.handleDataUpdate(payload);
    });
  }

  /**
   * Handle incoming update events and invalidate relevant queries
   */
  private handleDataUpdate(payload: UpdatePayload) {
    if (!this.queryClient) return;

    console.log('📡 Received update:', payload.event);

    const { event, branchId } = payload;

    // Invalidate queries based on event type
    switch (event) {
      case 'registration:created':
      case 'registration:updated':
      case 'registration:deleted':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.registrations.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.schedule.byBranch(branchId) 
          });
        }
        break;

      case 'test:created':
      case 'test:updated':
      case 'test:deleted':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.tests.byBranch(branchId) 
          });
        }
        break;

      case 'patient:updated':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.patients.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
        }
        break;

      case 'inquiry:created':
      case 'inquiry:updated':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.inquiries.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
        }
        break;

      case 'payment:created':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.collections.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.billing.byBranch(branchId) 
          });
        }
        break;

      case 'approval:pending':
      case 'approval:resolved':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.approvals.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.dashboard.byBranch(branchId) 
          });
        }
        break;

      case 'notification:new':
        if (payload.employeeId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.notifications.byEmployee(payload.employeeId) 
          });
        }
        break;

      case 'schedule:updated':
        if (branchId) {
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.schedule.byBranch(branchId) 
          });
          this.queryClient.invalidateQueries({ 
            queryKey: queryKeys.slots.all 
          });
        }
        break;

      default:
        console.warn('Unknown event type:', event);
    }
  }

  /**
   * Join a room (e.g., branch-specific or role-specific)
   */
  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join:room', room);
      console.log(`📍 Joined room: ${room}`);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave:room', room);
      console.log(`📍 Left room: ${room}`);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.queryClient = null;
      this.isConnecting = false;
      console.log('WebSocket disconnected manually');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance (for custom events)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
