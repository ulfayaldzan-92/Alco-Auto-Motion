const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { fork } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');

// Avoid Windows GPU/cache startup failures during local preview.
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow = null;
let serverProcess = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function isServerReady(port) {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${port}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(1000, () => { request.destroy(); resolve(false); });
    request.on('error', () => resolve(false));
  });
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await isServerReady(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

async function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.ico')
    : path.join(__dirname, '..', 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'ALCO Auto Motion',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged || process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 3000;
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    return;
  }

  const port = await getFreePort();
  const distDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist');
  const serverPath = path.join(distDir, 'server.cjs');
  serverProcess = fork(serverPath, [], {
    cwd: distDir,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), ELECTRON_RUN: 'true' },
  });

  if (await waitForServer(port)) {
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent('<h2>ALCO Auto Motion gagal memulai server lokal.</h2><p>Silakan tutup dan buka kembali aplikasi.</p>')}`);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') app.quit();
});
app.on('will-quit', stopServer);
