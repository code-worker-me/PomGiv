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
                <button id="tab-btn-timer" class="active"></button>
                <button id="tab-btn-notification"></button>
                <div id="settings-tab-timer">
                    <input id="work-duration-input" value="25" />
                    <input id="short-duration-input" value="5" />
                    <input id="long-duration-input" value="15" />
                    <input id="total-sessions-input" value="4" />
                    <span id="work-val-display">25 min</span>
                    <span id="short-val-display">5 min</span>
                    <span id="long-val-display">15 min</span>
                    <span id="sessions-val-display">4 sesi</span>
                </div>
                <div id="settings-tab-notification" class="hidden">
                    <input id="sound-duration-input" value="3" />
                    <span id="sound-duration-val-display">3 detik</span>
                    <select id="sound-select"></select>
                    <button id="btn-test-sound"></button>
                    <input type="checkbox" id="sound-repeat-toggle" />
                    <input type="file" id="mp3-file-input" />
                    <button id="btn-trigger-upload"></button>
                    <span id="upload-filename"></span>
                </div>
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

            <div id="task-session-modal" class="hidden">
                <button id="close-task-session-btn"></button>
                <p id="task-modal-preview"></p>
                <div id="session-checkboxes-container"></div>
                <button id="cancel-task-session-btn"></button>
                <button id="confirm-add-task-btn"></button>
            </div>

            <div id="task-verify-modal" class="hidden">
                <button id="close-verify-modal-btn"></button>
                <span id="verify-session-num">1</span>
                <p id="verify-modal-subtitle"></p>
                <div id="task-verify-list"></div>
                <button id="save-verify-btn"></button>
            </div>
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

    test('addNewTask adds a task to the list with session badges', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'New Task';
        renderer.addNewTask('New Task', [1, 3]);

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-text').textContent).toBe('New Task');
        expect(taskList.querySelector('.task-session-badge').textContent).toBe('Sesi 1, 3');
        expect(window.localStorage.setItem).toHaveBeenCalledWith('pomodoro-tasks', expect.any(String));
    });

    test('renderTasks sorts tasks: incomplete first, ordered by earliest session', () => {
        renderer.addNewTask('Completed Task Session 1', [1]); // Task 1
        renderer.addNewTask('Incomplete Task Session 3', [3]);  // Task 2
        renderer.addNewTask('Incomplete Task Session 1', [1, 2]);// Task 3

        // Mark Task 1 as completed
        const items = document.querySelectorAll('.task-content');
        items[0].click(); // Complete Task 1

        const renderedTaskTexts = Array.from(document.querySelectorAll('.task-text')).map(el => el.textContent);

        // Expected order:
        // 1. Incomplete Task Session 1 (incomplete, min session 1)
        // 2. Incomplete Task Session 3 (incomplete, min session 3)
        // 3. Completed Task Session 1 (completed)
        expect(renderedTaskTexts).toEqual([
            'Incomplete Task Session 1',
            'Incomplete Task Session 3',
            'Completed Task Session 1'
        ]);
    });

    test('openTaskSessionModal opens modal and populates session checkboxes', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'Task with sessions';
        renderer.openTaskSessionModal();

        const modal = document.getElementById('task-session-modal');
        expect(modal.classList.contains('hidden')).toBe(false);

        const container = document.getElementById('session-checkboxes-container');
        expect(container.children.length).toBe(4); // TOTAL_SESSIONS is 4
    });

    test('confirmAddTask adds task with selected multiple sessions', () => {
        const taskInput = document.getElementById('task-input');
        taskInput.value = 'Multi-session task';
        renderer.openTaskSessionModal();

        const container = document.getElementById('session-checkboxes-container');
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes[0].checked = true; // Sesi 1
        checkboxes[2].checked = true; // Sesi 3

        renderer.confirmAddTask();

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-text').textContent).toBe('Multi-session task');
        expect(taskList.querySelector('.task-session-badge').textContent).toBe('Sesi 1, 3');
        expect(document.getElementById('task-session-modal').classList.contains('hidden')).toBe(true);
    });

    test('openTaskVerifyModal opens modal for active tasks in current session', () => {
        renderer.addNewTask('Session 1 Task', [1]);
        const opened = renderer.openTaskVerifyModal(1);

        expect(opened).toBe(true);
        expect(document.getElementById('task-verify-modal').classList.contains('hidden')).toBe(false);

        const list = document.getElementById('task-verify-list');
        expect(list.children.length).toBe(1);
        expect(list.querySelector('.verify-task-text').textContent).toBe('Session 1 Task');
    });

    test('confirmTaskVerification completes task when done is selected', () => {
        renderer.addNewTask('Task to complete', [1]);
        renderer.openTaskVerifyModal(1);
        renderer.confirmTaskVerification();

        const li = document.querySelector('.task-item');
        expect(li.classList.contains('completed')).toBe(true);
        expect(document.getElementById('task-verify-modal').classList.contains('hidden')).toBe(true);
    });

    test('confirmTaskVerification moves task to next session when pending selected', () => {
        renderer.addNewTask('Task to postpone', [1]);
        renderer.openTaskVerifyModal(1);

        const pendingBtn = document.querySelector('.btn-opt-pending');
        pendingBtn.click(); // Select pending/next session option

        renderer.confirmTaskVerification();

        const taskBadge = document.querySelector('.task-session-badge');
        expect(taskBadge.textContent).toBe('Sesi 1, 2');
    });

    test('confirmTaskVerification deletes task when pending selected on last session', () => {
        renderer.setCurrentSession(4); // Last session of 4
        renderer.addNewTask('Task on last session', [4]);
        renderer.openTaskVerifyModal(4);

        const deleteBtn = document.querySelector('.btn-opt-delete');
        deleteBtn.click(); // Select delete/pending option

        renderer.confirmTaskVerification();

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(0);
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

    test('switchSettingsTab switches active settings tab', () => {
        renderer.switchSettingsTab('notification');
        expect(document.getElementById('settings-tab-notification').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('settings-tab-timer').classList.contains('hidden')).toBe(true);

        renderer.switchSettingsTab('timer');
        expect(document.getElementById('settings-tab-timer').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('settings-tab-notification').classList.contains('hidden')).toBe(true);
    });

    test('saveSettings updates notification sound settings', () => {
        document.getElementById('sound-duration-input').value = '5';
        document.getElementById('sound-select').value = 'digital';
        document.getElementById('sound-repeat-toggle').checked = true;

        renderer.saveSettings();

        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'pomodoro-settings',
            expect.stringContaining('"soundDuration":5')
        );
    });

    test('handleMP3Upload processes file and updates custom sound options', (done) => {
        const file = new File(['dummy audio content'], 'test.mp3', { type: 'audio/mpeg' });
        const event = {
            target: {
                files: [file],
                value: 'fake-path'
            }
        };

        renderer.handleMP3Upload(event);

        setTimeout(() => {
            const soundSelect = document.getElementById('sound-select');
            const options = Array.from(soundSelect.options);
            const mp3Option = options.find(opt => opt.textContent.includes('test.mp3'));
            expect(mp3Option).toBeDefined();
            expect(event.target.value).toBe('');
            done();
        }, 100);
    });

    test('deleteCustomSound removes MP3 sound and resets select if deleted sound was selected', async () => {
        const file = new File(['dummy audio content'], 'delete_me.mp3', { type: 'audio/mpeg' });
        const event = { target: { files: [file], value: 'fake' } };
        renderer.handleMP3Upload(event);

        await new Promise(r => setTimeout(r, 100));

        const soundSelect = document.getElementById('sound-select');
        const customOption = Array.from(soundSelect.options).find(opt => opt.textContent.includes('delete_me.mp3'));
        expect(customOption).toBeDefined();

        await renderer.deleteCustomSound(customOption.value);

        const optionsAfter = Array.from(soundSelect.options);
        const deletedOpt = optionsAfter.find(opt => opt.textContent.includes('delete_me.mp3'));
        expect(deletedOpt).toBeUndefined();
        expect(soundSelect.value).toBe('chime');
    });
});


