const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');
const { spawn, exec } = require('child_process');

let mainWindow;
let clones = [];

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 400,
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

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setPosition(width - 450, height - 550);
    mainWindow.loadFile('index.html');
}

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    win.setIgnoreMouseEvents(ignore, options);
});

let dragInterval = null;
ipcMain.on('drag-start', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    const startCursor = screen.getCursorScreenPoint();
    const winPos = win.getPosition();
    const offset = { x: startCursor.x - winPos[0], y: startCursor.y - winPos[1] };

    if (dragInterval) clearInterval(dragInterval);

    dragInterval = setInterval(() => {
        if (win.isDestroyed()) {
            clearInterval(dragInterval);
            return;
        }

        const cursor = screen.getCursorScreenPoint();
        const [width, height] = win.getSize();
        const display = screen.getDisplayNearestPoint(cursor);
        const { x: workX, y: workY, width: workWidth, height: workHeight } = display.workArea;

        const VISUAL_PADDING_X = 250;
        const VISUAL_PADDING_Y = 250;

        let newX = cursor.x - offset.x;
        let newY = cursor.y - offset.y;

        if (newX < workX - VISUAL_PADDING_X) newX = workX - VISUAL_PADDING_X;
        if (newY < workY - VISUAL_PADDING_Y) newY = workY - VISUAL_PADDING_Y;
        if (newX + width > workX + workWidth + VISUAL_PADDING_X) newX = workX + workWidth + VISUAL_PADDING_X - width;
        if (newY + height > workY + workHeight + VISUAL_PADDING_Y) newY = workY + workHeight + VISUAL_PADDING_Y - height;

        win.setPosition(newX, newY);
    }, 16);
});

ipcMain.on('drag-end', () => {
    if (dragInterval) {
        clearInterval(dragInterval);
        dragInterval = null;
    }
});

require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const APP_PATHS = [
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    path.join(process.env.LOCALAPPDATA || '', 'Programs'),
    path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
    'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
];

async function findAppExecutables(appName) {
    const results = [];
    const searchName = appName.toLowerCase();

    for (const baseDir of APP_PATHS) {
        if (!fs.existsSync(baseDir)) continue;
        try {
            const files = await searchInDirectory(baseDir, searchName);
            results.push(...files);
        } catch (e) { }
    }
    return [...new Set(results)].filter(f => f.endsWith('.exe'));
}

async function searchInDirectory(dir, query, depth = 0) {
    if (depth > 2) return [];
    let matches = [];
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                matches.push(...await searchInDirectory(fullPath, query, depth + 1));
            } else if (item.isFile() && item.name.toLowerCase().includes(query) && item.name.endsWith('.exe')) {
                matches.push(fullPath);
            }
        }
    } catch (e) { }
    return matches;
}

// Check if a command exists in system PATH (to avoid Windows error popup)
function commandExistsInPath(cmd) {
    return new Promise((resolve) => {
        exec(`where "${cmd}"`, (err) => {
            resolve(!err);
        });
    });
}

ipcMain.on('launch-app', async (event, appCommand) => {
    if (!appCommand || !appCommand.trim()) return;

    let cmd = appCommand.trim();

    // 1. URL Check (Handles 'start https://...' or just 'https://...')
    if (cmd.startsWith('http') || cmd.startsWith('www') || cmd.startsWith('start http')) {
        let url = cmd.replace('start ', '').trim();
        url = url.startsWith('www') ? 'https://' + url : url;
        console.log(`URL açılıyor: ${url}`);
        shell.openExternal(url);
        return;
    }

    // 2. Absolute Path Check
    if (fs.existsSync(cmd) && cmd.includes('\\')) {
        exec(`"${cmd}"`);
        return;
    }

    // 3. System PATH Check (To avoid the "Windows cannot find..." popup)
    const exists = await commandExistsInPath(cmd);
    if (exists) {
        exec(`start "" "${cmd}"`);
        return;
    }

    // 4. Deep Search (If not in path and not a direct file)
    console.log(`Komut sistemde bulunamadı, derin arama yapılıyor: ${cmd}`);
    const matches = await findAppExecutables(cmd);

    if (matches.length === 1) {
        exec(`"${matches[0]}"`);
    } else if (matches.length > 1) {
        event.sender.send('multiple-apps-found', matches);
    } else {
        event.sender.send('app-launch-failed', cmd);
    }
});

ipcMain.handle('ask-ai', async (event, text) => {
    try {
        if (!process.env.GROQ_API_KEY) return "API Anahtarı bulunamadı (.env kontrol et).";

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Sen Aura'sın, sevimli bir masaüstü robotusun. 
                    - SADECE kullanıcı senden bir şey yapmanı isterse şu komutları kullan:
                      'action:dance', 'action:protect', 'action:play', 'action:pomodoro', 'action:launch:KOMUT'
                    - HAVA DURUMU/WEB ARAMASI: Eğer kullanıcı hava durumunu veya bir şeyi aramanı isterse 'action:launch:https://www.google.com/search?q=TERİM' komutunu kullan.
                    - KURAL: Aksiyonu sadece eylem istendiğinde, mesajın EN SONUNA ekle.`
                },
                { role: "user", content: text }
            ],
            model: "llama-3.3-70b-versatile",
        });
        return completion.choices[0]?.message?.content || "Anlayamadım.";
    } catch (error) {
        console.error("Main Process AI Error:", error);
        return `Hata: ${error.message}`;
    }
});

ipcMain.on('spawn-clones', () => {
    clones.forEach(c => { if (!c.isDestroyed()) c.destroy(); });
    clones = [];
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;
    const positions = [{ x: 50, y: 50 }, { x: width - 300, y: 50 }, { x: 50, y: height - 350 }];

    positions.forEach(pos => {
        let clone = new BrowserWindow({
            width: 250, height: 300, x: pos.x, y: pos.y, frame: false, transparent: true,
            alwaysOnTop: true, resizable: false, skipTaskbar: true,
            webPreferences: { nodeIntegration: true, contextIsolation: false }
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

ipcMain.on('system-media-control', (event, action) => {
    let keyCode;
    switch (action) {
        case 'play-pause': keyCode = 179; break;
        case 'next': keyCode = 176; break;
        case 'prev': keyCode = 177; break;
        default: return;
    }
    const command = `powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]${keyCode})"`;
    exec(command);
});

ipcMain.on('broadcast-alert', () => {
    clones.forEach(c => { if (!c.isDestroyed()) c.webContents.send('alert-trigger'); });
});

setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            if (mainWindow.webContents) {
                mainWindow.webContents.send('system-stats', {
                    cpu: cpu.currentLoad,
                    ram: (mem.active / mem.total) * 100
                });
            }
        } catch (e) { }
    }
}, 2000);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
