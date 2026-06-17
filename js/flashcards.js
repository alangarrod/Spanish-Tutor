// ──────────────────────────── Flashcards ────────────────────────────

// SM-2 spaced-repetition defaults.
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Convert a legacy { front, back } pair (or a freshly generated pair) into a
 * full spaced-repetition card. New cards are immediately due.
 */
function createFlashcard(pair) {
    return {
        front: pair.front,
        back: pair.back,
        ease: DEFAULT_EASE,
        interval: 0,
        dueAt: 0,
        reps: 0,
        lapses: 0,
        lastReviewed: null
    };
}

/**
 * Ensure every card in a lesson's flashcardVocab has the SM-2 scheduling
 * fields. Legacy cards created before this feature are upgraded in-place.
 */
function normalizeFlashcards(cards) {
    if (!Array.isArray(cards)) return [];
    let changed = false;
    const normalized = cards.map(c => {
        if (c.ease === undefined || c.interval === undefined || c.dueAt === undefined) {
            changed = true;
            return createFlashcard(c);
        }
        return c;
    });
    return { cards: normalized, changed };
}

/**
 * Extract the hidden flashcard vocabulary list from a generated lesson's raw
 * content, store it on the lesson record, and strip it from the rendered view.
 */
function extractAndStoreFlashcards(lesson) {
    if (!lesson || !lesson.content) return;

    const sectionMarker = /##\s*Flashcard Vocabulary\s*\(DO NOT SHOW IN LESSON\)/i;
    const parts = lesson.content.split(sectionMarker);
    const visibleContent = parts[0].trim();
    const flashcardSection = parts[1] ? parts[1].trim() : '';

    const pairs = parseFlashcardPairs(flashcardSection);

    lesson.content = visibleContent;
    lesson.flashcardVocab = pairs.length > 0 ? pairs.map(createFlashcard) : null;
    lesson.updatedAt = Date.now();

    dbPut('lessons', lesson).catch(err => {
        console.error('Failed to save flashcard vocabulary:', err);
    });
}

/**
 * Parse lines formatted as "- English :: Spanish" or "English :: Spanish".
 * Returns an array of { front, back } objects where front is English and back is Spanish.
 */
function parseFlashcardPairs(text) {
    if (!text) return [];
    const pairs = [];
    const lines = text.split('\n');
    const separator = /\s*::\s*/;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        // Strip leading markdown list markers.
        const cleaned = line.replace(/^[\-*•]\s+/, '');
        if (!cleaned || !separator.test(cleaned)) continue;

        const [front, ...rest] = cleaned.split(separator);
        const back = rest.join(' :: ').trim();
        if (front && back) {
            pairs.push({ front: front.trim(), back: back });
        }
    }

    return pairs;
}

/**
 * Return the flashcard vocabulary for the currently selected lesson, or null.
 * Migrates legacy cards on first access and persists the upgrade.
 */
function getCurrentFlashcards() {
    if (!state.selectedSubtopicId) return null;
    const lesson = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);
    if (!lesson || !lesson.flashcardVocab || lesson.flashcardVocab.length === 0) return null;

    const { cards, changed } = normalizeFlashcards(lesson.flashcardVocab);
    if (changed) {
        lesson.flashcardVocab = cards;
        lesson.updatedAt = Date.now();
        dbPut('lessons', lesson).catch(err => {
            console.error('Failed to upgrade flashcard scheduling:', err);
        });
    }
    return cards;
}

/**
 * Apply an SM-2 schedule update to a card based on the user's rating.
 * - 'known' treats the review as successful.
 * - 'learning' treats it as a lapse and resets the interval.
 */
function scheduleCard(card, rating) {
    const now = Date.now();

    if (rating === 'known') {
        card.reps = (card.reps || 0) + 1;
        if (card.reps === 1) {
            card.interval = 1;
        } else if (card.reps === 2) {
            card.interval = 6;
        } else {
            card.interval = Math.max(1, Math.round(card.interval * card.ease));
        }
        card.dueAt = now + card.interval * DAY_MS;
    } else if (rating === 'learning') {
        card.lapses = (card.lapses || 0) + 1;
        card.reps = 0;
        card.interval = 1;
        card.ease = Math.max(MIN_EASE, (card.ease || DEFAULT_EASE) - 0.2);
        card.dueAt = now + DAY_MS;
    }

    card.lastReviewed = now;
}

/**
 * Migrate any legacy { front, back } flashcardVocab entries across all loaded
 * lessons so they have SM-2 scheduling fields. Returns the number of lessons
 * that were upgraded. Persists upgrades to IndexedDB.
 */
