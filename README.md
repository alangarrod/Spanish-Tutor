# 🇪🇸 Spanish Tutor — Ollama

A beautiful, single-page web application for learning Spanish, powered by your local **Ollama** instance. Generate structured lessons with AI, listen to native pronunciation, and organize your study material — all stored locally in your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20Tailwind%20CSS%20%7C%20IndexedDB-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Lesson Generation** | Creates structured lessons via local Ollama LLMs (streaming response support) |
| 💡 **AI Topic Suggestions** | Ask Ollama for topic ideas tailored to your current study level — pick and add the ones you like |
| 💡 **AI Subtopic Suggestions** | Ask Ollama for subtopic ideas under any topic — pick and add the ones you like |
| 🌱 **Default Curriculum** | On first run, optionally seed ~5 topics × ~3 subtopics per study level as a starting point |
| 🗂️ **Topic Hierarchy** | Organise content as Topics → Subtopics → Lessons |
| 🎯 **6 Study Levels** | Lower Beginner → Upper Beginner → Lower Intermediate → Upper Intermediate → Lower Advanced → Upper Advanced |
| 🔊 **Native Speech** | Right-click any Spanish text to hear it spoken in a native accent |
| 📝 **Markdown Rendering** | Rich, beautifully formatted lessons with headers, lists, bold text and more |
| ❓ **On-Demand Quizzes** | Generate throw-away multiple-choice quizzes from any lesson to test your understanding — not persisted, just practice |
| 💾 **Local-First Storage** | Everything lives in your browser via IndexedDB — no cloud required |
| 🎨 **Pastel UI** | Clean, modern interface built with Tailwind CSS and custom animations |
| 🔍 **Search & Filter** | Quickly find topics within your current study level |
| ⚙️ **Model Selector** | Choose any installed Ollama model, or enter a custom model tag |
| 🗑️ **Safe Deletion** | Confirm before deleting topics, subtopics or lessons |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Browser["🌐 Browser"]
        UI["🎨 UI Layer<br/>Tailwind CSS + FontAwesome"]
        State["⚡ State Manager<br/>state.js"]
        Render["🖼️ Render Engine<br/>render.js"]
        Modals["🪟 Modals<br/>modals.js"]
        Speech["🔊 Speech Synthesis<br/>speech.js"]
        Markdown["📝 Markdown Parser<br/>markdown.js"]
    end

    subgraph Data["💾 Data Layer"]
        DB[("📦 IndexedDB<br/>SpanishTutorDB")]
        LocalStorage[("🗄️ localStorage<br/>Prefs & Settings")]
    end

    subgraph AI["🤖 AI Layer"]
        Ollama["🦙 Ollama API<br/>localhost:11434"]
    end

    UI --> State
    State --> Render
    Render --> UI
    State --> DB
    DB --> State
    UI --> Modals
    UI --> Speech
    Render --> Markdown
    State --> Ollama
    Ollama --> State
    UI --> LocalStorage
    LocalStorage --> UI
