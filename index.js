const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    minWidth: 420,
    minHeight: 680,
    maxWidth: 650,
    maxHeight: 950,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
  return mainWindow;
};

const handlePing = () => "pong";
const handleSetProgress = (event, progress) => {
  if (mainWindow) {
    mainWindow.setProgressBar(progress);
  }
};

if (require.main === module) {
  app.whenReady().then(() => {
    ipcMain.handle("ping", handlePing);
    ipcMain.on("set-progress", handleSetProgress);
    Menu.setApplicationMenu(null);
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = {
  createWindow,
  handlePing,
  handleSetProgress,
};