async function migrateAllFlashcards() {
    let upgraded = 0;
    for (const lesson of state.lessons) {
        if (!lesson.flashcardVocab || lesson.flashcardVocab.length === 0) continue;
        const { cards, changed } = normalizeFlashcards(lesson.flashcardVocab);
        if (changed) {
            lesson.flashcardVocab = cards;
            lesson.updatedAt = Date.now();
            await dbPut('lessons', lesson);
            upgraded++;
        }
    }
    return upgraded;
}

/**
 * Count flashcards across all lessons that are due now (or new).
 */
function getDueCardCount() {
    const now = Date.now();
    let count = 0;
    for (const lesson of state.lessons) {
        if (!lesson.flashcardVocab || lesson.flashcardVocab.length === 0) continue;
        for (const card of lesson.flashcardVocab) {
            if ((card.dueAt || 0) <= now) count++;
        }
    }
    return count;
}

/**
 * Build a flat list of all due cards, each tagged with the lesson/subtopic
 * they belong to so the cram session can show context.
 */
function getAllDueCards() {
    const now = Date.now();
    const due = [];
    for (const lesson of state.lessons) {
        if (!lesson.flashcardVocab || lesson.flashcardVocab.length === 0) continue;
        const subtopic = state.subtopics.find(s => s.id === lesson.subtopicId);
        const topic = subtopic ? state.topics.find(t => t.id === subtopic.topicId) : null;
        for (const card of lesson.flashcardVocab) {
            if ((card.dueAt || 0) <= now) {
                due.push({
                    card,
                    lessonId: lesson.id,
                    subtopicId: lesson.subtopicId,
                    subtopicName: subtopic?.name || 'Unknown',
                    topicName: topic?.name || ''
                });
            }
        }
    }
    return due;
}

/**
 * Open the flashcard practice modal for the current lesson.
 * Only shows cards that are due now (or new), respecting the SM-2 schedule.
 */
function showFlashcardsModal() {
    const allCards = getCurrentFlashcards();
    if (!allCards) {
        showToast('No flashcards available for this lesson.', 'info');
        return;
    }

    const now = Date.now();
    const dueCards = allCards.filter(c => (c.dueAt || 0) <= now);

    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    const lesson = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);
    const title = subtopic ? subtopic.name : 'Flashcards';

    if (dueCards.length === 0) {
        const nextDue = Math.min(...allCards.map(c => c.dueAt || 0));
        const nextDueText = nextDue > 0 ? new Date(nextDue).toLocaleDateString() : 'soon';
        showModal(`
            <div class="text-center py-6">
                <i class="fa-solid fa-circle-check text-4xl text-green-400 mb-3"></i>
                <h3 class="text-lg font-bold text-dark-gray mb-2">All Caught Up!</h3>
                <p class="text-sm text-medium-gray mb-4">You've reviewed all flashcards for this lesson.</p>
                <p class="text-xs text-medium-gray mb-5">Next review: <strong class="text-dark-gray">${escapeHtml(nextDueText)}</strong></p>
                <button onclick="hideModal()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Close</button>
            </div>
        `);
        return;
    }

    _flashcardState = {
        mode: 'lesson',
        lessonId: lesson?.id || null,
        cards: shuffleArray([...dueCards]).map(c => ({ ...c, status: null })),
        currentIndex: 0,
        flipped: false,
        knownCount: 0
    };

    showModal(_buildFlashcardHtml(title));
    _updateFlashcardView();
}

let _flashcardState = null;

function _buildFlashcardHtml(title) {
    const showContext = _flashcardState.mode === 'cram' && _flashcardState.cards.length > 0;
    const contextLabel = showContext
        ? `<div class="text-xs text-medium-gray text-center mb-2 truncate px-4">
               <i class="fa-solid fa-folder-open mr-1"></i>${escapeHtml(_flashcardState.cards[_flashcardState.currentIndex]._sourceTopicName || '')}
               <i class="fa-solid fa-chevron-right mx-1 text-[10px]"></i>
               <i class="fa-solid fa-book mr-1"></i>${escapeHtml(_flashcardState.cards[_flashcardState.currentIndex]._sourceSubtopicName || '')}
           </div>`
        : '';

    return `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-dark-gray">
                <i class="fa-solid fa-layer-group mr-2 text-pastel-blue"></i>Flashcards: ${escapeHtml(title)}
            </h3>
            <span class="text-xs text-medium-gray" id="flashcardCounter">1 / ${_flashcardState.cards.length}</span>
        </div>

        ${contextLabel}

        <div class="flashcard-container" onclick="flipFlashcard()">
            <div class="flashcard" id="flashcard">
                <div class="flashcard-face flashcard-front" id="flashcardFront"></div>
                <div class="flashcard-face flashcard-back" id="flashcardBack"></div>
            </div>
        </div>

        <p class="text-xs text-center text-medium-gray mt-2 mb-4">Click the card to flip · Use the buttons below to mark your confidence</p>

        <div class="flex items-center justify-center gap-3 mb-4">
            <button onclick="markFlashcard('learning')" class="flashcard-btn flashcard-btn-learning flex items-center gap-1.5">
                <i class="fa-solid fa-book-open"></i> Still Learning
            </button>
            <button onclick="markFlashcard('known')" class="flashcard-btn flashcard-btn-known flex items-center gap-1.5">
                <i class="fa-solid fa-check"></i> Got It
            </button>
        </div>

        <div class="flex items-center justify-between gap-2 pt-4 border-t border-gray-100">
            <button onclick="prevFlashcard()" class="px-3 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100 flex items-center gap-1">
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>
            <div class="text-xs text-medium-gray">
                <span class="text-green-600 font-medium" id="flashcardKnown">0</span> known ·
                <span class="text-amber-600 font-medium" id="flashcardLearning">0</span> learning
            </div>
            <button onclick="nextFlashcard()" class="px-3 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100 flex items-center gap-1">
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>

        <div class="flex justify-end mt-3">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Close</button>
        </div>
    `;
}