```

---

## 📊 Data Model

```mermaid
erDiagram
    STUDY_LEVEL ||--o{ TOPIC : contains
    TOPIC ||--o{ SUBTOPIC : has
    SUBTOPIC ||--o{ LESSON : contains

    STUDY_LEVEL {
        string id
        string name
    }

    TOPIC {
        string id
        string name
        string studyLevelId
        number createdAt
    }

    SUBTOPIC {
        string id
        string topicId
        string name
        number createdAt
    }

    LESSON {
        string id
        string subtopicId
        string content
        number createdAt
        number updatedAt
    }
```

---

## 🎯 User Flow

```mermaid
flowchart TD
    Start(["👤 User Opens App"]) --> Init["⚙️ Initialise DB & State"]
    Init --> EmptyCheck{"📋 Any topics<br/>in DB?"}
    EmptyCheck -->|"Yes"| Render["🖼️ Render Topic Sidebar"]
    EmptyCheck -->|"No"| SeedPrompt["🌱 Show Seed Prompt"]
    SeedPrompt -->|"Yes, seed"| SeedCurriculum["📚 Seed Default Curriculum"]
    SeedPrompt -->|"No, start blank"| Render
    SeedCurriculum --> Render
    Render --> SelectLevel["📚 Select Study Level"]
    SelectLevel --> SuggestTopic["💡 Suggest Topics (AI)"]
    SuggestTopic --> AddTopic["➕ Add Topic"]
    SelectLevel --> AddTopic
    AddTopic --> SuggestSubtopic["💡 Suggest Subtopics (AI)"]
    SuggestSubtopic --> AddSubtopic["➕ Add Subtopic"]
    AddTopic --> AddSubtopic
    AddSubtopic --> Generate["✨ Generate Lesson"]
    Generate --> Streaming["📡 Stream Response from Ollama"]
    Streaming --> Save["💾 Save to IndexedDB"]
    Save --> Display["📖 Display Formatted Lesson"]
    Display --> Listen["🔊 Listen to Pronunciation"]
    Display --> Regenerate["🔄 Regenerate if Needed"]
    Regenerate --> Streaming
    Display --> Copy["📋 Copy Text"]
```

---

## 📁 Project Structure

```mermaid
graph LR
    HTML["📄 Spanish-Tutor.html"] --> CSS["🎨 spanish-tutor.css"]
    HTML --> JS["📁 js/"]

    JS --> app["⚡ app.js<br/>Entry point & init"]
    JS --> state["🧠 state.js<br/>Global state & levels"]
    JS --> utils["🔧 utils.js<br/>Helpers"]
    JS --> db["🗄️ db.js<br/>IndexedDB wrapper"]
    JS --> toast["🍞 toast.js<br/>Notifications"]
    JS --> markdown["📝 markdown.js<br/>MD → HTML"]
    JS --> render["🖼️ render.js<br/>DOM updates"]
    JS --> data["💾 data.js<br/>CRUD operations"]
    JS --> ollama["🦙 ollama.js<br/>LLM API client"]
    JS --> modals["🪟 modals.js<br/>Modal dialogs"]
    JS --> speech["🔊 speech.js<br/>TTS & voice settings"]
    JS --> curriculum["🌱 curriculum.js<br/>Default curriculum data"]

    style HTML fill:#AEC6CF,stroke:#333,stroke-width:2px,color:#1a1a1a
    style CSS fill:#D6EAF8,stroke:#333,stroke-width:2px,color:#1a1a1a
    style JS fill:#F0F0F0,stroke:#333,stroke-width:2px,color:#1a1a1a
    style app fill:#85B8CC,stroke:#333,stroke-width:2px,color:#1a1a1a
    style ollama fill:#6BA3BE,stroke:#333,stroke-width:2px,color:#fff
    style speech fill:#6BA3BE,stroke:#333,stroke-width:2px,color:#fff
    style db fill:#AEC6CF,stroke:#333,stroke-width:2px,color:#1a1a1a
    style render fill:#D6EAF8,stroke:#333,stroke-width:2px,color:#1a1a1a
```

---

## 🚀 Quick Start

1. **Install & run Ollama**
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ollama serve
   # In another terminal:
   ollama pull llama3.2
   ```

2. **Open the app**
   Simply open `Spanish-Tutor.html` in any modern browser (Chrome, Edge, Firefox).
   > No build step required — it's pure HTML + JS + CSS!

3. **Start learning!**
   - On first run, you'll be prompted to seed a default curriculum (~5 topics × ~3 subtopics per study level) — accept for a ready-made starting point, or decline to start from scratch
   - Select your study level from the dropdown
   - Add topics manually, or click **Suggest Topics** in the Add Topic modal to get AI-generated ideas
   - Add subtopics manually, or click **Suggest Subtopics** in the Add Subtopic modal to get AI-generated ideas
   - Click **Generate Lesson** and watch Ollama craft your personalised Spanish content

---

## 🛠️ Tech Stack

| Technology | Role |
|------------|------|
| **Vanilla JavaScript** | No frameworks — lightweight and fast |
| **Tailwind CSS** (CDN) | Utility-first styling with custom pastel theme |
| **FontAwesome** (CDN) | Beautiful icons throughout the UI |
| **IndexedDB** | Offline-capable, structured local storage |
| **Web Speech API** | Native Spanish text-to-speech |
| **Ollama API** | Local LLM inference for lesson generation |

---

## 📝 Lesson Format

Each generated lesson includes the following sections:

1. **Introduction** — Overview of what the lesson covers
2. **Key Vocabulary** — 8–12 essential Spanish words/phrases
3. **Grammar & Rules** — Clear explanations with bold Spanish examples
4. **Example Sentences** — 6–8 practical sentences with translations

---

## 🎨 Customisation

### Study Levels
The 6 built-in proficiency levels are defined in `js/state.js`:

```javascript
const STUDY_LEVELS = [
    { id: 'lb', name: 'Lower Beginner' },
    { id: 'ub', name: 'Upper Beginner' },
    { id: 'li', name: 'Lower Intermediate' },
    { id: 'ui', name: 'Upper Intermediate' },
    { id: 'la', name: 'Lower Advanced' },
    { id: 'ua', name: 'Upper Advanced' }
];
```

### Theme Colours
Pastel palette defined in `Spanish-Tutor.html` via Tailwind config:

| Token | Hex | Usage |
|-------|-----|-------|
| `pastel-blue` | `#AEC6CF` | Primary accent, header, active states |
| `soft-blue` | `#D6EAF8` | Backgrounds, empty states |
| `hover-blue` | `#85B8CC` | Button hover states |
| `deep-blue` | `#6BA3BE` | Icons, emphasis |
| `card-bg` | `#F8FBFD` | Card/sidebar backgrounds |

---

## 🔊 Audio Features

- **Right-click** any Spanish text inside a lesson to see a context menu with:
  - 🎵 **Play in native voice**
  - ⏹️ **Stop audio**
  - 📋 **Copy to clipboard**
- **Text selection** reveals a floating "Play" button
- **Voice settings** (gear icon in header) let you choose your preferred Spanish voice
- Automatically detects and prioritises local Spanish voices

## ❓ Quiz Features

Lessons no longer include an embedded quiz — instead, you can generate **optional, on-demand multiple-choice quizzes** for any lesson whenever you want to test yourself:

- Click **Quiz Me** in the lesson toolbar to instantly generate 5 multiple-choice questions based on the current lesson content
- Quizzes are **throw-away / unpersisted** — they exist only for the session and are not stored in IndexedDB
- Receive immediate feedback with correct answers, explanations, and a score summary
- Perfect for quick self-testing before moving on to a new topic

---

## 📸 Screenshots

> *(Recommended: Add screenshots of the main UI, a generated lesson, and the voice settings modal)*

---

## 🤝 Contributing

Contributions welcome! The codebase is intentionally simple and modular — each `js/*.js` file has a single responsibility.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-thing`
3. Commit your changes: `git commit -am 'Add amazing thing'`
4. Push to the branch: `git push origin feature/amazing-thing`
5. Open a Pull Request

---

## 📜 License

MIT License — feel free to use, modify, and share!

---

<p align="center">
  <em>¡Buena suerte con tu español! 🎉</em>
</p>
