/**
 * @jest-environment jsdom
 */

const { saveDBSettings, loadDBSettings, saveDBTasks, loadDBTasks } = require('../db.js');

describe('db.js - LocalDB module', () => {
    beforeEach(() => {
        const localStorageMock = (function() {
            let store = {};
            return {
                getItem: jest.fn((key) => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                clear: jest.fn(() => { store = {}; }),
                removeItem: jest.fn((key) => { delete store[key]; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    });

    test('saveDBSettings and loadDBSettings persist settings', async () => {
        const settings = { work: 30, short: 5, long: 15, totalSessions: 4, soundDuration: 5, soundSelectVal: 'chime', soundRepeat: true };
        await saveDBSettings(settings);
        const loaded = await loadDBSettings();
        expect(loaded).toEqual(settings);
    });

    test('saveDBTasks and loadDBTasks persist tasks', async () => {
        const tasks = [{ id: '1', text: 'Task 1', completed: false, sessions: [1] }];
        await saveDBTasks(tasks);
        const loaded = await loadDBTasks();
        expect(loaded).toEqual(tasks);
    });
});
