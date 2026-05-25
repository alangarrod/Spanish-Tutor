# AGENTS.md — Spanish Tutor (Ollama)

Guidance for agentic coding assistants working in this repository.

---

## Project Overview

A single-page, no-build web application for learning Spanish powered by a locally running [Ollama](https://ollama.com) instance. All data is stored in the browser via IndexedDB. There is no server, no npm, no bundler, and no test framework.

---

## Running the App

Open `Spanish-Tutor.html` directly in a browser, or serve it with any static HTTP server:

```powershell
# Simple option with Python
python -m http.server 8080
```

Ollama must be running on `http://localhost:11434` for AI features to work.

---

## File Structure

| File | Purpose |
|------|---------|
| `Spanish-Tutor.html` | Entry point — all `<script>` tags, inline Tailwind config, HTML structure |
| `spanish-tutor.css` | Custom CSS (animations, component styles not covered by Tailwind) |
| `js/state.js` | Global `state` object, `STUDY_LEVELS` constant, `db` variable |
| `js/db.js` | IndexedDB helpers — `openDB`, `dbGetAll`, `dbPut`, `dbDelete` |
| `js/data.js` | CRUD operations — `addTopic`, `deleteTopic`, `addSubtopic`, `deleteSubtopic`, lesson save/delete |
| `js/app.js` | Initialisation (`init()`), selection handlers (`selectTopic`, `selectSubtopic`) |
| `js/render.js` | DOM rendering — `renderTopics()`, `renderLessonArea()` |
| `js/ollama.js` | Ollama API — `checkOllamaStatus`, `generateLesson`, `fetchTopicSuggestions`, model selector |
| `js/modals.js` | Modal system — `showModal(html)`, `hideModal()`, all modal builder functions |
| `js/speech.js` | Web Speech API — `initSpeechSynthesis`, `speakText`, `stopSpeech` |
| `js/toast.js` | Toast notifications — `showToast(message, type)` |
| `js/markdown.js` | Custom Markdown-to-HTML parser — `renderMarkdown(text)` |
| `js/utils.js` | XSS helpers — `escapeHtml(str)`, `escapeAttr(str)` |

All script tags are loaded in `Spanish-Tutor.html` in dependency order. **There are no ES modules** — every function is in the global scope.

---

## Architecture

- **No build step.** Do not introduce npm, bundlers, or transpilers.
- **No ES modules.** All JS files share the global scope. Do not use `import`/`export`.
- **No external dependencies beyond CDN.** Tailwind CSS and Font Awesome are loaded from CDN inside `Spanish-Tutor.html`. Do not add new CDN links without updating the HTML file.
- **Single source of truth.** The `state` object (defined in `state.js`) holds all in-memory application data. Always update `state` and then call the relevant `render*` function — never manipulate DOM data directly.

---

## Data Model

```
STUDY_LEVEL (lb | ub | li | ui | la | ua)
  └── TOPIC          { id: "t_{timestamp}", name, studyLevelId, createdAt }
        └── SUBTOPIC { id: "s_{timestamp}", topicId, name, createdAt }
              └── LESSON { id: "l_{timestamp}", subtopicId, content, createdAt, updatedAt }
```

IDs are prefixed strings: `t_` for topics, `s_` for subtopics, `l_` for lessons, followed by `Date.now()`.

**IndexedDB database:** `SpanishTutorDB` (version 3)  
**Stores:** `topics`, `subtopics`, `lessons`, `studyLevels`

**localStorage keys:**

| Key | Purpose |
|-----|---------|
| `CurrentLevel` | Active study level ID (`lb`, `ub`, etc.) |
| `selectedOllamaModel` | Last chosen model name |
| `customOllamaModel` | Value of the custom model text input |
| `preferredVoiceName` | Preferred Web Speech API voice name |

---

## Coding Conventions

- **Section headers** use the format: `// ──────────────── Section Name ────────────────`
- **camelCase** for all functions and variables.
- **Always use `escapeHtml()`** when inserting user-supplied strings into innerHTML to prevent XSS.
- **Always use `escapeAttr()`** when embedding user-supplied strings in inline HTML attribute values (e.g., `onclick="fn('${escapeAttr(name)}')`).
- Modal content is built as an HTML string and passed to `showModal(html)`.
- User feedback goes through `showToast(message, type)` — types are `'success'`, `'error'`, `'info'`.
- Async DB operations use the promise-based helpers in `db.js`; never access `db` directly outside that file.

---

## Tailwind CSS

Tailwind is loaded from CDN with a custom config defined inline in `Spanish-Tutor.html`. Custom theme tokens:

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

Use these tokens (e.g., `text-dark-gray`, `bg-pastel-blue`) instead of raw hex values or generic Tailwind grays to keep the UI consistent.

---

## Ollama Integration

- Base URL: `http://localhost:11434`
- Model is read at runtime from the `#modelSelect` dropdown (or `#customModelInput`).
- Lesson generation uses the streaming `/api/generate` endpoint — append chunks to the DOM as they arrive; do not buffer the full response.
- Do not hardcode a model name anywhere in the source.

---

## Adding a New Feature — Checklist

1. **State** — add any new fields to the `state` object in `state.js`.
2. **DB** — if persistence is needed, add a new object store in `db.js` (`onupgradeneeded`) and bump the DB version.
3. **Data** — add CRUD helpers in `data.js`; keep them async and update `state` in-memory after each DB write.
4. **Render** — add or update render functions in `render.js`; call them after state mutations.
5. **UI** — add HTML structure in `Spanish-Tutor.html`; use existing Tailwind tokens and component patterns.
6. **Script tag** — if adding a new JS file, add a `<script src="js/newfile.js">` tag in `Spanish-Tutor.html` **after** any files it depends on.

---

## What to Avoid

- Do not introduce a framework (React, Vue, etc.).
- Do not add a package.json or node_modules.
- Do not inline large blocks of JS directly in HTML — add a new file in `js/` instead.
- Do not access IndexedDB outside `db.js`.
- Do not render user content via innerHTML without calling `escapeHtml()` first.
- Do not modify `STUDY_LEVELS` in `state.js` — it is the canonical level list used throughout the app.