function _updateFlashcardView() {
    if (!_flashcardState) return;

    const card = _flashcardState.cards[_flashcardState.currentIndex];
    const cardEl = document.getElementById('flashcard');
    const frontEl = document.getElementById('flashcardFront');
    const backEl = document.getElementById('flashcardBack');
    const counterEl = document.getElementById('flashcardCounter');
    const knownEl = document.getElementById('flashcardKnown');
    const learningEl = document.getElementById('flashcardLearning');

    if (!cardEl || !frontEl || !backEl) return;

    const known = _flashcardState.knownCount;
    const learning = _flashcardState.cards.filter(c => c.status === 'learning').length;

    cardEl.classList.toggle('flipped', _flashcardState.flipped);
    frontEl.textContent = card.front;
    backEl.textContent = card.back;

    if (counterEl) counterEl.textContent = `${_flashcardState.currentIndex + 1} / ${_flashcardState.cards.length}`;
    if (knownEl) knownEl.textContent = known;
    if (learningEl) learningEl.textContent = learning;
}

function flipFlashcard() {
    if (!_flashcardState) return;
    _flashcardState.flipped = !_flashcardState.flipped;
    _updateFlashcardView();
}

function nextFlashcard() {
    if (!_flashcardState) return;
    _flashcardState.currentIndex = (_flashcardState.currentIndex + 1) % _flashcardState.cards.length;
    _flashcardState.flipped = false;
    _updateFlashcardView();
}

function prevFlashcard() {
    if (!_flashcardState) return;
    _flashcardState.currentIndex = (_flashcardState.currentIndex - 1 + _flashcardState.cards.length) % _flashcardState.cards.length;
    _flashcardState.flipped = false;
    _updateFlashcardView();
}

function markFlashcard(rating) {
    if (!_flashcardState) return;

    const currentCard = _flashcardState.cards[_flashcardState.currentIndex];
    const previousStatus = currentCard.status;

    if (previousStatus === rating) {
        // Same rating again: just advance without changing counts.
        _flashcardState.flipped = false;
        _flashcardState.currentIndex = (_flashcardState.currentIndex + 1) % _flashcardState.cards.length;
        _updateFlashcardView();
        return;
    }

    // Apply the spaced-repetition schedule to the underlying card.
    scheduleCard(currentCard, rating);
    currentCard.status = rating;

    // Persist the updated schedule BEFORE removing the card from the session deck,
    // otherwise 'known' cards are gone before we can copy their new dueAt back.
    if (_flashcardState.mode === 'cram') {
        _persistCramSchedule();
    } else {
        _persistFlashcardSchedule();
    }

    if (rating === 'known') {
        _flashcardState.knownCount++;
        _flashcardState.cards.splice(_flashcardState.currentIndex, 1);
    } else if (rating === 'learning') {
        _flashcardState.cards.splice(_flashcardState.currentIndex, 1);
        _flashcardState.cards.push(currentCard);
    }

    _flashcardState.flipped = false;

    if (_flashcardState.cards.length === 0) {
        _renderFlashcardCompletion();
        return;
    }

    if (_flashcardState.currentIndex >= _flashcardState.cards.length) {
        _flashcardState.currentIndex = 0;
    }

    _updateFlashcardView();
}

/**
 * Write the current scheduling state back to the lesson record in IndexedDB.
 * Called after every rating so mastery survives across sessions.
 *
 * The session cards are shallow copies, so we explicitly copy the SM-2
 * scheduling fields back onto the original cards in lesson.flashcardVocab.
 */
