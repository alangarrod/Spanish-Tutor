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
        <div class="flex justify-between items-center gap-2">
            <button onclick="fetchTopicSuggestions()" id="suggestBtn" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Topics
            </button>
            <div class="flex gap-2">
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
                <button onclick="submitAddTopic()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Topic</button>
            </div>
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
        <div class="flex justify-between items-center gap-2">
            <button onclick="fetchSubtopicSuggestions('${topicId}')" id="suggestSubtopicBtn" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Subtopics
            </button>
            <div class="flex gap-2">
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
                <button onclick="submitAddSubtopic('${topicId}')" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Subtopic</button>
            </div>
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

function parseSuggestions(response) {
    const suggestions = [];
    const regex = /^\d+\.\s*(.+)$/gm;
    let match;
    while ((match = regex.exec(response)) !== null) {
        suggestions.push(match[1].trim());
    }
    return suggestions;
}

async function fetchTopicSuggestions() {
    const input = document.getElementById('newTopicName');
    const currentInput = input ? input.value : '';

    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.disabled = true;
        suggestBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-pastel-blue"></i> Loading...';
    }

    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const existingTopics = state.topics
        .filter(t => t.studyLevelId === state.currentStudyLevel)
        .map(t => t.name);

    try {
        const response = await generateTopicSuggestions(levelName, existingTopics);
        const suggestions = parseSuggestions(response);
        if (suggestions.length === 0) {
            showToast('No suggestions received. Try again.', 'error');
            if (suggestBtn) {
                suggestBtn.disabled = false;
                suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Topics';
            }
            return;
        }
        renderSuggestionPhase(suggestions, currentInput);
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        if (suggestBtn) {
            suggestBtn.disabled = false;
            suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Topics';
        }
    }
}

function renderSuggestionPhase(suggestions, currentInput = '') {
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const suggestionsHtml = suggestions.map((s, i) => `
        <label class="suggestion-item">
            <input type="checkbox" id="suggestion_${i}" value="${escapeAttr(s)}" class="suggestion-checkbox">
            <span class="text-sm text-dark-gray">${escapeHtml(s)}</span>
        </label>
    `).join('');

    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-1"><i class="fa-solid fa-folder-plus mr-2 text-pastel-blue"></i>Add Topic</h3>
        <p class="text-sm text-medium-gray mb-3">Suggested topics for <strong>${escapeHtml(levelName)}</strong></p>

        <input type="text" id="newTopicName" placeholder="Or type your own topic..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-3 text-sm"
            value="${escapeAttr(currentInput)}"
            onkeydown="if(event.key==='Enter')submitSuggestedTopics()">

        <div class="suggestion-list mb-4">
            ${suggestionsHtml}
        </div>

        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitSuggestedTopics()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Selected</button>
        </div>
    `);
}

async function submitSuggestedTopics() {
    const input = document.getElementById('newTopicName');
    const inputName = input ? input.value.trim() : '';

    const checkboxes = document.querySelectorAll('#modalContent input[type="checkbox"]:checked');
    const selectedNames = Array.from(checkboxes).map(cb => cb.value.trim()).filter(v => v);

    if (!inputName && selectedNames.length === 0) {
        if (input) input.classList.add('ring-2', 'ring-red-300');
        showToast('Please select at least one suggestion or enter a topic name.', 'error');
        return;
    }

    const namesToAdd = [...selectedNames];
    if (inputName) namesToAdd.push(inputName);

    const addedTopics = [];
    for (const name of namesToAdd) {
        const topic = await addTopic(name);
        addedTopics.push(topic);
    }

    hideModal();

    if (addedTopics.length > 0) {
        selectTopic(addedTopics[0].id);
        showToast(`${addedTopics.length} topic(s) added!`, 'success');
    }
}

async function fetchSubtopicSuggestions(topicId) {
    const input = document.getElementById('newSubtopicName');
    const currentInput = input ? input.value : '';

    const suggestBtn = document.getElementById('suggestSubtopicBtn');
    if (suggestBtn) {
        suggestBtn.disabled = true;
        suggestBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-pastel-blue"></i> Loading...';
    }

    const topic = state.topics.find(t => t.id === topicId);
    const topicName = topic ? topic.name : '';
    const existingSubtopics = state.subtopics
        .filter(s => s.topicId === topicId)
        .map(s => s.name);

    try {
        const response = await generateSubtopicSuggestions(topicName, existingSubtopics);
        const suggestions = parseSuggestions(response);
        if (suggestions.length === 0) {
            showToast('No suggestions received. Try again.', 'error');
            if (suggestBtn) {
                suggestBtn.disabled = false;
                suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Subtopics';
            }
            return;
        }
        renderSubtopicSuggestionPhase(suggestions, topicId, currentInput);
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        if (suggestBtn) {
            suggestBtn.disabled = false;
            suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Subtopics';
        }
    }
}

function renderSubtopicSuggestionPhase(suggestions, topicId, currentInput = '') {
    const topic = state.topics.find(t => t.id === topicId);
    const topicName = topic ? topic.name : '';
    const suggestionsHtml = suggestions.map((s, i) => `
        <label class="suggestion-item">
            <input type="checkbox" id="subtopicSuggestion_${i}" value="${escapeAttr(s)}" class="suggestion-checkbox">
            <span class="text-sm text-dark-gray">${escapeHtml(s)}</span>
        </label>
    `).join('');

    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-1"><i class="fa-solid fa-book-medical mr-2 text-pastel-blue"></i>Add Subtopic</h3>
        <p class="text-sm text-medium-gray mb-3">Suggested subtopics for <strong>${escapeHtml(topicName)}</strong></p>

        <input type="text" id="newSubtopicName" placeholder="Or type your own subtopic..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-3 text-sm"
            value="${escapeAttr(currentInput)}"
            onkeydown="if(event.key==='Enter')submitSuggestedSubtopics('${topicId}')">

        <div class="suggestion-list mb-4">
            ${suggestionsHtml}
        </div>

        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitSuggestedSubtopics('${topicId}')" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Selected</button>
        </div>
    `);
}

