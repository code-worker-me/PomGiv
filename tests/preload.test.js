const { ipcRenderer } = require('electron');
const versions = require('../preload.js');

jest.mock('electron', () => ({
    contextBridge: {
        exposeInMainWorld: jest.fn(),
    },
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
    },
}));

describe('preload.js', () => {
    beforeAll(() => {
        // Mock process.versions
        Object.defineProperty(process, 'versions', {
            value: {
                node: '16.0.0',
                chrome: '91.0.0',
                electron: '13.0.0',
            },
        });
    });

    test('node() returns process.versions.node', () => {
        expect(versions.node()).toBe('16.0.0');
    });

    test('chrome() returns process.versions.chrome', () => {
        expect(versions.chrome()).toBe('91.0.0');
    });

    test('electron() returns process.versions.electron', () => {
        expect(versions.electron()).toBe('13.0.0');
    });

    test('ping() calls ipcRenderer.invoke("ping")', () => {
        versions.ping();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('ping');
    });

    test('setProgressBar() calls ipcRenderer.send("set-progress", progress)', () => {
        versions.setProgressBar(0.5);
        expect(ipcRenderer.send).toHaveBeenCalledWith('set-progress', 0.5);
    });
});