function _persistFlashcardSchedule() {
    if (!_flashcardState || !_flashcardState.lessonId) return;
    const lesson = state.lessons.find(l => l.id === _flashcardState.lessonId);
    if (!lesson || !lesson.flashcardVocab) return;

    const SCHEDULING_FIELDS = ['ease', 'interval', 'dueAt', 'reps', 'lapses', 'lastReviewed'];

    for (const sessionCard of _flashcardState.cards) {
        const original = lesson.flashcardVocab.find(
            c => c.front === sessionCard.front && c.back === sessionCard.back
        );
        if (!original) continue;
        for (const field of SCHEDULING_FIELDS) {
            if (sessionCard[field] !== undefined) {
                original[field] = sessionCard[field];
            }
        }
    }

    lesson.updatedAt = Date.now();
    dbPut('lessons', lesson).catch(err => {
        console.error('Failed to persist flashcard schedule:', err);
    });

    // Refresh the due-card badge in the sidebar.
    renderTopics();
}

/**
 * Open a cram session built from every due card across all lessons.
 * Each card keeps a reference to its source lesson so scheduling updates
 * can be persisted back to the correct lesson.
 */
function showCramDueCardsModal() {
    const due = getAllDueCards();
    if (due.length === 0) {
        showToast('No cards are due right now.', 'info');
        return;
    }

    _flashcardState = {
        mode: 'cram',
        cards: shuffleArray(due).map(item => ({
            ...item.card,
            status: null,
            _sourceLessonId: item.lessonId,
            _sourceSubtopicName: item.subtopicName,
            _sourceTopicName: item.topicName
        })),
        currentIndex: 0,
        flipped: false,
        knownCount: 0
    };

    showModal(_buildFlashcardHtml('Review Due Cards'));
    _updateFlashcardView();
}

/**
 * Persist scheduling updates for a cram session. Because cards may come from
 * many lessons, we batch updates by lesson and write each one back.
 */
function _persistCramSchedule() {
    if (!_flashcardState || _flashcardState.mode !== 'cram') return;

    const SCHEDULING_FIELDS = ['ease', 'interval', 'dueAt', 'reps', 'lapses', 'lastReviewed'];
    const updates = new Map();

    for (const lesson of state.lessons) {
        if (!lesson.flashcardVocab) continue;
        for (const card of lesson.flashcardVocab) {
            for (const sessionCard of _flashcardState.cards) {
                if (sessionCard._sourceLessonId !== lesson.id) continue;
                if (sessionCard.front !== card.front || sessionCard.back !== card.back) continue;
                for (const field of SCHEDULING_FIELDS) {
                    if (sessionCard[field] !== undefined) {
                        card[field] = sessionCard[field];
                    }
                }
                updates.set(lesson.id, lesson);
            }
        }
    }

    for (const lesson of updates.values()) {
        lesson.updatedAt = Date.now();
        dbPut('lessons', lesson).catch(err => {
            console.error('Failed to persist cram schedule:', err);
        });
    }

    renderTopics();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function _renderFlashcardCompletion() {
    const container = document.getElementById('modalContent');
    if (!container) return;

    const known = _flashcardState.knownCount;
    const learning = _flashcardState.cards.filter(c => c.status === 'learning').length;
    const total = known + learning;
    const pct = total > 0 ? Math.round((known / total) * 100) : 0;
    const scoreColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-500' : 'text-red-500';
    const message = pct >= 80 ? '¡Excelente!' : pct >= 60 ? '¡Bien hecho!' : '¡Sigue estudiando!';

    container.innerHTML = `
        <div class="text-center py-6">
            <i class="fa-solid fa-trophy text-4xl text-pastel-blue mb-3"></i>
            <h3 class="text-lg font-bold text-dark-gray mb-1">Session Complete!</h3>
            <p class="text-sm text-medium-gray mb-4">${escapeHtml(message)}</p>
            <div class="text-3xl font-bold ${scoreColor} mb-1">${known} / ${total}</div>
            <p class="text-xs text-medium-gray mb-5">${pct}% known · ${learning} marked for review</p>
            <button onclick="showFlashcardsModal()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold mr-2">Restart</button>
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Close</button>
        </div>
    `;
}

// Keyboard shortcuts for flashcards.
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    if (!_flashcardState) return;

    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipFlashcard();
    } else if (e.key === 'ArrowRight') {
        nextFlashcard();
    } else if (e.key === 'ArrowLeft') {
        prevFlashcard();
    } else if (e.key === 'k' || e.key === 'K') {
        markFlashcard('known');
    } else if (e.key === 'l' || e.key === 'L') {
        markFlashcard('learning');
    }
});
