require('dotenv').config();
const { ipcRenderer } = require('electron');

let isDragging = false;
let startX, startY;
let lastScreenX, lastScreenY;

// Manual Drag Logic
let totalDragDistance = 0;
const DIZZY_THRESHOLD = 3000; // Pixels of movement to trigger dizziness

window.addEventListener('mousedown', (e) => {
    // Prevent dragging if clicking the close button or inputs
    if (e.target.closest('.close-chat') || e.target.closest('input')) return;

    if (e.target.closest('.aura-body')) {
        isDragging = true;
        // Initialize last positions with current functionality
        lastScreenX = e.screenX;
        lastScreenY = e.screenY;
        totalDragDistance = 0;

        ipcRenderer.send('drag-start');
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    ipcRenderer.send('drag-end');

    // ... rest of logic
    if (container.classList.contains('dizzy')) {
        setTimeout(() => {
            container.classList.remove('dizzy');
            chatBubble.innerText = "Dünya dönüyor...";
        }, 2000);
    }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        // Calculate delta based on screen coordinates difference
        const deltaX = e.screenX - lastScreenX;
        const deltaY = e.screenY - lastScreenY;

        // Update last positions for next frame
        lastScreenX = e.screenX;
        lastScreenY = e.screenY;

        // Calculate distance for dizziness
        const moveDist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)); // Using delta for dizziness calculation
        totalDragDistance += moveDist;

        if (totalDragDistance > DIZZY_THRESHOLD) {
            if (!container.classList.contains('dizzy')) {
                container.classList.add('dizzy');
                chatBubble.innerText = "Başım dönüyor! 😵";
                chatInterface.classList.remove('hidden');
            }
        }
    }
});


let isIgnoringMouse = false;

// Click-through logic with state tracking to prevent IPC flooding
window.addEventListener('mousemove', event => {
    // Only capture elements that have pointer-events: auto (which we set in CSS)
    // If pointer-events is none on body, event.target should be our interactive elements.
    // However, fast movements might still hit body.

    // Check if we are hovering over an interactive element
    const isInteractive = event.target.closest('.aura-container') ||
        event.target.closest('.chat-interface') ||
        event.target.closest('.close-chat');

    if (isInteractive) {
        if (isIgnoringMouse) {
            isIgnoringMouse = false;
            ipcRenderer.send('set-ignore-mouse-events', false);
        }
    } else {
        if (!isIgnoringMouse) {
            isIgnoringMouse = true;
            ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        }
    }
});

const container = document.querySelector('.aura-container');
const chatInterface = document.querySelector('.chat-interface');
const chatBubble = document.getElementById('pet-response');
const userInput = document.getElementById('user-input');
const closeChatBtn = document.querySelector('.close-chat');

async function getAIResponse(text) {
    try {
        // Use IPC to ask Main Process (Secure & Reliable)
        const response = await ipcRenderer.invoke('ask-ai', text);
        return response;
    } catch (error) {
        console.error("Renderer Error:", error);
        return "İletişim hatası.";
    }
}

// Close Button Logic
closeChatBtn.addEventListener('click', () => {
    chatInterface.classList.add('hidden');
});

// Double click to open chat
container.addEventListener('dblclick', () => {
    chatInterface.classList.remove('hidden');
    userInput.focus();
});



function performDance() {
    container.classList.add('dancing');
    chatBubble.innerText = "Yuppi! Dans zamanı!";

    setTimeout(() => {
        container.classList.remove('dancing');
    }, 1000);
}

// Handle Chat Input
userInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const text = userInput.value;
        if (!text.trim()) return;

        chatBubble.innerText = "Düşünüyor...";
        userInput.value = '';

        const response = await getAIResponse(text);

        // Handle Special Actions from Chat
        if (response.includes('action:dance')) {
            chatBubble.innerText = "Hadi dans edelim!";
            performDance();
            return;
        }

        if (response.includes('action:quit')) {
            try {
                window.close();
            } catch (e) { }
            return;
        }

        chatBubble.innerText = response;
    }
});

// Prevent chat from closing when clicking inside it
chatInterface.addEventListener('click', (e) => {
    e.stopPropagation();
});