async function submitSuggestedSubtopics(topicId) {
    const input = document.getElementById('newSubtopicName');
    const inputName = input ? input.value.trim() : '';

    const checkboxes = document.querySelectorAll('#modalContent input[type="checkbox"]:checked');
    const selectedNames = Array.from(checkboxes).map(cb => cb.value.trim()).filter(v => v);

    if (!inputName && selectedNames.length === 0) {
        if (input) input.classList.add('ring-2', 'ring-red-300');
        showToast('Please select at least one suggestion or enter a subtopic name.', 'error');
        return;
    }

    const namesToAdd = [...selectedNames];
    if (inputName) namesToAdd.push(inputName);

    for (const name of namesToAdd) {
        await addSubtopic(topicId, name);
    }

    hideModal();
    renderLessonArea();
    showToast(`${namesToAdd.length} subtopic(s) added!`, 'success');
}

// ──────────────── Story Modals ────────────────

function showAddStoryModal() {
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-1"><i class="fa-solid fa-feather mr-2 text-pastel-blue"></i>Add Story</h3>
        <p class="text-sm text-medium-gray mb-4">For: <strong>${escapeHtml(levelName)}</strong></p>
        <input type="text" id="newStoryTitle" placeholder="e.g., El Viaje Inesperado, Una Carta a Mi Abuela..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-4 text-sm"
            onkeydown="if(event.key==='Enter')submitAddStory()">
        <div class="flex justify-between items-center gap-2">
            <button onclick="fetchStoryTitleSuggestions()" id="suggestStoryBtn" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Story Titles
            </button>
            <div class="flex gap-2">
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
                <button onclick="submitAddStory()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Story</button>
            </div>
        </div>
    `);
}

async function submitAddStory() {
    const input = document.getElementById('newStoryTitle');
    const title = input.value.trim();
    if (!title) { input.classList.add('ring-2', 'ring-red-300'); return; }
    const story = await addStory(title);
    hideModal();
    selectStory(story.id);
    showToast(`Story "${title}" added!`, 'success');
}

async function fetchStoryTitleSuggestions() {
    const input = document.getElementById('newStoryTitle');
    const currentInput = input ? input.value : '';

    const suggestBtn = document.getElementById('suggestStoryBtn');
    if (suggestBtn) {
        suggestBtn.disabled = true;
        suggestBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-pastel-blue"></i> Loading...';
    }

    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const existingTitles = state.stories
        .filter(s => s.studyLevelId === state.currentStudyLevel)
        .map(s => s.title);

    try {
        const response = await generateStoryTitleSuggestions(levelName, existingTitles);
        const suggestions = parseSuggestions(response);
        if (suggestions.length === 0) {
            showToast('No suggestions received. Try again.', 'error');
            if (suggestBtn) {
                suggestBtn.disabled = false;
                suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Story Titles';
            }
            return;
        }
        renderStoryTitleSuggestionPhase(suggestions, currentInput);
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        if (suggestBtn) {
            suggestBtn.disabled = false;
            suggestBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles text-pastel-blue"></i> Suggest Story Titles';
        }
    }
}

function renderStoryTitleSuggestionPhase(suggestions, currentInput = '') {
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const suggestionsHtml = suggestions.map((s, i) => `
        <label class="suggestion-item">
            <input type="checkbox" id="storySuggestion_${i}" value="${escapeAttr(s)}" class="suggestion-checkbox">
            <span class="text-sm text-dark-gray">${escapeHtml(s)}</span>
        </label>
    `).join('');

    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-1"><i class="fa-solid fa-feather mr-2 text-pastel-blue"></i>Add Story</h3>
        <p class="text-sm text-medium-gray mb-3">Suggested story titles for <strong>${escapeHtml(levelName)}</strong></p>

        <input type="text" id="newStoryTitle" placeholder="Or type your own story title..."
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue mb-3 text-sm"
            value="${escapeAttr(currentInput)}"
            onkeydown="if(event.key==='Enter')submitSuggestedStoryTitles()">

        <div class="suggestion-list mb-4">
            ${suggestionsHtml}
        </div>

        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitSuggestedStoryTitles()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Add Selected</button>
        </div>
    `);
}

