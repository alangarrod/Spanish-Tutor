
// ──────────────────────────── State ────────────────────────────
let db = null;
const STUDY_LEVELS = [
    { id: 'lb', name: 'Lower Beginner' },
    { id: 'ub', name: 'Upper Beginner' },
    { id: 'li', name: 'Lower Intermediate' },
    { id: 'ui', name: 'Upper Intermediate' },
    { id: 'la', name: 'Lower Advanced' },
    { id: 'ua', name: 'Upper Advanced' }
];

let state = {
    topics: [],
    subtopics: [],
    lessons: [],
    selectedTopicId: null,
    selectedSubtopicId: null,
    isGenerating: false,
    searchFilter: '',
    currentStudyLevel: localStorage.getItem('CurrentLevel') || 'lb'
};

// ──────────────────────────── IndexedDB ────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SpanishTutorDB', 3);
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

// ──────────────────────────── Data Operations ────────────────────────────
async function addTopic(name) {
    const topic = { id: 't_' + Date.now(), name: name.trim(), studyLevelId: state.currentStudyLevel, createdAt: Date.now() };
    await dbPut('topics', topic);
    state.topics.push(topic);
    renderTopics();
    return topic;
}

async function deleteTopic(topicId) {
    const subtopics = state.subtopics.filter(s => s.topicId === topicId);
    for (const sub of subtopics) {
        const lessons = state.lessons.filter(l => l.subtopicId === sub.id);
        for (const lesson of lessons) {
            await dbDelete('lessons', lesson.id);
        }
        await dbDelete('subtopics', sub.id);
    }
    await dbDelete('topics', topicId);
    state.topics = state.topics.filter(t => t.id !== topicId);
    state.subtopics = state.subtopics.filter(s => s.topicId !== topicId);
    state.lessons = state.lessons.filter(l => !subtopics.some(s => s.id === l.subtopicId));
    if (state.selectedTopicId === topicId) {
        state.selectedTopicId = null;
        state.selectedSubtopicId = null;
    }
    renderTopics();
    renderLessonArea();
}

async function addSubtopic(topicId, name) {
    const subtopic = { id: 's_' + Date.now(), topicId, name: name.trim(), createdAt: Date.now() };
    await dbPut('subtopics', subtopic);
    state.subtopics.push(subtopic);
    renderTopics();
    return subtopic;
}

async function deleteSubtopic(subtopicId) {
    const lessons = state.lessons.filter(l => l.subtopicId === subtopicId);
    for (const lesson of lessons) {
        await dbDelete('lessons', lesson.id);
    }
    await dbDelete('subtopics', subtopicId);
    state.subtopics = state.subtopics.filter(s => s.id !== subtopicId);
    state.lessons = state.lessons.filter(l => l.subtopicId !== subtopicId);
    if (state.selectedSubtopicId === subtopicId) {
        state.selectedSubtopicId = null;
    }
    renderTopics();
    renderLessonArea();
}

async function saveLesson(subtopicId, content) {
    const existing = state.lessons.find(l => l.subtopicId === subtopicId);
    let lesson;
    if (existing) {
        existing.content = content;
        existing.updatedAt = Date.now();
        await dbPut('lessons', existing);
        lesson = existing;
    } else {
        lesson = { id: 'l_' + Date.now(), subtopicId, content, createdAt: Date.now(), updatedAt: Date.now() };
        await dbPut('lessons', lesson);
        state.lessons.push(lesson);
    }
    return lesson;
}

async function deleteLesson(lessonId) {
    await dbDelete('lessons', lessonId);
    state.lessons = state.lessons.filter(l => l.id !== lessonId);
    renderLessonArea();
}

// ──────────────────────────── Ollama API ────────────────────────────
let availableModels = [];

async function checkOllamaStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    try {
        const response = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
        if (response.ok) {
            statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
            statusText.textContent = 'Connected';
            const data = await response.json();
            availableModels = data.models || [];
            populateModelSelect();
        } else {
            throw new Error();
        }
    } catch {
        statusDot.className = 'w-2 h-2 rounded-full bg-red-400';
        statusText.textContent = 'Disconnected';
        availableModels = [];
        populateModelSelect();
    }
}

