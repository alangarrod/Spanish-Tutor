// ──────────────────────────── Rendering ────────────────────────────
function renderSelectionTip() {
    return `
        <div class="lesson-tip">
            <i class="fa-solid fa-volume-high text-deep-blue"></i>
            <span><strong>Tip:</strong> Select any Spanish text to hear it read aloud — or right-click for more options.</span>
        </div>`;
}

function renderTopics() {
    const container = document.getElementById('topicsList');
    const filter = state.searchFilter.toLowerCase();
    const filteredTopics = state.topics.filter(t =>
        t.name.toLowerCase().includes(filter) &&
        t.studyLevelId === state.currentStudyLevel
    );
    const levelStories = state.stories.filter(s => s.studyLevelId === state.currentStudyLevel);

    let html = '';

    // Review due banner
    const dueCount = getDueCardCount();
    if (dueCount > 0) {
        html += `
            <div class="mb-3 p-3 rounded-xl bg-soft-blue border border-pastel-blue/40 flex items-center justify-between animate-fade-in">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="w-8 h-8 rounded-full bg-pastel-blue text-white flex items-center justify-center text-sm font-bold flex-shrink-0">${dueCount}</div>
                    <div class="min-w-0">
                        <div class="text-sm font-bold text-dark-gray truncate">Review Due</div>
                        <div class="text-xs text-medium-gray truncate">${dueCount} card${dueCount === 1 ? '' : 's'} ready to practice</div>
                    </div>
                </div>
                <button onclick="showCramDueCardsModal()" class="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0">
                    <i class="fa-solid fa-layer-group"></i> Cram
                </button>
            </div>`;
    }

    // Topics section
    if (filteredTopics.length === 0) {
        const levelTopics = state.topics.filter(t => t.studyLevelId === state.currentStudyLevel);
        html += `
            <div class="text-center py-4 text-medium-gray text-sm">
                <i class="fa-solid fa-folder-open text-2xl mb-2 opacity-40"></i>
                <p>${levelTopics.length === 0 ? 'No topics for this level' : 'No matching topics'}</p>
            </div>`;
    } else {
        html += filteredTopics.map(topic => {
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

    // Stories section
    const storiesExpanded = state.storiesExpanded;
    const storyCount = levelStories.length;
    html += `
        <div class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center rounded-lg px-3 py-2 cursor-pointer group hover:bg-soft-blue transition-colors"
                 onclick="toggleStoriesSection()">
                <i class="fa-solid fa-chevron-right text-xs mr-2 transition-transform duration-200 ${storiesExpanded ? 'rotate-90' : ''}"></i>
                <i class="fa-solid fa-book-open text-xs mr-2 text-pastel-blue"></i>
                <span class="flex-1 font-medium text-sm">Stories</span>
                ${storyCount > 0 ? `<span class="text-xs bg-pastel-blue/30 text-dark-gray px-1.5 py-0.5 rounded-full font-medium">${storyCount}</span>` : ''}
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onclick="event.stopPropagation(); showAddStoryModal()"
                            class="w-6 h-6 rounded flex items-center justify-center hover:bg-white/30 text-xs" title="Add story">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
            ${storiesExpanded ? `
                <div class="ml-6 mt-1 space-y-0.5">
                    ${storyCount === 0 ? `
                        <div class="text-xs text-medium-gray py-2 px-3 italic">No stories yet</div>
                    ` : levelStories.map(story => {
                        const storyActive = state.selectedStoryId === story.id;
                        const hasContent = story.content !== null && story.content !== undefined;
                        return `
                            <div class="story-item flex items-center rounded-lg px-3 py-2 cursor-pointer group ${storyActive ? 'active' : ''}"
                                 onclick="selectStory('${story.id}')">
                                <i class="fa-solid fa-feather text-xs mr-2 ${hasContent ? 'text-green-400' : ''}"></i>
                                <span class="flex-1 text-sm truncate">${escapeHtml(story.title)}</span>
                                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="event.stopPropagation(); confirmDeleteStory('${story.id}', '${escapeAttr(story.title)}')"
                                            class="w-5 h-5 rounded flex items-center justify-center hover:bg-red-400/30" style="font-size:10px" title="Delete">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            ` : ''}
        </div>`;

    container.innerHTML = html;
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
            Generating...`;
        contextBar.innerHTML = '';
        return;
    }

    // Story display
    if (state.selectedStoryId) {
        const story = state.stories.find(s => s.id === state.selectedStoryId);
        if (!story) {
            state.selectedStoryId = null;
        } else {
            breadcrumb.innerHTML = `
                <i class="fa-solid fa-book-open mr-1"></i> Stories
                <i class="fa-solid fa-chevron-right mx-2 text-xs opacity-40"></i>
                <i class="fa-solid fa-feather mr-1"></i> ${escapeHtml(story.title)}`;

            contextBar.innerHTML = `
                <button onclick="requestGenerateStory()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> ${story.content ? 'Regenerate Story' : 'Generate Story'}
                </button>
                ${story.content ? `
                    <button onclick="confirmDeleteStory('${story.id}', '${escapeAttr(story.title)}')" class="btn-danger px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                ` : ''}
            `;

            if (story.content) {
                const lessonContent = document.getElementById('lessonContent');
                lessonContent.innerHTML = renderSelectionTip() + renderMarkdown(story.content);
                if (story.updatedAt) {
                    lessonContent.innerHTML += `
                        <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-medium-gray">
                            <i class="fa-regular fa-clock mr-1"></i> Last updated: ${new Date(story.updatedAt).toLocaleString()}${story.modelName ? ` <span class="mx-1">·</span> <i class="fa-solid fa-microchip mr-1"></i>${escapeHtml(story.modelName)}` : ''}
                        </div>`;
                }
                lessonDisplay.classList.remove('hidden');
            } else {
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <div class="w-20 h-20 rounded-full bg-soft-blue flex items-center justify-center mb-5">
                            <i class="fa-solid fa-feather text-3xl text-pastel-blue"></i>
                        </div>
                        <h3 class="text-xl font-bold text-dark-gray mb-2">No story content yet</h3>
                        <p class="text-medium-gray max-w-sm leading-relaxed">
                            Click "Generate Story" to have Ollama create a Spanish story for <strong>${escapeHtml(story.title)}</strong>.
                        </p>
                    </div>`;
            }
            return;
        }
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

    const hasFlashcards = lesson && Array.isArray(lesson.flashcardVocab) && lesson.flashcardVocab.length > 0;

    contextBar.innerHTML = `
        <button onclick="requestGenerateLesson()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ${lesson ? 'Regenerate Lesson' : 'Generate Lesson'}
        </button>
        ${lesson ? `
            <button onclick="showQuizModal()" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-circle-question"></i> Quiz Me
            </button>
            ${hasFlashcards ? `
                <button onclick="showFlashcardsModal()" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <i class="fa-solid fa-layer-group"></i> Flash Cards
                </button>
            ` : ''}
            <button onclick="toggleChatPanel()" class="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${state.chatPanelOpen ? 'ring-2 ring-pastel-blue' : ''}" title="Practice conversation with the tutor">
                <i class="fa-solid fa-comments"></i> Practice
            </button>
            <button onclick="confirmDeleteLesson('${lesson.id}')" class="btn-danger px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-trash"></i> Delete
            </button>
        ` : ''}
    `;

    if (lesson) {
        const lessonContent = document.getElementById('lessonContent');
        lessonContent.innerHTML = renderSelectionTip() + renderMarkdown(lesson.content);
        if (lesson.updatedAt) {
            lessonContent.innerHTML += `
                <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-medium-gray">
                    <i class="fa-regular fa-clock mr-1"></i> Last updated: ${new Date(lesson.updatedAt).toLocaleString()}${lesson.modelName ? ` <span class="mx-1">·</span> <i class="fa-solid fa-microchip mr-1"></i>${escapeHtml(lesson.modelName)}` : ''}
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
    state.selectedStoryId = null;
    state.chatPanelOpen = false;
    _activeChat = null;
    renderChatPanel();
    renderTopics();
    renderLessonArea();
}

function selectTopic(topicId) {
    state.selectedTopicId = state.selectedTopicId === topicId ? null : topicId;
    if (state.selectedTopicId !== topicId) state.selectedSubtopicId = null;
    state.selectedStoryId = null;
    renderTopics();
    renderLessonArea();
}

function selectSubtopic(subtopicId) {
    state.selectedSubtopicId = subtopicId;
    state.selectedStoryId = null;
    // If the practice panel is open, rebind it to the newly selected subtopic.
    if (state.chatPanelOpen) {
        _activeChat = null;
        openChatPanel();
    }
    renderTopics();
    renderLessonArea();
}

function selectStory(storyId) {
    state.selectedStoryId = storyId;
    state.selectedTopicId = null;
    state.selectedSubtopicId = null;
    renderTopics();
    renderLessonArea();
}

function toggleStoriesSection() {
    state.storiesExpanded = !state.storiesExpanded;
    renderTopics();
}

/**
 * Toggle the conversational practice panel. Only available when a subtopic
 * with a generated lesson is selected. When closing, drop the active chat
 * handle so a fresh one is resolved next time.
 */
async function toggleChatPanel() {
    if (state.chatPanelOpen) {
        closeChatPanel();
    } else {
        await openChatPanel();
    }
}
