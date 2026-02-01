const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const si = require('systeminformation');

let mainWindow;
let clones = [];

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 400, // Increased size to fit chat
        height: 500,
        type: 'toolbar',
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        hasShadow: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // Enforce always on top with a higher level for Windows
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Initial position
    mainWindow.setPosition(width - 450, height - 550);

    mainWindow.loadFile('index.html');
}

// Handle Click-Through Logic
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    win.setIgnoreMouseEvents(ignore, options);
});

// Handle Custom Dragging
// Custom Dragging: Polling-based to prevent "jumps" and feedback loops
let dragInterval = null;

ipcMain.on('drag-start', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    // Get start positions
    const startCursor = screen.getCursorScreenPoint();
    const winPos = win.getPosition();

    // Calculate offset: Mouse relative to Window Top-Left
    const offset = { x: startCursor.x - winPos[0], y: startCursor.y - winPos[1] };

    // Clear old interval if exists
    if (dragInterval) clearInterval(dragInterval);

    // Start polling cursor position (60 FPS)
    dragInterval = setInterval(() => {
        if (win.isDestroyed()) {
            clearInterval(dragInterval);
            return;
        }

        const cursor = screen.getCursorScreenPoint();
        const [width, height] = win.getSize();

        // Calculate raw new position
        let newX = cursor.x - offset.x;
        let newY = cursor.y - offset.y;

        // --- Bounds Checking ---
        // Use cursor position for display detection to be more intuitive
        const display = screen.getDisplayNearestPoint(cursor);
        const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;

        // Allow window to go deeper into edges (more off-screen)
        // Window is 400x500. Center content is small.
        const VISUAL_PADDING_X = 250;
        const VISUAL_PADDING_Y = 250;

        // Clamp
        if (newX < workX - VISUAL_PADDING_X) newX = workX - VISUAL_PADDING_X;
        if (newY < workY - VISUAL_PADDING_Y) newY = workY - VISUAL_PADDING_Y;

        if (newX + width > workX + workWidth + VISUAL_PADDING_X) newX = workX + workWidth + VISUAL_PADDING_X - width;
        if (newY + height > workY + workHeight + VISUAL_PADDING_Y) newY = workY + workHeight + VISUAL_PADDING_Y - height;

        // Apply
        win.setPosition(newX, newY);
    }, 16);
});

ipcMain.on('drag-end', () => {
    if (dragInterval) {
        clearInterval(dragInterval);
        dragInterval = null;
    }
});

// -- AI Handler (Moved to Main Process for reliability) --
require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

ipcMain.handle('ask-ai', async (event, text) => {
    try {
        if (!process.env.GROQ_API_KEY) return "API Anahtarı bulunamadı (.env kontrol et).";

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Sen Aura adında, masaüstünde yaşayan sevimli, eğlenceli ve biraz felsefi bir robot arkadaşsın. Çok kısa, öz ve esprili cevaplar ver (maksimum 1-2 cümle). Türkçe konuş. Kullanıcı 'dans et' derse kesinlikle sadece 'action:dance' yaz. Koruma derse sadece 'action:protect' yaz. Müzik çal veya ses oynat derse sadece 'action:play' yaz. Pomodoro veya zamanlayıcı başlat derse 'action:pomodoro' yaz. Kapat derse 'action:quit' yaz."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.3-70b-versatile", // Using a reliable model alias
        });
        return completion.choices[0]?.message?.content || "Hımm, boş geldi.";
    } catch (error) {
        console.error("Main Process AI Error:", error);
        return `Hata: ${error.message}`;
    }
});

ipcMain.on('spawn-clones', () => {
    // Clear any existing clones first
    clones.forEach(c => { if (!c.isDestroyed()) c.destroy(); });
    clones = [];

    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    // Define 3 clone positions
    const positions = [
        { x: 50, y: 50 },
        { x: width - 300, y: 50 },
        { x: 50, y: height - 350 }
    ];

    positions.forEach(pos => {
        let clone = new BrowserWindow({
            width: 250,
            height: 300,
            x: pos.x,
            y: pos.y,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        clone.setIgnoreMouseEvents(true);
        clone.loadFile('index.html', { query: { mode: 'clone' } });
        clones.push(clone);
    });
});

ipcMain.on('remove-clones', () => {
    clones.forEach(c => { if (!c.isDestroyed()) c.destroy(); });
    clones = [];
});

const { exec } = require('child_process');

ipcMain.on('system-media-control', (event, action) => {
    let keyCode;
    switch (action) {
        case 'play-pause': keyCode = 179; break; // VK_MEDIA_PLAY_PAUSE
        case 'next': keyCode = 176; break;       // VK_MEDIA_NEXT_TRACK
        case 'prev': keyCode = 177; break;       // VK_MEDIA_PREV_TRACK
        default: return;
    }

    // Improved PowerShell script to emulate media key press
    const psCommand = `(Add-Type -TypeDefinition "[DllImport('user32.dll')] public class Keyboard { [DllImport('user32.dll')] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo); }" -PassThru)::keybd_event(${keyCode}, 0, 0, 0); (Add-Type -TypeDefinition "[DllImport('user32.dll')] public class Keyboard { [DllImport('user32.dll')] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo); }" -PassThru)::keybd_event(${keyCode}, 0, 2, 0);`;

    // Alternative simpler approach if first fails
    const simpleCommand = `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys([char]${keyCode})`;

    exec(`powershell -Command "${psCommand}"`, (error) => {
        if (error) {
            console.error(`Media Control Error (${action}), trying fallback:`, error);
            // Fallback for Play/Pause specifically which SendKeys handles differently
            let fallback;
            if (action === 'play-pause') fallback = '$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys([char]179)';
            else if (action === 'next') fallback = '$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys([char]176)';
            else if (action === 'prev') fallback = '$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys([char]177)';

            if (fallback) exec(`powershell -Command "${fallback}"`);
        }
    });
});

ipcMain.on('broadcast-alert', () => {
    clones.forEach(c => {
        if (!c.isDestroyed()) {
            c.webContents.send('alert-trigger');
        }
    });
});

// System Stats Monitoring
setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            mainWindow.webContents.send('system-stats', {
                cpu: cpu.currentLoad,
                ram: (mem.active / mem.total) * 100
            });
        } catch (e) {
            console.error("Stats Error:", e);
        }
    }
}, 2000);

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