function populateModelSelect() {
    const select = document.getElementById('modelSelect');
    const saved = localStorage.getItem('selectedOllamaModel');
    select.innerHTML = '';

    if (availableModels.length === 0) {
        select.innerHTML = '<option value="">No models found</option>';
    } else {
        availableModels.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            const size = (m.details && m.details.parameter_size) || '';
            const quant = (m.details && m.details.quantization_level) || '';
            const meta = [size, quant].filter(Boolean).join(' ');
            opt.textContent = meta ? `${m.name} (${meta})` : m.name;
            select.appendChild(opt);
        });
    }

    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = 'Custom...';
    select.appendChild(customOpt);

    if (saved && (availableModels.some(m => m.name === saved) || saved === '__custom__')) {
        select.value = saved;
    } else if (availableModels.length > 0) {
        select.value = availableModels[0].name;
    }
    handleModelChange();
}

function handleModelChange() {
    const select = document.getElementById('modelSelect');
    const customInput = document.getElementById('customModelInput');
    const value = select.value;
    localStorage.setItem('selectedOllamaModel', value);
    if (value === '__custom__') {
        customInput.classList.remove('hidden');
        if (document.activeElement !== customInput) {
            const savedCustom = localStorage.getItem('customOllamaModel') || '';
            customInput.value = savedCustom;
        }
    } else {
        customInput.classList.add('hidden');
    }
}

function getSelectedModel() {
    const select = document.getElementById('modelSelect');
    const customInput = document.getElementById('customModelInput');
    if (select.value === '__custom__') {
        return customInput.value.trim() || 'llama3.2';
    }
    return select.value || 'llama3.2';
}

async function generateLesson(topic, subtopic) {
    const model = getSelectedModel();
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const prompt = `You are an expert, engaging Spanish language tutor. Generate a comprehensive lesson on the following subtopic, tailored for a ${levelName} student.

Topic: ${topic}
Subtopic: ${subtopic}
Study Level: ${levelName}

Your lesson MUST include ALL of the following sections, clearly marked with markdown headers:

## Introduction
Brief overview of what this lesson covers and why it's important for Spanish learners.

## Key Vocabulary
List 8-12 essential Spanish words/phrases related to this subtopic. Format each as: **Spanish word** — English translation

## Grammar & Rules
Explain the grammatical concepts clearly with examples in bold Spanish and English translations in parentheses.

## Example Sentences
Provide 6-8 example sentences demonstrating the concept. Format each as:
- **Spanish sentence** (English translation)

## Practice Exercises
Create 5 fill-in-the-blank or translation exercises for the student to practice.

## Mini Quiz
Create a 4-question multiple choice quiz. Format as:
**Q#:** Question text
- A) Option
- B) Option  
- C) Option
- D) Option
**Answer:** X

## Cultural Note
Share a brief interesting cultural fact related to this topic.

Write explanations in English with Spanish examples. Be thorough but concise. Use clear formatting.`;

    state.isGenerating = true;
    renderLessonArea();

    let fullContent = '';

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: true })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ollama error: ${response.status} - ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const streamPreview = document.getElementById('streamPreview');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        fullContent += json.response;
                        if (streamPreview) {
                            streamPreview.textContent = fullContent.slice(-500);
                            streamPreview.scrollTop = streamPreview.scrollHeight;
                        }
                    }
                    if (json.error) throw new Error(json.error);
                } catch (parseErr) {
                    // skip malformed lines
                }
            }
        }

        const lesson = await saveLesson(state.selectedSubtopicId, fullContent);
        showToast('Lesson generated and saved!', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        state.isGenerating = false;
        renderLessonArea();
    }
}

// ──────────────────────────── Markdown Parser ────────────────────────────
function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        // Code
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Unordered list items
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Numbered list items
        .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-4 border-gray-200">');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Paragraphs: wrap lines that aren't already wrapped in tags
    html = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (/^<(h[1-6]|ul|li|ol|blockquote|hr|div|p)/.test(trimmed)) return line;
        return `<p>${line}</p>`;
    }).join('\n');

    return html;
}

