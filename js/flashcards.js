// ──────────────────────────── Flashcards ────────────────────────────

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
    lesson.flashcardVocab = pairs.length > 0 ? pairs : null;
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
 */
function getCurrentFlashcards() {
    if (!state.selectedSubtopicId) return null;
    const lesson = state.lessons.find(l => l.subtopicId === state.selectedSubtopicId);
    if (!lesson || !lesson.flashcardVocab || lesson.flashcardVocab.length === 0) return null;
    return lesson.flashcardVocab;
}

/**
 * Open the flashcard practice modal for the current lesson.
 */
function showFlashcardsModal() {
    const cards = getCurrentFlashcards();
    if (!cards) {
        showToast('No flashcards available for this lesson.', 'info');
        return;
    }

    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    const title = subtopic ? subtopic.name : 'Flashcards';

    _flashcardState = {
        cards: shuffleArray([...cards]).map(c => ({ ...c, status: null })),
        currentIndex: 0,
        flipped: false,
        knownCount: 0
    };

    showModal(_buildFlashcardHtml(title));
    _updateFlashcardView();
}

let _flashcardState = null;

function _buildFlashcardHtml(title) {
    return `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-dark-gray">
                <i class="fa-solid fa-layer-group mr-2 text-pastel-blue"></i>Flashcards: ${escapeHtml(title)}
            </h3>
            <span class="text-xs text-medium-gray" id="flashcardCounter">1 / ${_flashcardState.cards.length}</span>
        </div>

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

    currentCard.status = rating;

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
