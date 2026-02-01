require('dotenv').config();
const { ipcRenderer } = require('electron');

let isDragging = false;
let startX, startY;
let lastScreenX, lastScreenY;

// Manual Drag Logic
let totalDragDistance = 0;
const DIZZY_THRESHOLD = 3000; // Pixels of movement to trigger dizziness

// DOM Elements
const container = document.querySelector('.aura-container');
const chatInterface = document.querySelector('.chat-interface');
const chatBubble = document.getElementById('pet-response');
const userInput = document.getElementById('user-input');
const closeChatBtn = document.querySelector('.close-chat');
const securityCam = document.getElementById('security-cam');
const motionCanvas = document.getElementById('motion-canvas');
const cameraChoice = document.getElementById('camera-choice');
const cameraSelect = document.getElementById('camera-select');
const confirmCamBtn = document.getElementById('confirm-cam');
const sirenSound = document.getElementById('siren-sound');
const enableSoundCheckbox = document.getElementById('enable-sound');
const customSoundInput = document.getElementById('custom-sound');
const pomodoroTimer = document.getElementById('pomodoro-timer');
const coreGlow = document.querySelector('.core-glow');
const mediaControls = document.getElementById('media-controls');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let isSpeechEnabled = true;
let mood = 100; // 0-100
let stamina = 100; // 0-100
const MAX_VAL = 100;
const MOOD_DECAY = 0.5; // Every minute
const STAMINA_DECAY = 1; // Every minute

let soundEnabled = true;
if (enableSoundCheckbox) {
    enableSoundCheckbox.addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
    });
}

// Media Control Logic (System-Wide)
let playState = false;

if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playState = !playState;
        playPauseBtn.innerText = playState ? '⏸' : '▶';

        // Show/Hide controls based on play state
        if (playState) {
            mediaControls.classList.add('visible');
        } else {
            // Keep visible for a moment even when paused
            setTimeout(() => {
                if (!playState) mediaControls.classList.remove('visible');
            }, 5000);
        }

        ipcRenderer.send('system-media-control', 'play-pause');
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ipcRenderer.send('system-media-control', 'prev');
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ipcRenderer.send('system-media-control', 'next');
    });
}

// Show controls on hover always
container.addEventListener('mouseenter', () => {
    if (!isClone) mediaControls.classList.add('visible');
});

container.addEventListener('mouseleave', () => {
    if (!isClone && !playState) mediaControls.classList.remove('visible');
});

// System Stats Listener
ipcRenderer.on('system-stats', (event, stats) => {
    if (!coreGlow) return;

    // Pulse faster and glow redder on high load
    const load = Math.max(stats.cpu, stats.ram);
    const pulseDuration = Math.max(0.5, 2 - (load / 50)); // Fast pulse on high load
    coreGlow.style.animationDuration = `${pulseDuration}s`;

    if (load > 90) {
        container.classList.add('dizzy', 'protected');
        if (Math.random() > 0.95) chatBubble.innerText = "Sistem çok ısındı! 🚨";
    } else if (load < 90 && !isProtected) {
        container.classList.remove('dizzy', 'protected');
    }
});

// Pomodoro Logic
let pomodoroInterval = null;
let pomodoroTime = 25 * 60;

function startPomodoro() {
    if (pomodoroInterval) clearInterval(pomodoroInterval);

    pomodoroTime = 25 * 60;
    container.classList.add('focus-mode');
    pomodoroTimer.classList.add('visible');
    chatBubble.innerText = "Odaklanma zamanı! 25 dakika başlıyor. ✍️";
    chatInterface.classList.remove('hidden');

    pomodoroInterval = setInterval(() => {
        pomodoroTime--;
        const mins = Math.floor(pomodoroTime / 60);
        const secs = pomodoroTime % 60;
        pomodoroTimer.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (pomodoroTime <= 0) {
            clearInterval(pomodoroInterval);
            container.classList.remove('focus-mode');
            pomodoroTimer.classList.remove('visible');
            chatBubble.innerText = "Tebrikler! Mola vakti. ☕";
            if (soundEnabled && sirenSound) sirenSound.play().catch(e => { });
        }
    }, 1000);
}

// Handle Custom Sound Selection
if (customSoundInput) {
    customSoundInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && sirenSound) {
            const reader = new FileReader();
            reader.onload = (event) => {
                sirenSound.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Check if this window is a clone
const urlParams = new URLSearchParams(window.location.search);
const isClone = urlParams.get('mode') === 'clone';

if (isClone) {
    // Clones are always in 'protected' visual state
    if (container) container.classList.add('protected');
    // Hide chat for clones
    if (chatInterface) chatInterface.style.display = 'none';

    // Listen for alert trigger from main window
    ipcRenderer.on('alert-trigger', () => {
        triggerAlert(true); // true means don't broadcast back
    });
}

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


// Mood & Stamina Decay logic
setInterval(() => {
    mood = Math.max(0, mood - MOOD_DECAY);
    stamina = Math.max(0, stamina - STAMINA_DECAY);
    updateAuraState();
}, 60000); // Check every minute

function updateAuraState() {
    if (mood < 30) {
        container.style.filter = 'grayscale(0.5) brightness(0.8)';
        if (Math.random() > 0.98) chatBubble.innerText = "Biraz yalnız hissediyorum... 🥺";
    } else if (stamina < 20) {
        container.classList.add('dizzy');
        if (Math.random() > 0.98) chatBubble.innerText = "Çok uykum geldi... 💤";
    } else {
        container.style.filter = 'none';
        if (!isProtected) container.classList.remove('dizzy');
    }
}

// Click to pet (Increase mood)
container.addEventListener('click', () => {
    if (isDragging) return;
    mood = Math.min(MAX_VAL, mood + 5);
    stamina = Math.min(MAX_VAL, stamina + 2);
    performJump();
});

function performJump() {
    container.style.transform = `translateY(-20px)`;
    setTimeout(() => {
        container.style.transform = `translateY(0px)`;
    }, 200)
}

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

const motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true });

