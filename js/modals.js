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
