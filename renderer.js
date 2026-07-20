// DOM Elements
const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status-display');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const timerProgress = document.getElementById('timer-progress');

// Mode Selection Buttons
const modeWorkBtn = document.getElementById('mode-work');
const modeShortBtn = document.getElementById('mode-short');
const modeLongBtn = document.getElementById('mode-long');

// Task List Elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

// Settings Elements
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');

const workDurationInput = document.getElementById('work-duration-input');
const shortDurationInput = document.getElementById('short-duration-input');
const longDurationInput = document.getElementById('long-duration-input');
const totalSessionsInput = document.getElementById('total-sessions-input');

const workValDisplay = document.getElementById('work-val-display');
const shortValDisplay = document.getElementById('short-val-display');
const longValDisplay = document.getElementById('long-val-display');
const sessionsValDisplay = document.getElementById('sessions-val-display');

// Timer State Configuration (in seconds)
let DURATIONS = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

let TOTAL_SESSIONS = 4;
let currentSession = 1;

let currentMode = 'work';
let timeLeft = DURATIONS.work;
let totalDuration = DURATIONS.work;
let timerInterval = null;
let isRunning = false;

// Task List State
let tasks = [];

// Initialize Page
function init() {
    loadTasks();
    loadSettings();
    updateDisplay();
    updateSessionUI();
    setupEventListeners();
    
    // Request notification permissions
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Mode Switchers
    if (modeWorkBtn) modeWorkBtn.addEventListener('click', () => switchMode('work'));
    if (modeShortBtn) modeShortBtn.addEventListener('click', () => switchMode('short'));
    if (modeLongBtn) modeLongBtn.addEventListener('click', () => switchMode('long'));

    // Controls
    if (playBtn) playBtn.addEventListener('click', toggleTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
    if (skipBtn) skipBtn.addEventListener('click', skipSession);

    // Tasks
    if (addTaskBtn) addTaskBtn.addEventListener('click', addNewTask);
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addNewTask();
            }
        });
    }

    // Settings Modal
    if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', openSettingsModal);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    // Live update range badge text on input change
    if (workDurationInput && workValDisplay) {
        workDurationInput.addEventListener('input', (e) => workValDisplay.textContent = `${e.target.value} min`);
    }
    if (shortDurationInput && shortValDisplay) {
        shortDurationInput.addEventListener('input', (e) => shortValDisplay.textContent = `${e.target.value} min`);
    }
    if (longDurationInput && longValDisplay) {
        longDurationInput.addEventListener('input', (e) => longValDisplay.textContent = `${e.target.value} min`);
    }
    if (totalSessionsInput && sessionsValDisplay) {
        totalSessionsInput.addEventListener('input', (e) => sessionsValDisplay.textContent = `${e.target.value} sesi`);
    }
}

// Settings Persistence and Management
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoro-settings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            if (settings.work) DURATIONS.work = Math.min(60, Math.max(5, settings.work)) * 60;
            if (settings.short) DURATIONS.short = Math.min(15, Math.max(1, settings.short)) * 60;
            if (settings.long) DURATIONS.long = Math.min(60, Math.max(5, settings.long)) * 60;
            if (settings.totalSessions) TOTAL_SESSIONS = Math.min(8, Math.max(1, settings.totalSessions));
        } catch (e) {
            console.error("Failed to parse pomodoro-settings:", e);
        }
    }

    timeLeft = DURATIONS[currentMode];
    totalDuration = DURATIONS[currentMode];
}

function syncSettingsInputUI() {
    if (!workDurationInput) return;
    
    const workMin = Math.floor(DURATIONS.work / 60);
    const shortMin = Math.floor(DURATIONS.short / 60);
    const longMin = Math.floor(DURATIONS.long / 60);

    workDurationInput.value = workMin;
    shortDurationInput.value = shortMin;
    longDurationInput.value = longMin;
    totalSessionsInput.value = TOTAL_SESSIONS;

    if (workValDisplay) workValDisplay.textContent = `${workMin} min`;
    if (shortValDisplay) shortValDisplay.textContent = `${shortMin} min`;
    if (longValDisplay) longValDisplay.textContent = `${longMin} min`;
    if (sessionsValDisplay) sessionsValDisplay.textContent = `${TOTAL_SESSIONS} sesi`;
}

