const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Rooms ka data track karne ke liye (RAM mein)
const rooms = {}; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 1. Join Room Logic
    socket.on('join-room', ({ username, room }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        // Room data initialize karein agar naya hai
        if (!rooms[room]) {
            rooms[room] = new Set();
        }
        rooms[room].add(username);

        // Confirmation bhejyein
        socket.emit('joined-room', { room, username });

        // Sabko batayein kitne log online hain
        io.to(room).emit('update-user-count', rooms[room].size);
    });

    // 2. Message Handling
    socket.on('send-message', ({ room, message }) => {
        const timestamp = Date.now();
        io.to(room).emit('new-message', {
            username: socket.username,
            message: message,
            timestamp: timestamp
        });
    });

    // 3. Blue Tick (Mark Seen) Logic
    socket.on('mark-seen', ({ room, msgId }) => {
        // Sirf sender ke alawa baki logon ko update bhejta hai
        socket.to(room).emit('message-seen-update', msgId);
    });

    // 4. Typing Indicator
    socket.on('typing', ({ room, username, isTyping }) => {
        socket.to(room).emit('display-typing', { username, isTyping });
    });

    // 5. Disconnect / Leave Logic
    const handleLeave = () => {
        const room = socket.room;
        const username = socket.username;

        if (room && rooms[room]) {
            rooms[room].delete(username);
            
            // Agar room khali ho gaya toh memory se delete kar do (Auto-Destruct)
            if (rooms[room].size === 0) {
                delete rooms[room];
                console.log(`Room ${room} deleted (Empty)`);
            } else {
                io.to(room).emit('update-user-count', rooms[room].size);
            }
        }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
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