// Protection Mode State
let isProtected = false;
let videoStream = null;
let lastFrame = null;
let motionInterval = null;

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

async function toggleProtection() {
    if (isProtected) {
        stopProtection();
    } else {
        // Show camera selection UI
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                chatBubble.innerText = "Kamera bulunamadı!";
                return;
            }

            cameraSelect.innerHTML = '';
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Kamera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
            });

            cameraChoice.style.display = 'block';
            userInput.parentElement.style.display = 'none'; // Hide input area while choosing
            chatBubble.innerText = "Hangi kamerayı kullanayım?";
        } catch (err) {
            console.error("Cihaz listeleme hatası:", err);
            chatBubble.innerText = "Kamera listesi alınamadı.";
        }
    }
}

confirmCamBtn.addEventListener('click', async () => {
    const camDeviceId = cameraSelect.value;

    cameraChoice.style.display = 'none';
    userInput.parentElement.style.display = 'block';

    // Start Camera Protection
    await startProtection(camDeviceId);
});

async function startProtection(deviceId) {
    try {
        const constraints = {
            video: { deviceId: deviceId ? { exact: deviceId } : undefined }
        };
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        securityCam.srcObject = videoStream;
        isProtected = true;
        container.classList.add('protected');
        chatBubble.innerText = "KORUMA MODU AKTİF! 🚨 Klonlar savunmaya geçti.";

        ipcRenderer.send('spawn-clones');
        motionInterval = setInterval(detectMotion, 500);
    } catch (err) {
        console.error("Kamera erişimi hatası:", err);
        chatBubble.innerText = "Kamera erişimi sağlanamadı!";
    }
}

function stopProtection() {
    isProtected = false;
    container.classList.remove('protected');
    chatBubble.innerText = "Koruma modu devre dışı. Klonlar geri çekildi.";

    ipcRenderer.send('remove-clones');

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    clearInterval(motionInterval);
    lastFrame = null;
}

function detectMotion() {
    if (!isProtected) return;

    motionCtx.drawImage(securityCam, 0, 0, motionCanvas.width, motionCanvas.height);
    const currentFrame = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);

    if (lastFrame) {
        let diff = 0;
        for (let i = 0; i < currentFrame.data.length; i += 4) {
            // Check R, G, B difference
            diff += Math.abs(currentFrame.data[i] - lastFrame.data[i]);
            diff += Math.abs(currentFrame.data[i + 1] - lastFrame.data[i + 1]);
            diff += Math.abs(currentFrame.data[i + 2] - lastFrame.data[i + 2]);
        }

        const sensitivity = 50000; // Adjust based on testing
        if (diff > sensitivity) {
            triggerAlert();
        }
    }
    lastFrame = currentFrame;
}

const alertMessages = [
    "SİSTEMDEN UZAKLAŞ! 🚨",
    "SENİ GÖRÜYORUM! 👀",
    "YETKİSİZ ERİŞİM! 🤖",
    "GÜVENLİK İHLALİ ALGILANDI! 🛑",
    "LÜTFEN GERİ ÇEKİLİN! ⚠️"
];

function triggerAlert(isFromBroadcast = false) {
    if (!container) return;
    container.classList.add('dizzy'); // Shake effect

    // Only main window broadcasts and plays sound
    if (!isClone && !isFromBroadcast) {
        ipcRenderer.send('broadcast-alert');
        const msg = alertMessages[Math.floor(Math.random() * alertMessages.length)];
        chatBubble.innerText = msg;
        chatInterface.classList.remove('hidden');

        if (soundEnabled && sirenSound) {
            // High-pitched siren sound logic
            sirenSound.currentTime = 0;
            sirenSound.volume = 1.0;
            sirenSound.play().catch(e => console.error("Ses çalma hatası:", e));
        }
    }

    setTimeout(() => {
        if (isProtected || isClone) container.classList.remove('dizzy');
    }, 1000);
}

