// Firebase SDKs को Import करें (CDN का उपयोग करके)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// आपका Firebase कॉन्फ़िगरेशन
const firebaseConfig = {
  apiKey: "AIzaSyAC2NpHaaN8jTQg5G4GaISy76rnYSOGIqs",
  authDomain: "my-chat-77ef9.firebaseapp.com",
  databaseURL: "https://my-chat-77ef9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-chat-77ef9",
  storageBucket: "my-chat-77ef9.firebasestorage.app",
  messagingSenderId: "201184055478",
  appId: "1:201184055478:web:98e67e97e0b6c1f80ed617",
  measurementId: "G-FQ37QH3P6G"
};

// Firebase को Initialize करें
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

// HTML Elements को पकड़ें
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesDisplay = document.getElementById('messages-display');

// 1. मैसेज भेजने का फंक्शन
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== "") {
        push(messagesRef, {
            username: "User_" + Math.floor(Math.random() * 100), // रैंडम नाम
            message: text,
            timestamp: serverTimestamp()
        });
        messageInput.value = ""; // इनपुट बॉक्स खाली करें
    }
}

// बटन क्लिक और Enter की पर इवेंट लगायें
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// 2. रीयलटाइम में मैसेज प्राप्त करने का फंक्शन
onChildAdded(messagesRef, (data) => {
    const msgData = data.val();
    const msgId = data.key;

    // स्क्रीन पर मैसेज दिखाएँ
    const div = document.createElement('div');
    div.id = msgId;
    div.style.padding = "5px";
    div.innerHTML = `<strong>${msgData.username}:</strong> ${msgData.message}`;
    messagesDisplay.appendChild(div);

    // ऑटो स्क्रॉल नीचे करें
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;

    // 3. 60 सेकंड बाद मैसेज डिलीट करने का लॉजिक (जैसा आपके पिछले कोड में था)
    setTimeout(() => {
        remove(ref(db, `messages/${msgId}`)); // डेटाबेस से डिलीट
        div.remove(); // स्क्रीन से डिलीट
    }, 60000);
});
