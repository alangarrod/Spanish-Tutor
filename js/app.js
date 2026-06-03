// ──────────────────────────── Curriculum Seeding ────────────────────────────
async function seedCurriculum() {
    const originalLevel = state.currentStudyLevel;
    const levelOrder = STUDY_LEVELS.map(l => l.id);

    for (const levelId of levelOrder) {
        const topics = CURRICULUM_DATA[levelId];
        if (!topics) continue;

        state.currentStudyLevel = levelId;

        for (const entry of topics) {
            const topic = await addTopic(entry.topic);
            await new Promise(r => setTimeout(r, 5));

            for (const subName of entry.subtopics) {
                await addSubtopic(topic.id, subName);
                await new Promise(r => setTimeout(r, 5));
            }
        }
    }

    state.currentStudyLevel = originalLevel;
    renderTopics();
    showToast('Curriculum seeded across all study levels!', 'success');
}

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

        // First-run: prompt to seed curriculum if no topics exist
        if (state.topics.length === 0) {
            showSeedPrompt();
        }

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