async function processMessage(text) {
    if (!text.trim()) return;

    chatBubble.innerText = "Düşünüyor...";
    chatInterface.classList.remove('hidden');

    const response = await getAIResponse(text);

    if (response.includes('action:protect')) {
        chatBubble.innerText = "Koruma modu devreye giriyor! 🛡️";
        speak("Koruma modu aktif ediliyor.");
        toggleProtection();
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:dance')) {
        speak("Hadi biraz dans edelim!");
        chatBubble.innerText = "Hadi dans edelim!";
        performDance();
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:quit')) {
        speak("Görüşürüz, kendine iyi bak!");
        container.classList.add('closing'); // Gözlerini kapatsın
        setTimeout(() => {
            try { window.close(); } catch (e) { }
        }, 2000);
        return;
    }

    if (response.includes('action:play')) {
        chatBubble.innerText = "Medya kontrol ediliyor... 🎵";
        ipcRenderer.send('system-media-control', 'play-pause');
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:pomodoro')) {
        chatBubble.innerText = "Odaklanma modu başlıyor! ⏳";
        speak("Odaklanma zamanı başlıyor, 25 dakika sonra görüşürüz.");
        startPomodoro();
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:speech_on')) {
        isSpeechEnabled = true;
        chatBubble.innerText = "Sesli konuşma açıldı! 🎙️";
        speak("Sesli konuşma açıldı.");
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:speech_off')) {
        speak("Sesli konuşma kapatılıyor.");
        isSpeechEnabled = false;
        chatBubble.innerText = "Sesli konuşma kapatıldı. 🔇";
        setTimeout(() => { chatInterface.classList.add('hidden'); }, 3000);
        return;
    }

    if (response.includes('action:launch:')) {
        // En sondaki komutu güvenli bir şekilde al
        const parts = response.split('action:launch:');
        const cmd = parts[parts.length - 1].trim();

        chatBubble.innerText = "İstediğin komutu çalıştırıyorum... 🚀";
        speak("Hemen hallediyorum.");
        ipcRenderer.send('launch-app', cmd);

        // Aksiyondan sonra sohbeti kapat
        setTimeout(() => {
            chatInterface.classList.add('hidden');
        }, 3000);
        return;
    }

    if (response.includes('action:mood_status')) {
        const status = `Ruh halim: %${Math.floor(mood)}, Enerjim: %${Math.floor(stamina)}.`;
        chatBubble.innerText = status;
        speak(status);
        return;
    }

    // Ekranda gösterilecek yanıtı temizle (action: kısmını gizle)
    const displayResponse = response.replace(/action:\S+/g, '').trim();
    if (displayResponse) {
        chatBubble.innerText = displayResponse;
    } else {
        // Eğer yanıt sadece aksiyondan ibaretse bubble'ı gizleme veya varsayılan mesaj yaz
        // (Zaten aksiyonlar kendi mesajlarını set ediyor yukarıda)
    }
    speak(response);
}

function speak(text) {
    if (!isSpeechEnabled) return;
    // Önceki konuşmayı durdur
    window.speechSynthesis.cancel();

    // Sesi temizle (action: komutlarını okumasın)
    const cleanText = text.replace(/action:\w+/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.1;
    utterance.pitch = 1.2; // Biraz daha sevimli/robotik bir ses için

    // Türkçe ses bulmaya çalış
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find(v => v.lang.includes('tr'));
    if (trVoice) utterance.voice = trVoice;

    window.speechSynthesis.speak(utterance);
}

// Handle Chat Input
userInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const text = userInput.value;
        userInput.value = '';
        await processMessage(text);
    }
});

// Handle Voice Commands from Main Process
ipcRenderer.on('voice-command', async (event, command) => {
    console.log("Renderer sesli komut işliyor:", command);
    await processMessage(command);
});

// Handle Multiple App Matches
ipcRenderer.on('multiple-apps-found', (event, matches) => {
    chatBubble.innerText = "Birden fazla seçenek buldum, hangisini açayım? 🤔";

    const listContainer = document.createElement('div');
    listContainer.style.marginTop = '10px';
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '5px';

    matches.slice(0, 5).forEach(fullPath => {
        const fileName = fullPath.split('\\').pop();
        const btn = document.createElement('button');
        btn.innerText = fileName;
        btn.title = fullPath;
        btn.style.padding = '5px';
        btn.style.fontSize = '12px';
        btn.style.background = 'rgba(0, 255, 255, 0.1)';
        btn.style.border = '1px solid var(--primary-glow)';
        btn.style.color = 'white';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '5px';

        btn.onclick = () => {
            ipcRenderer.send('launch-app', fullPath);
            chatBubble.innerText = `${fileName} başlatılıyor!`;
            listContainer.remove();
            setTimeout(() => { chatInterface.classList.add('hidden'); }, 2000);
        };
        listContainer.appendChild(btn);
    });

    chatBubble.appendChild(listContainer);
    chatInterface.classList.remove('hidden');
    speak("Birden fazla seçenek buldum, listeden seçebilir misin?");
});

ipcRenderer.on('app-launch-failed', (event, appName) => {
    chatBubble.innerText = `'${appName}' uygulamasını hiçbir yerde bulamadım. 😔`;
    speak("Maalesef bu uygulamayı bilgisayarında bulamadım.");
});

// Prevent chat from closing when clicking inside it
chatInterface.addEventListener('click', (e) => {
    e.stopPropagation();
});
