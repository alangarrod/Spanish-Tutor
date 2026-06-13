// ──────────────────────────── IndexedDB ────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SpanishTutorDB', 5);
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('topics')) {
                database.createObjectStore('topics', { keyPath: 'id' });
            } else {
                const topicStore = e.target.transaction.objectStore('topics');
                if (!topicStore.indexNames.contains('studyLevelId')) {
                    topicStore.createIndex('studyLevelId', 'studyLevelId', { unique: false });
                }
            }
            if (!database.objectStoreNames.contains('subtopics')) {
                const subStore = database.createObjectStore('subtopics', { keyPath: 'id' });
                subStore.createIndex('topicId', 'topicId', { unique: false });
            }
            if (!database.objectStoreNames.contains('lessons')) {
                const lessonStore = database.createObjectStore('lessons', { keyPath: 'id' });
                lessonStore.createIndex('subtopicId', 'subtopicId', { unique: false });
            }
            if (!database.objectStoreNames.contains('studyLevels')) {
                database.createObjectStore('studyLevels', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('stories')) {
                const storyStore = database.createObjectStore('stories', { keyPath: 'id' });
                storyStore.createIndex('studyLevelId', 'studyLevelId', { unique: false });
            }
            // Existing lessons store may need a flashcardVocab index; recreate not safe,
            // so we rely on the object store already existing and just bump the version.
        };
        request.onsuccess = async (e) => {
            db = e.target.result;
            await initStudyLevels();
            resolve(db);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

async function initStudyLevels() {
    const existing = await dbGetAll('studyLevels');
    if (existing.length === 0) {
        for (const level of STUDY_LEVELS) {
            await dbPut('studyLevels', { ...level });
        }
    }
}

function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function dbPut(storeName, item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

function dbGetByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.getAll(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
