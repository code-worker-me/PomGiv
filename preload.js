const { contextBridge, ipcRenderer } = require('electron');

const versions = {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping'),
    setProgressBar: (progress) => ipcRenderer.send('set-progress', progress),
    onToggleTimer: (callback) => ipcRenderer.on('toggle-timer', callback)
};

if (process.env.NODE_ENV !== 'test') {
    contextBridge.exposeInMainWorld('versions', versions);
}

if (typeof module !== 'undefined') {
    module.exports = versions;
}