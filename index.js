const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require("electron");
const path = require("path");

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;
let tray = null;

const getAppIconPath = () => {
  const icoPath = path.join(__dirname, "assets", "favicon.ico");
  const pngPath = path.join(__dirname, "assets", "icon.png");
  if (require("fs").existsSync(icoPath)) return icoPath;
  if (require("fs").existsSync(pngPath)) return pngPath;
  return null;
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    minWidth: 420,
    minHeight: 680,
    maxWidth: 650,
    maxHeight: 950,
    show: false,
    backgroundColor: '#170d10',
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      if (mainWindow) {
        mainWindow.hide();
      }
    }
  });

  return mainWindow;
};

const createTray = () => {
  try {
    const iconPath = getAppIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    tray.setToolTip("PomGiv - Focus Timer");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Tampilkan PomGiv",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: "Mulai / Pause Timer",
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send("toggle-timer");
          }
        }
      },
      { type: "separator" },
      {
        label: "Keluar Aplikasi",
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on("double-click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.warn("Failed to create tray icon:", err);
  }
};

const handlePing = () => "pong";
const handleSetProgress = (event, progress) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setProgressBar(progress);
  }
};

if (require.main === module) {
  app.whenReady().then(() => {
    if (process.platform === "win32") {
      app.setAppUserModelId("com.AbriansyahAdam.pomgiv");
    }
    ipcMain.handle("ping", handlePing);
    ipcMain.on("set-progress", handleSetProgress);
    Menu.setApplicationMenu(null);
    createWindow();
    createTray();

    app.on("activate", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      } else if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = {
  createWindow,
  createTray,
  handlePing,
  handleSetProgress,
};
