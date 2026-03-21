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

// Connection status
socket.on('connect', () => {
    statusDiv.textContent = 'Connected to server';
    statusDiv.className = 'status connected';
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Disconnected from server';
    statusDiv.className = 'status error';
});

// Login handle
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();
    if (!username || !room) return;
    
    currentUser = username;
    currentRoom = room;
    
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    socket.emit('join-room', { username, room });
});

// Join confirmation
socket.on('joined-room', ({ room, username }) => {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    displayRoom.textContent = room;
    displayUsername.textContent = username;
    
    // नए रूम में घुसते ही पुरानी चैट साफ़
    messagesDiv.innerHTML = '';
    addSystemMessage(`Welcome to room "${room}"`);
});

socket.on('user-joined', (username) => {
    addSystemMessage(`${username} joined the room`);
});

socket.on('user-left', (username) => {
    addSystemMessage(`${username} left the room`);
});

// --- फीचर: 60 सेकंड में मैसेज डिलीट ---
socket.on('new-message', ({ username, message, timestamp }) => {
    const isOwn = username === currentUser;
    const msgElement = addMessage(username, message, isOwn, timestamp);
    
    // 60 सेकंड का टाइमर
    setTimeout(() => {
        if (msgElement) {
            msgElement.style.opacity = '0';
            setTimeout(() => msgElement.remove(), 500); 
        }
    }, 60000); 
});

socket.on('error', (message) => {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    statusDiv.textContent = message;
    statusDiv.className = 'status error';
});

// Message sending logic
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

// --- फीचर: बटन या रिफ्रेश पर सब साफ़ करना ---
function cleanupAndLeave() {
    if (currentRoom) {
        socket.emit('leave-room', { room: currentRoom });
    }
    messagesDiv.innerHTML = ''; // चैट बॉक्स खाली
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    usernameInput.value = '';
    roomInput.value = '';
    currentUser = '';
    currentRoom = '';
}

leaveBtn.addEventListener('click', cleanupAndLeave);

// पेज रिफ्रेश या बंद होने पर सुरक्षा
window.addEventListener('beforeunload', cleanupAndLeave);

// Helper functions
function addMessage(username, message, isOwn, timestamp) {
    const div = document.createElement('div');
    div.className = `message ${isOwn ? 'own' : 'other'}`;
    div.style.transition = 'opacity 0.5s ease-out';
    
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    
    div.innerHTML = `
        <div class="meta">${username} • ${time}</div>
        <div>${escapeHtml(message)}</div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
    return div;
}

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system';
    div.textContent = text;
    messagesDiv.appendChild(div);
    scrollToBottom();
    // सिस्टम मैसेज 5 सेकंड में हटा दें
    setTimeout(() => div.remove(), 5000);
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
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
