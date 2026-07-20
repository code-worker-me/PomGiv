/**
 * @jest-environment jsdom
 */

const { saveDBSettings, loadDBSettings, saveDBTasks, loadDBTasks, saveDBAnalytics, loadDBAnalytics, loadDBAnalyticsHistory } = require('../db.js');

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

    test('saveDBAnalytics and loadDBAnalytics persist daily analytics', async () => {
        const analyticsData = {
            date: '2026-07-20',
            totalFocusSeconds: 1500,
            completedSessions: 2,
            completedTasks: 3,
            hourlyFocusSeconds: { 10: 900, 11: 600 }
        };
        await saveDBAnalytics(analyticsData);
        const loaded = await loadDBAnalytics('2026-07-20');
        expect(loaded).toEqual(analyticsData);
    });

    test('loadDBAnalyticsHistory returns analytics history', async () => {
        const analytics1 = { date: '2026-07-19', totalFocusSeconds: 3000, completedSessions: 4, completedTasks: 2 };
        const analytics2 = { date: '2026-07-20', totalFocusSeconds: 1500, completedSessions: 2, completedTasks: 3 };
        await saveDBAnalytics(analytics1);
        await saveDBAnalytics(analytics2);

        const history = await loadDBAnalyticsHistory(7);
        expect(history.length).toBeGreaterThanOrEqual(1);
    });
});
