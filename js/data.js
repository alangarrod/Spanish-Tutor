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

async function saveLesson(subtopicId, content, modelName) {
    const existing = state.lessons.find(l => l.subtopicId === subtopicId);
    let lesson;
    if (existing) {
        existing.content = content;
        existing.updatedAt = Date.now();
        existing.modelName = modelName || existing.modelName || null;
        // Preserve any previously extracted flashcard vocabulary.
        if (existing.flashcardVocab === undefined) existing.flashcardVocab = null;
        await dbPut('lessons', existing);
        lesson = existing;
    } else {
        lesson = { id: 'l_' + Date.now(), subtopicId, content, flashcardVocab: null, createdAt: Date.now(), updatedAt: Date.now(), modelName: modelName || null };
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

// ──────────────── Story Operations ────────────────

async function addStory(title) {
    const story = { id: 'st_' + Date.now(), studyLevelId: state.currentStudyLevel, title: title.trim(), content: null, createdAt: Date.now(), updatedAt: null };
    await dbPut('stories', story);
    state.stories.push(story);
    renderTopics();
    renderLessonArea();
    return story;
}

async function deleteStory(storyId) {
    await dbDelete('stories', storyId);
    state.stories = state.stories.filter(s => s.id !== storyId);
    if (state.selectedStoryId === storyId) {
        state.selectedStoryId = null;
    }
    renderTopics();
    renderLessonArea();
}

async function saveStory(storyId, content, modelName) {
    const story = state.stories.find(s => s.id === storyId);
    if (!story) return null;
    story.content = content;
    story.updatedAt = Date.now();
    story.modelName = modelName || story.modelName || null;
    await dbPut('stories', story);
    return story;
}
