// LocalDB - IndexedDB wrapper for permanent Pomodoro storage

const DB_NAME = 'PomodoroLocalDB';
const DB_VERSION = 1;

let dbInstance = null;

function getDB() {
    return new Promise((resolve) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }
        if (typeof indexedDB === 'undefined') {
            resolve(null);
            return;
        }
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('sounds')) {
                    db.createObjectStore('sounds', { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };

            request.onerror = (e) => {
                console.warn('IndexedDB failed to open:', e);
                resolve(null);
            };
        } catch (err) {
            console.warn('IndexedDB error:', err);
            resolve(null);
        }
    });
}

// Settings DB methods
async function saveDBSettings(settingsObj) {
    // Sync to localStorage
    try {
        localStorage.setItem('pomodoro-settings', JSON.stringify(settingsObj));
    } catch (e) {}

    const db = await getDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('settings', 'readwrite');
            const store = tx.objectStore('settings');
            store.put({ id: 'main', ...settingsObj });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
}

async function loadDBSettings() {
    const db = await getDB();
    if (!db) {
        // Fallback to localStorage
        const saved = localStorage.getItem('pomodoro-settings');
        return saved ? JSON.parse(saved) : null;
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const req = store.get('main');
            req.onsuccess = () => {
                if (req.result) {
                    const { id, ...data } = req.result;
                    resolve(data);
                } else {
                    const saved = localStorage.getItem('pomodoro-settings');
                    resolve(saved ? JSON.parse(saved) : null);
                }
            };
            req.onerror = () => {
                const saved = localStorage.getItem('pomodoro-settings');
                resolve(saved ? JSON.parse(saved) : null);
            };
        } catch (e) {
            const saved = localStorage.getItem('pomodoro-settings');
            resolve(saved ? JSON.parse(saved) : null);
        }
    });
}

// Tasks DB methods
async function saveDBTasks(tasksArray) {
    // Sync to localStorage
    try {
        localStorage.setItem('pomodoro-tasks', JSON.stringify(tasksArray));
    } catch (e) {}

    const db = await getDB();
    if (!db) return;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('tasks', 'readwrite');
            const store = tx.objectStore('tasks');
            store.clear();
            tasksArray.forEach(task => store.put(task));
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
}

async function loadDBTasks() {
    const db = await getDB();
    if (!db) {
        const saved = localStorage.getItem('pomodoro-tasks');
        return saved ? JSON.parse(saved) : [];
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('tasks', 'readonly');
            const store = tx.objectStore('tasks');
            const req = store.getAll();
            req.onsuccess = () => {
                if (req.result && req.result.length > 0) {
                    resolve(req.result);
                } else {
                    const saved = localStorage.getItem('pomodoro-tasks');
                    resolve(saved ? JSON.parse(saved) : []);
                }
            };
            req.onerror = () => {
                const saved = localStorage.getItem('pomodoro-tasks');
                resolve(saved ? JSON.parse(saved) : []);
            };
        } catch (e) {
            const saved = localStorage.getItem('pomodoro-tasks');
            resolve(saved ? JSON.parse(saved) : []);
        }
    });
}

// Sounds DB methods
async function saveDBSound(soundObj) {
    const db = await getDB();
    if (!db) return false;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('sounds', 'readwrite');
            const store = tx.objectStore('sounds');
            store.put(soundObj);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
}

async function loadDBSounds() {
    const db = await getDB();
    if (!db) return [];

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('sounds', 'readonly');
            const store = tx.objectStore('sounds');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        } catch (e) {
            resolve([]);
        }
    });
}

async function deleteDBSound(soundId) {
    const db = await getDB();
    if (!db) return false;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('sounds', 'readwrite');
            const store = tx.objectStore('sounds');
            store.delete(soundId);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveDBSettings,
        loadDBSettings,
        saveDBTasks,
        loadDBTasks,
        saveDBSound,
        loadDBSounds,
        deleteDBSound
    };
}
