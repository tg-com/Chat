const socket = io();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('room-ip');
const statusDiv = document.getElementById('status');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const displayRoom = document.getElementById('display-room');
const displayUsername = document.getElementById('display-username');
const leaveBtn = document.getElementById('leave-btn');

let currentUser = '';
let currentRoom = '';

// Check connection status
socket.on('connect', () => {
    statusDiv.textContent = 'Connected to server';
    statusDiv.className = 'status connected';
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Disconnected from server';
    statusDiv.className = 'status error';
});

// Handle login form
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();
    
    if (!username || !room) return;
    
    currentUser = username;
    currentRoom = room;
    
    // Show loader
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    
    // Emit join room event
    socket.emit('join-room', { username, room });
});

// Handle join confirmation
socket.on('joined-room', ({ room, username }) => {
    // Hide loader
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    
    // Switch screens
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    
    // Update display
    displayRoom.textContent = room;
    displayUsername.textContent = username;
    
    // Clear messages
    messagesDiv.innerHTML = '';
    
    // Add system message
    addSystemMessage(`Welcome to room "${room}"`);
});

// Handle user joined
socket.on('user-joined', (username) => {
    addSystemMessage(`${username} joined the room`);
});

// Handle user left
socket.on('user-left', (username) => {
    addSystemMessage(`${username} left the room`);
});

// Handle new message
socket.on('new-message', ({ username, message, timestamp }) => {
    addMessage(username, message, username === currentUser, timestamp);
});

// Handle error
socket.on('error', (message) => {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    statusDiv.textContent = message;
    statusDiv.className = 'status error';
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    socket.emit('send-message', { room: currentRoom, message });
    messageInput.value = '';
    messageInput.focus();
}

// Leave room
leaveBtn.addEventListener('click', () => {
    socket.emit('leave-room', { room: currentRoom });
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    usernameInput.value = '';
    roomInput.value = '';
    currentUser = '';
    currentRoom = '';
});

// Helper functions
function addMessage(username, message, isOwn, timestamp) {
    const div = document.createElement('div');
    div.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    div.innerHTML = `
        <div class="meta">${username} • ${time}</div>
        <div>${escapeHtml(message)}</div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system';
    div.textContent = text;
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
