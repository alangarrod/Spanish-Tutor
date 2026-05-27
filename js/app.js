// ──────────────────────────── Init ────────────────────────────
async function init() {
    try {
        await openDB();
        state.topics = await dbGetAll('topics');
        state.subtopics = await dbGetAll('subtopics');
        state.lessons = await dbGetAll('lessons');
        state.stories = await dbGetAll('stories');

        // Sort by creation time
        state.topics.sort((a, b) => a.createdAt - b.createdAt);
        state.subtopics.sort((a, b) => a.createdAt - b.createdAt);
        state.stories.sort((a, b) => a.createdAt - b.createdAt);

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