function saveSettings() {
    if (!workDurationInput) return;

    const workVal = Math.min(60, Math.max(5, parseInt(workDurationInput.value, 10) || 25));
    const shortVal = Math.min(15, Math.max(1, parseInt(shortDurationInput.value, 10) || 5));
    const longVal = Math.min(60, Math.max(5, parseInt(longDurationInput.value, 10) || 15));
    const sessionsVal = Math.min(8, Math.max(1, parseInt(totalSessionsInput.value, 10) || 4));

    DURATIONS.work = workVal * 60;
    DURATIONS.short = shortVal * 60;
    DURATIONS.long = longVal * 60;
    TOTAL_SESSIONS = sessionsVal;

    localStorage.setItem('pomodoro-settings', JSON.stringify({
        work: workVal,
        short: shortVal,
        long: longVal,
        totalSessions: sessionsVal
    }));

    if (currentSession > TOTAL_SESSIONS) {
        currentSession = TOTAL_SESSIONS;
    }

    if (!isRunning) {
        resetTimer();
    }

    updateSessionUI();
    closeSettingsModal();
}

function openSettingsModal() {
    syncSettingsInputUI();
    if (settingsModal) {
        settingsModal.classList.remove('hidden');
    }
}

function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

// Timer Display and CSS update
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timeDisplay.textContent = timeString;
    
    // Update window title
    document.title = `${timeString} - ${getStatusText()}`;

    // SVG Circular Progress logic (Circumference is 754)
    const progressFraction = timeLeft / totalDuration;
    const strokeOffset = 754 * progressFraction;
    timerProgress.style.strokeDashoffset = 754 - strokeOffset;

    // Send progress to OS Taskbar (ranges from 0 to 1, -1 clears it)
    if (window.versions && typeof window.versions.setProgressBar === 'function') {
        if (isRunning) {
            // Taskbar progress fills up as time goes down
            const taskbarProgress = (totalDuration - timeLeft) / totalDuration;
            window.versions.setProgressBar(taskbarProgress);
        } else {
            // If paused, keep progress but don't clear (or set to -1 on reset)
            if (timeLeft === totalDuration) {
                window.versions.setProgressBar(-1);
            } else {
                const taskbarProgress = (totalDuration - timeLeft) / totalDuration;
                window.versions.setProgressBar(taskbarProgress);
            }
        }
    }
}

function getStatusText() {
    switch (currentMode) {
        case 'work': return 'Focusing';
        case 'short': return 'Short Break';
        case 'long': return 'Long Break';
        default: return 'Pomodoro';
    }
}

// Timer Functions
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    updatePlayIcon(true);
    
    const startTime = Date.now();
    const initialTimeLeft = timeLeft;

    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = initialTimeLeft - elapsedTime;

        if (timeLeft <= 0) {
            timeLeft = 0;
            updateDisplay();
            timerFinished();
        } else {
            updateDisplay();
        }
    }, 100); // Poll fast for smooth rendering & OS time-sync accuracy
}

function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    updatePlayIcon(false);
    updateDisplay();
}

function resetTimer() {
    pauseTimer();
    timeLeft = DURATIONS[currentMode];
    totalDuration = DURATIONS[currentMode];
    updateDisplay();
    
    if (window.versions && typeof window.versions.setProgressBar === 'function') {
        window.versions.setProgressBar(-1);
    }
}

function skipSession() {
    pauseTimer();
    // Auto cycle mode and session according to 4-session rule
    if (currentMode === 'work') {
        if (currentSession < TOTAL_SESSIONS) {
            switchMode('short');
        } else {
            switchMode('long');
        }
    } else if (currentMode === 'short') {
        if (currentSession < TOTAL_SESSIONS) {
            currentSession++;
        }
        switchMode('work');
    } else if (currentMode === 'long') {
        currentSession = 1;
        switchMode('work');
    }
}

function switchMode(mode) {
    pauseTimer();
    
    // Manage active buttons class
    modeWorkBtn.classList.toggle('active', mode === 'work');
    modeShortBtn.classList.toggle('active', mode === 'short');
    modeLongBtn.classList.toggle('active', mode === 'long');

    currentMode = mode;
    timeLeft = DURATIONS[mode];
    totalDuration = DURATIONS[mode];

    // Update CSS variables for progress bar colors
    const root = document.documentElement;
    if (mode === 'work') {
        root.style.setProperty('--accent', 'var(--accent-work)');
        root.style.setProperty('--progress-glow', 'rgba(239, 68, 68, 0.3)');
        statusDisplay.textContent = 'Focusing';
    } else if (mode === 'short') {
        root.style.setProperty('--accent', 'var(--accent-short)');
        root.style.setProperty('--progress-glow', 'rgba(6, 182, 212, 0.3)');
        statusDisplay.textContent = 'Short Break';
    } else if (mode === 'long') {
        root.style.setProperty('--accent', 'var(--accent-long)');
        root.style.setProperty('--progress-glow', 'rgba(99, 102, 241, 0.3)');
        statusDisplay.textContent = 'Long Break';
    }

    updateSessionUI();
    resetTimer();
}

