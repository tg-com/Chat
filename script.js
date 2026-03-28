const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Store rooms and their messages with timers
const rooms = new Map(); // roomName -> { messages: Map<msgId, timer> }

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', ({ username, room }) => {
    socket.join(room);
    socket.data = { username, room };

    // Notify others
    socket.to(room).emit('user-joined', username);

    // Send existing messages? (optional, not implemented for simplicity)
    socket.emit('joined-room', { room, username });
  });

  socket.on('send-message', ({ room, message }) => {
    const { username } = socket.data;
    const msgId = Date.now() + '-' + Math.random(); // unique ID
    const timestamp = Date.now();
    const msgData = {
      id: msgId,
      username,
      message,
      timestamp,
    };

    // Broadcast to everyone in the room
    io.to(room).emit('new-message', msgData);

    // Set 60‑second auto‑delete
    const timer = setTimeout(() => {
      io.to(room).emit('delete-message', msgId);
      // Clean up from our internal storage
      if (rooms.has(room)) {
        rooms.get(room).messages.delete(msgId);
      }
    }, 60000);

    // Store timer to allow cleanup on disconnect
    if (!rooms.has(room)) {
      rooms.set(room, { messages: new Map() });
    }
    rooms.get(room).messages.set(msgId, timer);
  });

  socket.on('leave-room', ({ room }) => {
    const { username } = socket.data;
    socket.leave(room);
    socket.to(room).emit('user-left', username);
    // Optionally clear all timers for this user's messages? Not implemented here.
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const { username, room } = socket.data || {};
    if (username && room) {
      socket.to(room).emit('user-left', username);
    }
    // Timers are not cleared automatically; messages remain in memory.
    // For simplicity we ignore cleaning them – they'll be cleared when the room is empty.
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
