const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store active rooms and users
const rooms = new Map();

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join room
    socket.on('join-room', ({ username, room }) => {
        if (!username || !room) {
            socket.emit('error', 'Username and room are required');
            return;
        }
        
        // Leave previous room if any
        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
            socket.to(socket.currentRoom).emit('user-left', socket.username);
            updateRoomUsers(socket.currentRoom);
        }
        
        // Join new room
        socket.join(room);
        socket.username = username;
        socket.currentRoom = room;
        
        // Initialize room if doesn't exist
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        rooms.get(room).add(username);
        
        console.log(`${username} joined room: ${room}`);
        
        // Confirm join
        socket.emit('joined-room', { room, username });
        
        // Notify others
        socket.to(room).emit('user-joined', username);
        
        // Send room info
        io.to(room).emit('room-users', Array.from(rooms.get(room)));
    });
    
    // Handle message
    socket.on('send-message', ({ room, message }) => {
        if (!socket.currentRoom || socket.currentRoom !== room) {
            socket.emit('error', 'Not in this room');
            return;
        }
        
        if (!message || message.trim() === '') return;
        
        const messageData = {
            username: socket.username,
            message: message.trim(),
            timestamp: Date.now()
        };
        
        // Broadcast to room (including sender)
        io.to(room).emit('new-message', messageData);
        
        console.log(`Message in ${room} from ${socket.username}: ${message}`);
    });
    
    // Leave room
    socket.on('leave-room', ({ room }) => {
        handleLeave(socket, room);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.currentRoom) {
            handleLeave(socket, socket.currentRoom);
        }
    });
});

function handleLeave(socket, room) {
    if (socket.currentRoom === room) {
        socket.leave(room);
        socket.to(room).emit('user-left', socket.username);
        
        // Remove from room users
        if (rooms.has(room)) {
            rooms.get(room).delete(socket.username);
            if (rooms.get(room).size === 0) {
                rooms.delete(room);
            }
        }
        
        socket.currentRoom = null;
        socket.username = null;
        
        console.log(`User left room: ${room}`);
    }
}

function updateRoomUsers(room) {
    if (rooms.has(room)) {
        io.to(room).emit('room-users', Array.from(rooms.get(room)));
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
