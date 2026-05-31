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

// ──────────────── Quiz Modal ────────────────

let _quizQuestions = null;

async function showQuizModal() {
    const lesson = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);
    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    if (!lesson) return;

    showModal(`
        <div class="flex flex-col items-center justify-center py-10">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-pastel-blue mb-4"></i>
            <p class="text-dark-gray font-medium">Generating quiz...</p>
            <p class="text-sm text-medium-gray mt-1">This may take a moment</p>
        </div>
    `);

    try {
        const raw = await generateQuiz(lesson.content);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Model did not return valid JSON. Try again.');
        const quizData = JSON.parse(jsonMatch[0]);
        if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
            throw new Error('No questions returned. Try again.');
        }
        _renderQuizQuestions(quizData.questions, subtopic?.name || 'Lesson');
    } catch (err) {
        document.getElementById('modalContent').innerHTML = `
            <div class="text-center py-6">
                <i class="fa-solid fa-circle-exclamation text-3xl text-red-400 mb-3"></i>
                <p class="text-dark-gray font-medium mb-1">Failed to generate quiz</p>
                <p class="text-sm text-medium-gray mb-5">${escapeHtml(err.message)}</p>
                <button onclick="hideModal()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Close</button>
            </div>
        `;
    }
}

function _renderQuizQuestions(questions, subtopicName) {
    _quizQuestions = questions;

    const questionsHtml = questions.map((q, qi) => `
        <div class="mb-5">
            <p class="text-sm font-semibold text-dark-gray mb-2">${qi + 1}. ${escapeHtml(q.question)}</p>
            <div class="space-y-1.5">
                ${q.options.map((opt, oi) => `
                    <label class="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-soft-blue transition-colors text-sm">
                        <input type="radio" name="q${qi}" value="${oi}" class="accent-pastel-blue flex-shrink-0">
                        ${escapeHtml(opt)}
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.getElementById('modalContent').innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-dark-gray">
                <i class="fa-solid fa-circle-question mr-2 text-pastel-blue"></i>Quiz: ${escapeHtml(subtopicName)}
            </h3>
            <span class="text-xs text-medium-gray">${questions.length} questions</span>
        </div>
        <div class="max-h-[60vh] overflow-y-auto pr-1" id="quizQuestionsContainer">
            ${questionsHtml}
        </div>
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="submitQuiz()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">
                <i class="fa-solid fa-check mr-1.5"></i>Submit Answers
            </button>
        </div>
    `;
}

function submitQuiz() {
    const questions = _quizQuestions;
    if (!questions) return;

    let score = 0;

    const resultsHtml = questions.map((q, qi) => {
        const selected = document.querySelector(`input[name="q${qi}"]:checked`);
        const userAnswer = selected ? parseInt(selected.value, 10) : -1;
        const isCorrect = userAnswer === q.correct;
        if (isCorrect) score++;

        const optionsHtml = q.options.map((opt, oi) => {
            let cls = 'border-gray-200 text-dark-gray bg-white';
            let icon = '';
            if (oi === q.correct) {
                cls = 'border-green-400 bg-green-50 text-green-800 font-medium';
                icon = '<i class="fa-solid fa-check text-green-500 ml-auto flex-shrink-0"></i>';
            } else if (oi === userAnswer) {
                cls = 'border-red-300 bg-red-50 text-red-700';
                icon = '<i class="fa-solid fa-xmark text-red-400 ml-auto flex-shrink-0"></i>';
            }
            return `
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg border ${cls} text-sm">
                    <span class="flex-1">${escapeHtml(opt)}</span>${icon}
                </div>`;
        }).join('');

        return `
            <div class="mb-5">
                <div class="flex items-start gap-2 mb-2">
                    <i class="fa-solid ${isCorrect ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'} mt-0.5 flex-shrink-0"></i>
                    <p class="text-sm font-semibold text-dark-gray">${qi + 1}. ${escapeHtml(q.question)}</p>
                </div>
                <div class="space-y-1.5 ml-5">
                    ${optionsHtml}
                    ${q.explanation ? `
                        <p class="text-xs text-medium-gray mt-2 italic">
                            <i class="fa-solid fa-lightbulb mr-1 text-amber-400"></i>${escapeHtml(q.explanation)}
                        </p>` : ''}
                </div>
            </div>`;
    }).join('');

    const pct = Math.round((score / questions.length) * 100);
    const scoreColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-500' : 'text-red-500';
    const scoreMsg = pct >= 80 ? '¡Excelente!' : pct >= 60 ? '¡Bien hecho!' : '¡Sigue estudiando!';

    _quizQuestions = null;

    document.getElementById('modalContent').innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-dark-gray">
                <i class="fa-solid fa-trophy mr-2 text-pastel-blue"></i>Quiz Results
            </h3>
            <div class="text-right">
                <div class="text-2xl font-bold ${scoreColor}">${score}/${questions.length}</div>
                <div class="text-xs font-medium ${scoreColor}">${scoreMsg}</div>
            </div>
        </div>
        <div class="max-h-[60vh] overflow-y-auto pr-1">
            ${resultsHtml}
        </div>
        <div class="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <button onclick="hideModal()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Done</button>
        </div>
    `;
}
