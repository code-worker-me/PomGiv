const { handlePing, handleSetProgress, createWindow } = require('../index.js');
const { BrowserWindow } = require('electron');

jest.mock('electron', () => {
    return {
        app: {
            whenReady: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            quit: jest.fn(),
        },
        BrowserWindow: jest.fn().mockImplementation(() => {
            return {
                loadFile: jest.fn(),
                setProgressBar: jest.fn(),
                on: jest.fn(),
            };
        }),
        ipcMain: {
            handle: jest.fn(),
            on: jest.fn(),
        },
    };
});

describe('index.js (Main Process)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('handlePing returns "pong"', () => {
        expect(handlePing()).toBe('pong');
    });

    test('handleSetProgress calls setProgressBar on mainWindow', () => {
        // We need to create the window first so mainWindow is set
        const mockWindow = createWindow();
        handleSetProgress(null, 0.5);
        expect(mockWindow.setProgressBar).toHaveBeenCalledWith(0.5);
    });

    test('createWindow creates a BrowserWindow with correct options', () => {
        createWindow();
        expect(BrowserWindow).toHaveBeenCalledWith(expect.objectContaining({
            width: 500,
            height: 750,
            webPreferences: expect.any(Object)
        }));
    });
});
