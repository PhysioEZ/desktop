// WebSocket Server Setup
// Handles real-time updates and room-based broadcasting

const { Server } = require('socket.io');

class WebSocketManager {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: true, // Allow all origins (match your CORS settings)
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle room joining
      socket.on('join:room', (room) => {
        socket.join(room);
        console.log(`📍 Socket ${socket.id} joined room: ${room}`);
      });

      // Handle room leaving
      socket.on('leave:room', (room) => {
        socket.leave(room);
        console.log(`📍 Socket ${socket.id} left room: ${room}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
      });
    });
  }

  /**
   * Broadcast update to specific branch
   */
  notifyBranch(branchId, event, data = {}) {
    if (!this.io) return;

    const room = `branch:${branchId}`;
    this.io.to(room).emit('data:update', {
      event,
      branchId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Broadcasted ${event} to ${room}`);
  }

  /**
   * Broadcast update to specific role
   */
  notifyRole(role, event, data = {}) {
    if (!this.io) return;

    const room = `role:${role}`;
    this.io.to(room).emit('role:update', {
      event,
      role,
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Broadcasted ${event} to ${room}`);
  }

  /**
   * Notify specific employee
   */
  notifyEmployee(employeeId, event, data = {}) {
    if (!this.io) return;

    const room = `employee:${employeeId}`;
    this.io.to(room).emit('data:update', {
      event,
      employeeId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Broadcasted ${event} to ${room}`);
  }

  /**
   * Broadcast to all connected clients
   */
  notifyAll(event, data = {}) {
    if (!this.io) return;

    this.io.emit('data:update', {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 Broadcasted ${event} to all clients`);
  }
}

// Export singleton instance
const wsManager = new WebSocketManager();
module.exports = wsManager;