function updateSessionUI() {
    const sessionDisplay = document.getElementById('session-display');
    const sessionDots = document.getElementById('session-dots');

    if (sessionDisplay) {
        if (currentMode === 'work') {
            sessionDisplay.textContent = `Session ${currentSession} of ${TOTAL_SESSIONS}`;
        } else if (currentMode === 'short') {
            sessionDisplay.textContent = `Short Break (Session ${currentSession}/${TOTAL_SESSIONS})`;
        } else if (currentMode === 'long') {
            sessionDisplay.textContent = `Long Break (Session ${currentSession}/${TOTAL_SESSIONS})`;
        }
    }

    if (sessionDots) {
        sessionDots.innerHTML = '';
        for (let i = 1; i <= TOTAL_SESSIONS; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (i < currentSession) {
                dot.classList.add('completed');
            } else if (i === currentSession) {
                dot.classList.add('active');
            }
            sessionDots.appendChild(dot);
        }
    }
}

function updatePlayIcon(playing) {
    if (playing) {
        // Pause icon representation (2 bars)
        playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
        playBtn.title = "Pause";
    } else {
        // Play icon representation (triangle)
        playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
        playBtn.title = "Start";
    }
}

// Notifications and Audio
function timerFinished() {
    pauseTimer();
    playChime();
    showNotification();
    
    // Auto transition
    setTimeout(() => {
        skipSession();
    }, 1500);
}

// Synthesize a clean bell/chime sound using Web Audio API (cross-platform, self-contained)
function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Chime note 1 (Higher pitch)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        // Chime note 2 (Harmonic support)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, ctx.currentTime + 0.1); // C#6
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.6);
        
        osc2.start();
        osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
        console.error("Audio Context failed to start:", e);
    }
}

function showNotification() {
    if (Notification.permission === 'granted') {
        let title = "";
        let message = "";

        if (currentMode === 'work') {
            if (currentSession < TOTAL_SESSIONS) {
                title = `Work Session ${currentSession} Ended!`;
                message = `Great job! Time to take a 5-minute short break.`;
            } else {
                title = `Session ${TOTAL_SESSIONS} Ended!`;
                message = `Awesome work completing ${TOTAL_SESSIONS} sessions! Time for a long break.`;
            }
        } else if (currentMode === 'short') {
            title = `Short Break Ended!`;
            message = `Ready for Session ${currentSession + 1}? Let's focus!`;
        } else {
            title = `Long Break Ended!`;
            message = `Cycle complete! Ready to start a new 4-session cycle?`;
        }

        new Notification(title, {
            body: message,
            silent: true // We play our custom chime instead
        });
    }
}

// Task List Functions
function loadTasks() {
    const storedTasks = localStorage.getItem('pomodoro-tasks');
    if (storedTasks) {
        try {
            tasks = JSON.parse(storedTasks);
            renderTasks();
        } catch (e) {
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'task-content';
        contentDiv.addEventListener('click', () => toggleTaskComplete(task.id));

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.readOnly = true;

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        contentDiv.appendChild(checkbox);
        contentDiv.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-task';
        deleteBtn.innerHTML = '&times;'; // Cross character
        deleteBtn.title = "Delete task";
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling when clicking delete
            deleteTask(task.id);
        });

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

function addNewTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    
    taskInput.value = '';
    taskInput.focus();
}

function toggleTaskComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Start
if (typeof document !== 'undefined') {
    init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getStatusText,
        updateDisplay,
        toggleTimer,
        startTimer,
        pauseTimer,
        resetTimer,
        skipSession,
        switchMode,
        updatePlayIcon,
        timerFinished,
        loadTasks,
        saveTasks,
        renderTasks,
        addNewTask,
        toggleTaskComplete,
        deleteTask,
        DURATIONS,
        showNotification,
        playChime,
        updateSessionUI,
        loadSettings,
        saveSettings,
        openSettingsModal,
        closeSettingsModal,
        getTotalSessions: () => TOTAL_SESSIONS,
        setTotalSessions: (val) => { TOTAL_SESSIONS = val; },
        getCurrentSession: () => currentSession,
        setCurrentSession: (val) => { currentSession = val; }
    };
}