async function submitSuggestedStoryTitles() {
    const input = document.getElementById('newStoryTitle');
    const inputTitle = input ? input.value.trim() : '';

    const checkboxes = document.querySelectorAll('#modalContent input[type="checkbox"]:checked');
    const selectedTitles = Array.from(checkboxes).map(cb => cb.value.trim()).filter(v => v);

    if (!inputTitle && selectedTitles.length === 0) {
        if (input) input.classList.add('ring-2', 'ring-red-300');
        showToast('Please select at least one suggestion or enter a story title.', 'error');
        return;
    }

    const titlesToAdd = [...selectedTitles];
    if (inputTitle) titlesToAdd.push(inputTitle);

    const addedStories = [];
    for (const title of titlesToAdd) {
        const story = await addStory(title);
        addedStories.push(story);
    }

    hideModal();

    if (addedStories.length > 0) {
        selectStory(addedStories[0].id);
        showToast(`${addedStories.length} story(ies) added!`, 'success');
    }
}

function confirmDeleteStory(storyId, title) {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i>Delete Story</h3>
        <p class="text-sm text-medium-gray mb-4">Delete <strong>"${escapeHtml(title)}"</strong>? This cannot be undone.</p>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="executeDeleteStory('${storyId}')" class="btn-danger px-5 py-2 rounded-lg text-sm font-bold">Delete</button>
        </div>
    `);
}

async function executeDeleteStory(storyId) {
    await deleteStory(storyId);
    hideModal();
    showToast('Story deleted', 'info');
}

function requestGenerateStory() {
    const story = state.stories.find(s => s.id === state.selectedStoryId);
    if (!story) return;

    if (story.content) {
        showModal(`
            <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-2 text-pastel-blue"></i>Regenerate Story</h3>
            <p class="text-sm text-medium-gray mb-4">This will replace the existing story for <strong>"${escapeHtml(story.title)}"</strong>. Continue?</p>
            <div class="flex justify-end gap-2">
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
                <button onclick="startStoryGeneration()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Regenerate</button>
            </div>
        `);
    } else {
        startStoryGeneration();
    }
}

async function startStoryGeneration() {
    hideModal();
    const story = state.stories.find(s => s.id === state.selectedStoryId);
    if (!story) return;
    await generateStory(story.title);
}
