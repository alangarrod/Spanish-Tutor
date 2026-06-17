# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a **no-build, no-test, no-lint** project. There is no `package.json`, bundler, or test framework.

- **Run the app:** Open `Spanish-Tutor.html` directly in a modern browser, or serve it with a static HTTP server:
  ```bash
  python -m http.server 8080
  ```
- **Ollama requirement:** AI features require Ollama running on `http://localhost:11434`.

## Architecture

### No ES Modules — Global Scope

All JS files share the global scope. `Spanish-Tutor.html` loads `<script>` tags in strict dependency order. **Do not use `import`/`export`.** When adding a new JS file, insert its `<script>` tag in `Spanish-Tutor.html` after any files it depends on.

Loading order:
1. `js/state.js` — defines `db`, `STUDY_LEVELS`, `state`
2. `js/utils.js` — `escapeHtml`, `escapeAttr`
3. `js/db.js` — IndexedDB wrappers (depends on `db`)
4. `js/toast.js`, `js/markdown.js`
5. `js/render.js` — DOM rendering (depends on `state`)
6. `js/data.js` — CRUD (depends on `state`, `db.js`)
7. `js/ollama.js`, `js/modals.js`, `js/flashcards.js`, `js/speech.js`, `js/chat.js`, `js/curriculum.js`
8. `js/app.js` — entry point, calls `init()`

### State as Single Source of Truth

The `state` object (in `js/state.js`) holds all in-memory data:
- `topics`, `subtopics`, `lessons`, `stories`, `chats`
- `selectedTopicId`, `selectedSubtopicId`, `selectedStoryId`
- `chatPanelOpen`, `chatIsSending`
- `currentStudyLevel` (persisted to `localStorage` as `CurrentLevel`)

**Pattern:** mutate `state`, then call the relevant `render*` function (e.g., `renderTopics()`, `renderLessonArea()`). Never manipulate DOM data directly.

### IndexedDB (`SpanishTutorDB`, version 6)

Promise-based wrappers in `js/db.js`: `dbGetAll`, `dbPut`, `dbDelete`, `dbGetByIndex`. Stores: `topics`, `subtopics`, `lessons`, `studyLevels`, `stories`, `chats`. Do not access `indexedDB` directly outside `js/db.js`.

### Tailwind CSS (CDN)

Tailwind and FontAwesome are loaded from CDN inside `Spanish-Tutor.html`. Custom theme tokens are defined inline in the Tailwind config. Use the custom tokens (e.g., `bg-pastel-blue`, `text-dark-gray`) instead of raw hex values.

| Token | Value |
|-------|-------|
| `pastel-blue` | `#AEC6CF` |
| `soft-blue` | `#D6EAF8` |
| `hover-blue` | `#85B8CC` |
| `deep-blue` | `#6BA3BE` |
| `light-gray` | `#F0F0F0` |
| `dark-gray` | `#4A4A4A` |
| `medium-gray` | `#8A8A8A` |
| `card-bg` | `#F8FBFD` |

### Ollama Integration

- Base URL: `http://localhost:11434`
- Model is read at runtime from `#modelSelect` / `#customModelInput`
- Lesson generation uses streaming `/api/generate` — append chunks to the DOM as they arrive; do not buffer the full response
- Do not hardcode model names

## Data Model

```
STUDY_LEVEL (lb | ub | li | ui | la | ua)
  └── TOPIC          { id: "t_{timestamp}", name, studyLevelId, createdAt }
        └── SUBTOPIC { id: "s_{timestamp}", topicId, name, createdAt }
              └── LESSON { id: "l_{timestamp}", subtopicId, content, flashcardVocab, createdAt, updatedAt }
                    └── CHAT { id: "ch_{timestamp}", subtopicId, topicName, subtopicName, studyLevelId, messages, createdAt, updatedAt }
  └── STORY          { id: "st_{timestamp}", studyLevelId, title, content, createdAt, updatedAt }
```

### Flashcard scheduling

Each entry in `lesson.flashcardVocab` is a spaced-repetition card with SM-2 fields:
`{ front, back, ease, interval, dueAt, reps, lapses, lastReviewed }`.
- New cards are immediately due (`dueAt: 0`).
- "Got It" advances the interval using the easiness factor.
- "Still Learning" resets the interval to 1 day and lowers `ease` (minimum 1.3).
- `getDueCardCount()` / `getAllDueCards()` aggregate due cards across all lessons.
- `showFlashcardsModal()` only shows due cards for the current lesson; `showCramDueCardsModal()` mixes due cards from every lesson.

### Chat messages

Each `chat.messages` entry is `{ role: 'user' | 'assistant', content: string }`. The tutor is called via Ollama's streaming `/api/chat` endpoint with the full message history plus a system prompt scoped to the current subtopic/lesson.

## Coding Conventions

- **Section headers:** `// ──────────────── Section Name ────────────────`
- **camelCase** for all functions and variables
- **XSS prevention:** always use `escapeHtml()` when inserting user strings into `innerHTML`; always use `escapeAttr()` when embedding user strings in inline HTML attributes (e.g., `onclick="fn('${escapeAttr(name)}')"`)
- **Modals:** build content as an HTML string and pass to `showModal(html)`
- **Toasts:** `showToast(message, type)` — types are `'success'`, `'error'`, `'info'`
- **Async DB ops:** use the promise-based helpers in `js/db.js`

## Adding a New Feature

1. **State** — add fields to `state` in `js/state.js`
2. **DB** — if persistence is needed, add a new object store in `js/db.js` (`onupgradeneeded`) and bump the DB version
3. **Data** — add CRUD helpers in `js/data.js`; keep them async and update `state` in-memory after each DB write
4. **Render** — add/update render functions in `js/render.js`
5. **UI** — add HTML in `Spanish-Tutor.html` using existing Tailwind tokens and component patterns
6. **Script tag** — add `<script src="js/newfile.js">` in `Spanish-Tutor.html` after its dependencies

## What to Avoid

- Do not introduce frameworks (React, Vue, etc.), npm, or bundlers
- Do not inline large blocks of JS in HTML — add a new file in `js/` instead
- Do not access IndexedDB outside `js/db.js`
- Do not render user content via `innerHTML` without calling `escapeHtml()` first
- Do not modify `STUDY_LEVELS` in `js/state.js`