// ──────────────────────────── Rendering ────────────────────────────
function renderTopics() {
    const container = document.getElementById('topicsList');
    const filter = state.searchFilter.toLowerCase();
    const filteredTopics = state.topics.filter(t =>
        t.name.toLowerCase().includes(filter) &&
        t.studyLevelId === state.currentStudyLevel
    );

    if (filteredTopics.length === 0) {
        const levelTopics = state.topics.filter(t => t.studyLevelId === state.currentStudyLevel);
        container.innerHTML = `
            <div class="text-center py-8 text-medium-gray text-sm">
                <i class="fa-solid fa-folder-open text-2xl mb-2 opacity-40"></i>
                <p>${levelTopics.length === 0 ? 'No topics for this level' : 'No matching topics'}</p>
            </div>`;
        return;
    }

    container.innerHTML = filteredTopics.map(topic => {
        const topicSubs = state.subtopics.filter(s => s.topicId === topic.id);
        const isActive = state.selectedTopicId === topic.id;
        return `
            <div class="mb-1">
                <div class="topic-item flex items-center rounded-lg px-3 py-2 cursor-pointer group ${isActive ? 'active' : ''}"
                     onclick="selectTopic('${topic.id}')">
                    <i class="fa-solid fa-chevron-right text-xs mr-2 transition-transform duration-200 ${isActive ? 'rotate-90' : ''}"></i>
                    <span class="flex-1 font-medium text-sm truncate">${escapeHtml(topic.name)}</span>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="event.stopPropagation(); showAddSubtopicModal('${topic.id}')"
                                class="w-6 h-6 rounded flex items-center justify-center hover:bg-white/30 text-xs" title="Add subtopic">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button onclick="event.stopPropagation(); confirmDeleteTopic('${topic.id}', '${escapeAttr(topic.name)}')"
                                class="w-6 h-6 rounded flex items-center justify-center hover:bg-red-400/30 text-xs" title="Delete topic">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${isActive ? `
                    <div class="ml-6 mt-1 space-y-0.5">
                        ${topicSubs.length === 0 ? `
                            <div class="text-xs text-medium-gray py-2 px-3 italic">No subtopics yet</div>
                        ` : topicSubs.map(sub => {
                            const subActive = state.selectedSubtopicId === sub.id;
                            const hasLesson = state.lessons.some(l => l.subtopicId === sub.id);
                            return `
                                <div class="subtopic-item flex items-center rounded-lg px-3 py-2 cursor-pointer group ${subActive ? 'active' : ''}"
                                     onclick="selectSubtopic('${sub.id}')">
                                    <i class="fa-solid fa-book text-xs mr-2 ${hasLesson ? 'text-green-400' : ''}"></i>
                                    <span class="flex-1 text-sm truncate">${escapeHtml(sub.name)}</span>
                                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onclick="event.stopPropagation(); confirmDeleteSubtopic('${sub.id}', '${escapeAttr(sub.name)}')"
                                                class="w-5 h-5 rounded flex items-center justify-center hover:bg-red-400/30" style="font-size:10px" title="Delete">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>
                ` : ''}
            </div>`;
    }).join('');
}

function renderLessonArea() {
    const emptyState = document.getElementById('emptyState');
    const lessonDisplay = document.getElementById('lessonDisplay');
    const generatingState = document.getElementById('generatingState');
    const contextBar = document.getElementById('contextActions');
    const breadcrumb = document.getElementById('breadcrumb');

    // Hide all
    emptyState.classList.add('hidden');
    lessonDisplay.classList.add('hidden');
    generatingState.classList.add('hidden');

    if (state.isGenerating) {
        generatingState.classList.remove('hidden');
        breadcrumb.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-1"></i>
            Generating lesson...`;
        contextBar.innerHTML = '';
        return;
    }

    if (!state.selectedSubtopicId) {
        emptyState.classList.remove('hidden');
        if (state.selectedTopicId) {
            const topic = state.topics.find(t => t.id === state.selectedTopicId);
            breadcrumb.innerHTML = `<i class="fa-solid fa-folder mr-1"></i> ${escapeHtml(topic?.name || '')}`;
        } else {
            breadcrumb.innerHTML = `<i class="fa-solid fa-house-chimney mr-1"></i> Select a topic and subtopic to begin`;
        }
        contextBar.innerHTML = '';
        return;
    }

    const topic = state.topics.find(t => t.id === state.selectedTopicId);
    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    const lesson = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);

    breadcrumb.innerHTML = `
        <i class="fa-solid fa-folder mr-1"></i> ${escapeHtml(topic?.name || '')}
        <i class="fa-solid fa-chevron-right mx-2 text-xs opacity-40"></i>
        <i class="fa-solid fa-book mr-1"></i> ${escapeHtml(subtopic?.name || '')}`;

    contextBar.innerHTML = `
        <button onclick="requestGenerateLesson()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ${lesson ? 'Regenerate Lesson' : 'Generate Lesson'}
        </button>
        ${lesson ? `
            <button onclick="confirmDeleteLesson('${lesson.id}')" class="btn-danger px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-trash"></i> Delete
            </button>
        ` : ''}
    `;

    if (lesson) {
        const lessonContent = document.getElementById('lessonContent');
        lessonContent.innerHTML = renderMarkdown(lesson.content);
        if (lesson.updatedAt) {
            lessonContent.innerHTML += `
                <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-medium-gray">
                    <i class="fa-regular fa-clock mr-1"></i> Last updated: ${new Date(lesson.updatedAt).toLocaleString()}
                </div>`;
        }
        lessonDisplay.classList.remove('hidden');
    } else {
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                <div class="w-20 h-20 rounded-full bg-soft-blue flex items-center justify-center mb-5">
                    <i class="fa-solid fa-wand-magic-sparkles text-3xl text-pastel-blue"></i>
                </div>
                <h3 class="text-xl font-bold text-dark-gray mb-2">No lesson yet</h3>
                <p class="text-medium-gray max-w-sm leading-relaxed">
                    Click "Generate Lesson" to have Ollama create a Spanish lesson for <strong>${escapeHtml(subtopic?.name || 'this subtopic')}</strong>.
                </p>
            </div>`;
    }
}

function filterTopics(value) {
    state.searchFilter = value;
    renderTopics();
}

function handleStudyLevelChange(levelId) {
    state.currentStudyLevel = levelId;
    localStorage.setItem('CurrentLevel', levelId);
    state.selectedTopicId = null;
    state.selectedSubtopicId = null;
    renderTopics();
    renderLessonArea();
}

function selectTopic(topicId) {
    state.selectedTopicId = state.selectedTopicId === topicId ? null : topicId;
    if (state.selectedTopicId !== topicId) state.selectedSubtopicId = null;
    renderTopics();
    renderLessonArea();
}

function selectSubtopic(subtopicId) {
    state.selectedSubtopicId = subtopicId;
    renderTopics();
    renderLessonArea();
}

// ──────────────────────────── Modals ────────────────────────────
function showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('flex');
    setTimeout(() => {
        const firstInput = document.querySelector('#modalContent input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalOverlay').classList.remove('flex');
}

function showAddTopicModal() {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-4"><i class="fa-solid fa-folder-plus mr-2 text-pastel-blue"></i>Add Topic</h3>
        <input type="text" id="newTopicName" placeholder="e.g., Verb Tenses, Vocabulary, Culture..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-4 text-sm"
            onkeydown="if(event.key==='Enter')submitAddTopic()">
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitAddTopic()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Topic</button>
        </div>
    `);
}

async function submitAddTopic() {
    const input = document.getElementById('newTopicName');
    const name = input.value.trim();
    if (!name) { input.classList.add('ring-2', 'ring-red-300'); return; }
    const topic = await addTopic(name);
    hideModal();
    selectTopic(topic.id);
    showToast(`Topic "${name}" added!`, 'success');
}

function showAddSubtopicModal(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-1"><i class="fa-solid fa-book-medical mr-2 text-pastel-blue"></i>Add Subtopic</h3>
        <p class="text-sm text-medium-gray mb-4">Under: <strong>${escapeHtml(topic?.name || '')}</strong></p>
        <input type="text" id="newSubtopicName" placeholder="e.g., Present Indicative, Greetings, Food..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-4 text-sm"
            onkeydown="if(event.key==='Enter')submitAddSubtopic('${topicId}')">
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitAddSubtopic('${topicId}')" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Subtopic</button>
        </div>
    `);
}

async function submitAddSubtopic(topicId) {
    const input = document.getElementById('newSubtopicName');
    const name = input.value.trim();
    if (!name) { input.classList.add('ring-2', 'ring-red-300'); return; }
    await addSubtopic(topicId, name);
    hideModal();
    renderLessonArea();
    showToast(`Subtopic "${name}" added!`, 'success');
}

function confirmDeleteTopic(topicId, name) {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i>Delete Topic</h3>
        <p class="text-sm text-medium-gray mb-4">Delete <strong>"${escapeHtml(name)}"</strong> and all its subtopics and lessons? This cannot be undone.</p>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="executeDeleteTopic('${topicId}')" class="btn-danger px-5 py-2 rounded-lg text-sm font-bold">Delete</button>
        </div>
    `);
}

async function executeDeleteTopic(topicId) {
    await deleteTopic(topicId);
    hideModal();
    showToast('Topic deleted', 'info');
}

function confirmDeleteSubtopic(subtopicId, name) {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i>Delete Subtopic</h3>
        <p class="text-sm text-medium-gray mb-4">Delete <strong>"${escapeHtml(name)}"</strong> and its lesson? This cannot be undone.</p>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="executeDeleteSubtopic('${subtopicId}')" class="btn-danger px-5 py-2 rounded-lg text-sm font-bold">Delete</button>
        </div>
    `);
}

async function executeDeleteSubtopic(subtopicId) {
    await deleteSubtopic(subtopicId);
    hideModal();
    showToast('Subtopic deleted', 'info');
}

function confirmDeleteLesson(lessonId) {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i>Delete Lesson</h3>
        <p class="text-sm text-medium-gray mb-4">Delete this lesson? You can regenerate it anytime.</p>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="executeDeleteLesson('${lessonId}')" class="btn-danger px-5 py-2 rounded-lg text-sm font-bold">Delete</button>
        </div>
    `);
}

