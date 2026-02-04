// Custom Hook for WebSocket Integration
// Manages WebSocket lifecycle and room subscriptions

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsService } from '../lib/websocket';
import { API_BASE_URL } from '../config';

interface UseWebSocketOptions {
  enabled?: boolean;
  branchId?: number;
  employeeId?: number;
  role?: string;
  authToken?: string;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    enabled = true,
    branchId,
    employeeId,
    role,
    authToken,
  } = options;

  const queryClient = useQueryClient();
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!enabled || !branchId || !employeeId) {
      return;
    }

    // Connect to WebSocket server (only once)
    if (!hasConnected.current) {
      const wsUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
      wsService.connect(wsUrl, queryClient, authToken);
      hasConnected.current = true;
    }

    // Join branch-specific room
    const branchRoom = `branch:${branchId}`;
    wsService.joinRoom(branchRoom);

    // Join role-specific room if role is provided
    if (role) {
      const roleRoom = `role:${role}`;
      wsService.joinRoom(roleRoom);
    }

    // Join employee-specific room for notifications
    const employeeRoom = `employee:${employeeId}`;
    wsService.joinRoom(employeeRoom);

    // Cleanup: leave rooms on unmount
    return () => {
      wsService.leaveRoom(branchRoom);
      if (role) {
        wsService.leaveRoom(`role:${role}`);
      }
      wsService.leaveRoom(employeeRoom);
    };
  }, [enabled, branchId, employeeId, role, authToken, queryClient]);

  // Disconnect on component unmount (app-level)
  useEffect(() => {
    return () => {
      if (hasConnected.current) {
        wsService.disconnect();
        hasConnected.current = false;
      }
    };
  }, []);

  return {
    isConnected: wsService.isConnected(),
    socket: wsService.getSocket(),
  };
}
