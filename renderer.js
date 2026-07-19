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

// Timer State Configuration (in seconds)
const DURATIONS = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

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
    updateDisplay();
    setupEventListeners();
    
    // Request notification permissions
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Mode Switchers
    modeWorkBtn.addEventListener('click', () => switchMode('work'));
    modeShortBtn.addEventListener('click', () => switchMode('short'));
    modeLongBtn.addEventListener('click', () => switchMode('long'));

    // Controls
    playBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', skipSession);

    // Tasks
    addTaskBtn.addEventListener('click', addNewTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });
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
    // Auto cycle mode
    if (currentMode === 'work') {
        // Offer short break by default
        switchMode('short');
    } else {
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

    resetTimer();
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
        const title = currentMode === 'work' ? "Work Session Ended!" : "Break Ended!";
        const message = currentMode === 'work' 
            ? "Great job! Time to take a short break." 
            : "Break is over. Ready to focus again?";
            
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
        playChime
    };
}