async function executeDeleteLesson(lessonId) {
    await deleteLesson(lessonId);
    hideModal();
    showToast('Lesson deleted', 'info');
}

function requestGenerateLesson() {
    const topic = state.topics.find(t => t.id === state.selectedTopicId);
    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    if (!topic || !subtopic) return;

    const existing = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);
    if (existing) {
        showModal(`
            <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-2 text-pastel-blue"></i>Regenerate Lesson</h3>
            <p class="text-sm text-medium-gray mb-4">This will replace the existing lesson for <strong>"${escapeHtml(subtopic.name)}"</strong>. Continue?</p>
            <div class="flex justify-end gap-2">
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
                <button onclick="startGeneration()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Regenerate</button>
            </div>
        `);
    } else {
        startGeneration();
    }
}

async function startGeneration() {
    hideModal();
    const topic = state.topics.find(t => t.id === state.selectedTopicId);
    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    await generateLesson(topic.name, subtopic.name);
}

// ──────────────────────────── Toasts ────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const colors = {
        success: 'bg-green-100 border-green-300 text-green-800',
        error: 'bg-red-100 border-red-300 text-red-800',
        info: 'bg-soft-blue border-pastel-blue text-dark-gray'
    };
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl border shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ──────────────────────────── Utilities ────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}



