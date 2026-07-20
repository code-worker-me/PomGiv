/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('renderer.js', () => {
    let renderer;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="time-display">25:00</div>
            <div id="status-display">Focusing</div>
            <div id="session-display">Session 1 of 4</div>
            <div id="session-dots"></div>
            <button id="settings-toggle-btn"></button>
            <div id="settings-modal" class="hidden">
                <button id="close-settings-btn"></button>
                <input id="work-duration-input" value="25" />
                <input id="short-duration-input" value="5" />
                <input id="long-duration-input" value="15" />
                <input id="total-sessions-input" value="4" />
                <span id="work-val-display">25 min</span>
                <span id="short-val-display">5 min</span>
                <span id="long-val-display">15 min</span>
                <span id="sessions-val-display">4 sesi</span>
                <button id="save-settings-btn"></button>
            </div>
            <button id="play-btn" title="Start">
                <div id="play-icon"></div>
            </button>
            <button id="reset-btn"></button>
            <button id="skip-btn"></button>
            <div id="timer-progress" style="stroke-dashoffset: 0"></div>
            <button id="mode-work" class="mode-btn active"></button>
            <button id="mode-short" class="mode-btn"></button>
            <button id="mode-long" class="mode-btn"></button>
            <input id="task-input" />
            <button id="add-task-btn"></button>
            <ul id="task-list"></ul>
        `;

        // Mocking window.versions
        window.versions = {
            setProgressBar: jest.fn()
        };

        // Mocking Notification
        global.Notification = jest.fn().mockImplementation((title, options) => ({
            title,
            options
        }));
        global.Notification.permission = 'granted';
        global.Notification.requestPermission = jest.fn().mockResolvedValue('granted');
        
        // Mocking localStorage
        const localStorageMock = (function() {
            let store = {};
            return {
                getItem: jest.fn((key) => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                clear: jest.fn(() => { store = {}; }),
                removeItem: jest.fn((key) => { delete store[key]; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Mock AudioContext
        const mockOscillator = {
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            frequency: { setValueAtTime: jest.fn() }
        };
        const mockGain = {
            connect: jest.fn(),
            gain: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn()
            }
        };
        global.AudioContext = jest.fn().mockImplementation(() => ({
            createOscillator: jest.fn().mockReturnValue(mockOscillator),
            createGain: jest.fn().mockReturnValue(mockGain),
            destination: {},
            currentTime: 0
        }));

        // Load renderer.js
        // We need to use jest.isolateModules to ensure a fresh state for each test
        jest.isolateModules(() => {
            renderer = require('../renderer.js');
        });
    });

    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    test('getStatusText returns correct text based on currentMode', () => {
        renderer.switchMode('work');
        expect(renderer.getStatusText()).toBe('Focusing');
        renderer.switchMode('short');
        expect(renderer.getStatusText()).toBe('Short Break');
        renderer.switchMode('long');
        expect(renderer.getStatusText()).toBe('Long Break');
    });

    test('updateDisplay updates the time display correctly', () => {
        // Mock timeLeft and totalDuration are not exported, but we can indirectly test them
        // or we can test the function if it uses the current state.
        // Let's call updateDisplay and see if it updates time-display
        renderer.updateDisplay();
        const timeDisplay = document.getElementById('time-display');
        expect(timeDisplay.textContent).toBe('25:00'); // Initial value
    });

    test('switchMode changes the mode and updates UI', () => {
        renderer.switchMode('short');
        expect(document.getElementById('status-display').textContent).toBe('Short Break');
        expect(document.getElementById('mode-short').classList.contains('active')).toBe(true);
        expect(document.getElementById('mode-work').classList.contains('active')).toBe(false);
    });

    test('addNewTask adds a task to the list', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'New Task';
        renderer.addNewTask();

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-text').textContent).toBe('New Task');
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pomodoro-tasks', expect.any(String));
    });

    test('toggleTaskComplete toggles completion status', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'Task to complete';
        renderer.addNewTask();
        
        const taskItem = document.querySelector('.task-content');
        taskItem.click(); // Should trigger toggleTaskComplete

        const li = document.querySelector('li');
        expect(li.classList.contains('completed')).toBe(true);
    });

    test('deleteTask removes a task', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'Task to delete';
        renderer.addNewTask();
        
        const deleteBtn = document.querySelector('.btn-delete-task');
        deleteBtn.click();

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(0);
    });

    test('resetTimer resets timeLeft and updates display', () => {
        renderer.switchMode('short'); // 5 minutes
        renderer.resetTimer();
        expect(document.getElementById('time-display').textContent).toBe('05:00');
    });

    test('toggleTimer toggles the timer', () => {
        jest.useFakeTimers();
        renderer.toggleTimer(); // Start
        expect(document.getElementById('play-btn').title).toBe('Pause');
        
        renderer.toggleTimer(); // Pause
        expect(document.getElementById('play-btn').title).toBe('Start');
        jest.useRealTimers();
    });

    test('timerFinished triggers mode switch after timeout', () => {
        jest.useFakeTimers();
        renderer.switchMode('work');
        renderer.timerFinished();
        
        jest.advanceTimersByTime(1501);
        expect(document.getElementById('status-display').textContent).toBe('Short Break');
        jest.useRealTimers();
    });

    test('updatePlayIcon updates the button title and icon', () => {
        renderer.updatePlayIcon(true);
        expect(document.getElementById('play-btn').title).toBe('Pause');
        expect(document.getElementById('play-icon').innerHTML).toContain('rect');

        renderer.updatePlayIcon(false);
        expect(document.getElementById('play-btn').title).toBe('Start');
        expect(document.getElementById('play-icon').innerHTML).toContain('polygon');
    });

    test('showNotification calls Notification constructor when permitted', () => {
        renderer.switchMode('work');
        renderer.showNotification();
        expect(global.Notification).toHaveBeenCalledWith('Work Session 1 Ended!', expect.any(Object));
    });

    test('timerFinished plays chime and shows notification', () => {
        renderer.timerFinished();
        expect(global.Notification).toHaveBeenCalled();
    });

    test('4-session cycle transitions correctly', () => {
        // Session 1: Work -> Short Break
        renderer.switchMode('work');
        expect(renderer.getCurrentSession()).toBe(1);
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Short Break');
        expect(renderer.getCurrentSession()).toBe(1);

        // Short Break 1 -> Session 2 Work
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Focusing');
        expect(renderer.getCurrentSession()).toBe(2);

        // Session 2 Work -> Short Break 2
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Short Break');

        // Short Break 2 -> Session 3 Work
        renderer.skipSession();
        expect(renderer.getCurrentSession()).toBe(3);

        // Session 3 Work -> Short Break 3
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Short Break');

        // Short Break 3 -> Session 4 Work
        renderer.skipSession();
        expect(renderer.getCurrentSession()).toBe(4);

        // Session 4 Work -> Long Break
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Long Break');
        expect(renderer.getCurrentSession()).toBe(4);

        // Long Break -> Session 1 Work
        renderer.skipSession();
        expect(document.getElementById('status-display').textContent).toBe('Focusing');
        expect(renderer.getCurrentSession()).toBe(1);
    });

    test('openSettingsModal and closeSettingsModal toggle modal visibility', () => {
        const modal = document.getElementById('settings-modal');
        renderer.openSettingsModal();
        expect(modal.classList.contains('hidden')).toBe(false);

        renderer.closeSettingsModal();
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    test('saveSettings updates DURATIONS and TOTAL_SESSIONS and persists to localStorage', () => {
        document.getElementById('work-duration-input').value = '45';
        document.getElementById('short-duration-input').value = '10';
        document.getElementById('long-duration-input').value = '30';
        document.getElementById('total-sessions-input').value = '6';

        renderer.saveSettings();

        expect(renderer.DURATIONS.work).toBe(45 * 60);
        expect(renderer.DURATIONS.short).toBe(10 * 60);
        expect(renderer.DURATIONS.long).toBe(30 * 60);
        expect(renderer.getTotalSessions()).toBe(6);
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'pomodoro-settings',
            JSON.stringify({ work: 45, short: 10, long: 30, totalSessions: 6 })
        );
        expect(document.getElementById('time-display').textContent).toBe('45:00');
    });
});
