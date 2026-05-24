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