function openVoiceSettings() {
    const voices = speechState.spanishVoices.length > 0 ? speechState.spanishVoices : speechState.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    const saved = localStorage.getItem('preferredVoiceName');

    let optionsHtml = '';
    if (voices.length === 0) {
        optionsHtml = '<option value="">No voices available yet (try again in a moment)</option>';
    } else {
        for (const v of voices) {
            const selected = (saved === v.name) ? 'selected' : '';
            const localTag = v.localService ? ' (Local)' : ' (Cloud)';
            optionsHtml += `<option value="${escapeAttr(v.name)}" ${selected}>${escapeHtml(v.name + localTag)}</option>`;
        }
    }

    // Also add a default/auto option
    const autoSelected = saved ? '' : 'selected';
    optionsHtml = `<option value="" ${autoSelected}>Auto (best Spanish voice)</option>` + optionsHtml;

    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-gear mr-2 text-pastel-blue"></i>Voice Settings</h3>
        <div class="voice-settings-form">
            <label for="voiceSelect">Preferred Spanish Voice</label>
            <select id="voiceSelect" onchange="handleVoiceChange()">
                ${optionsHtml}
            </select>
            <p class="hint">Choose the voice you prefer for native playback. Changes apply immediately.</p>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="testVoice()" class="btn-primary px-4 py-2 rounded-lg text-sm font-bold">Test Voice</button>
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Close</button>
            </div>
        </div>
    `);
}

function handleVoiceChange() {
    const select = document.getElementById('voiceSelect');
    const name = select.value;
    if (name) {
        localStorage.setItem('preferredVoiceName', name);
        speechState.preferredVoice = speechState.voices.find(v => v.name === name) || null;
    } else {
        localStorage.removeItem('preferredVoiceName');
        speechState.preferredVoice = speechState.spanishVoices[0] || null;
    }
    console.log('Preferred voice set to:', speechState.preferredVoice ? speechState.preferredVoice.name : 'auto');
}

function testVoice() {
    const phrase = 'Hola, como estas? Bienvenido a Spanish Tutor.';
    speakText(phrase);
}
// -- Speech Synthesis (Text-to-Speech) --
const speechState = {
    voices: [],
    spanishVoices: [],
    preferredVoice: null,
    isSpeaking: false,
    selectedText: ''
};

function initSpeechSynthesis() {
    const loadVoices = () => {
        speechState.voices = window.speechSynthesis.getVoices();
        speechState.spanishVoices = speechState.voices.filter(v =>
            v.lang && v.lang.toLowerCase().startsWith('es')
        );
        speechState.spanishVoices.sort((a, b) => {
            const aLocal = a.localService ? 1 : 0;
            const bLocal = b.localService ? 1 : 0;
            if (bLocal !== aLocal) return bLocal - aLocal;
            return b.lang.length - a.lang.length;
        });
        const savedName = localStorage.getItem('preferredVoiceName');
        speechState.preferredVoice = (savedName && speechState.voices.find(v => v.name === savedName))
            || speechState.spanishVoices[0]
            || null;
        console.log(`Found ${speechState.spanishVoices.length} Spanish voice(s)`, speechState.spanishVoices.map(v => v.name));
        console.log('Using voice:', speechState.preferredVoice ? speechState.preferredVoice.name : 'none');
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function getSelectedText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return '';
    return selection.toString().trim();
}

function speakText(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (speechState.preferredVoice) {
        utterance.voice = speechState.preferredVoice;
        utterance.lang = speechState.preferredVoice.lang;
    } else {
        utterance.lang = 'es-ES';
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
        speechState.isSpeaking = true;
        updateAudioStatus();
    };
    utterance.onend = () => {
        speechState.isSpeaking = false;
        updateAudioStatus();
    };
    utterance.onerror = (e) => {
        speechState.isSpeaking = false;
        updateAudioStatus();
        if (e.error !== 'canceled') {
            console.error('Speech synthesis error:', e.error);
            showToast('Audio playback failed: ' + e.error, 'error');
        }
    };
    window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
    window.speechSynthesis.cancel();
    speechState.isSpeaking = false;
    updateAudioStatus();
}

function updateAudioStatus() {
    const statusEl = document.getElementById('audioStatus');
    if (speechState.isSpeaking) {
        statusEl.classList.remove('hidden');
    } else {
        statusEl.classList.add('hidden');
    }
}

function updateFloatingPlayButton() {
    const btn = document.getElementById('floatingPlayBtn');
    const text = getSelectedText();
    if (!text) {
        btn.classList.add('hidden');
        return;
    }
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX + (rect.width / 2) - 40;
        if (left < 8) left = 8;
        if (left + 100 > window.innerWidth) left = window.innerWidth - 108;
        btn.style.top = top + 'px';
        btn.style.left = left + 'px';
        btn.classList.remove('hidden');
    }
}

function showContextMenu(x, y) {
    const menu = document.getElementById('customContextMenu');
    const text = getSelectedText();
    const playBtn = document.getElementById('ctxPlayNative');
    if (text) {
        playBtn.classList.remove('disabled');
        playBtn.style.pointerEvents = 'auto';
    } else {
        playBtn.classList.add('disabled');
        playBtn.style.pointerEvents = 'none';
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let menuX = x;
    let menuY = y;
    if (menuX + 220 > viewportWidth) menuX = viewportWidth - 220;
    if (menuY + 150 > viewportHeight) menuY = viewportHeight - 150;
    menu.style.left = menuX + 'px';
    menu.style.top = menuY + 'px';
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    document.getElementById('customContextMenu').classList.add('hidden');
}

function copySelectedText() {
    const text = getSelectedText();
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard', 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Copied to clipboard', 'success');
        });
    }
}

function setupAudioInteractions() {
    const lessonArea = document.getElementById('lessonArea');
    lessonArea.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.lesson-content')) {
            e.preventDefault();
            speechState.selectedText = getSelectedText();
            showContextMenu(e.pageX, e.pageY);
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#customContextMenu')) {
            hideContextMenu();
        }
    });
    document.addEventListener('scroll', hideContextMenu, true);
    document.addEventListener('mouseup', () => {
        setTimeout(updateFloatingPlayButton, 10);
    });
    document.addEventListener('selectionchange', () => {
        setTimeout(updateFloatingPlayButton, 10);
    });
    document.getElementById('floatingPlayBtn').addEventListener('click', () => {
        const text = getSelectedText();
        if (text) speakText(text);
        document.getElementById('floatingPlayBtn').classList.add('hidden');
    });
    document.getElementById('ctxPlayNative').addEventListener('click', () => {
        const text = getSelectedText();
        if (text) speakText(text);
        hideContextMenu();
    });
    document.getElementById('ctxStopAudio').addEventListener('click', () => {
        stopSpeech();
        hideContextMenu();
    });
    document.getElementById('ctxCopy').addEventListener('click', () => {
        copySelectedText();
        hideContextMenu();
    });
    document.getElementById('voiceSettingsBtn').addEventListener('click', openVoiceSettings);
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('#floatingPlayBtn')) {
            setTimeout(() => {
                if (!getSelectedText()) {
                    document.getElementById('floatingPlayBtn').classList.add('hidden');
                }
            }, 50);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            stopSpeech();
            hideContextMenu();
        }
    });
    setInterval(() => {
        if (speechState.isSpeaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
    }, 5000);
}

// ──────────────────────────── Init ────────────────────────────
async function init() {
    try {
        await openDB();
        state.topics = await dbGetAll('topics');
        state.subtopics = await dbGetAll('subtopics');
        state.lessons = await dbGetAll('lessons');

        // Sort by creation time
        state.topics.sort((a, b) => a.createdAt - b.createdAt);
        state.subtopics.sort((a, b) => a.createdAt - b.createdAt);

        renderTopics();
        renderLessonArea();
        await checkOllamaStatus();

        const levelSelect = document.getElementById('studyLevelSelect');
        if (levelSelect) levelSelect.value = state.currentStudyLevel;

        // Periodic status check
        setInterval(checkOllamaStatus, 15000);
        initSpeechSynthesis();
        setupAudioInteractions();
    } catch (err) {
        showToast('Failed to initialize database: ' + err.message, 'error');
    }

    // Persist custom model input
    const customInput = document.getElementById('customModelInput');
    if (customInput) {
        customInput.addEventListener('input', (e) => {
            localStorage.setItem('customOllamaModel', e.target.value);
        });
    }

    // Close modal on overlay click
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) hideModal();
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
    });
}

init();
