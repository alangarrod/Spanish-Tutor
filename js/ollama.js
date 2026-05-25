// ──────────────────────────── Ollama API ────────────────────────────
let availableModels = [];

async function checkOllamaStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    try {
        const response = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
        if (response.ok) {
            statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
            statusText.textContent = 'Connected';
            const data = await response.json();
            availableModels = data.models || [];
            populateModelSelect();
        } else {
            throw new Error();
        }
    } catch {
        statusDot.className = 'w-2 h-2 rounded-full bg-red-400';
        statusText.textContent = 'Disconnected';
        availableModels = [];
        populateModelSelect();
    }
}

function populateModelSelect() {
    const select = document.getElementById('modelSelect');
    const saved = localStorage.getItem('selectedOllamaModel');
    select.innerHTML = '';

    if (availableModels.length === 0) {
        select.innerHTML = '<option value="">No models found</option>';
    } else {
        availableModels.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            const size = (m.details && m.details.parameter_size) || '';
            const quant = (m.details && m.details.quantization_level) || '';
            const meta = [size, quant].filter(Boolean).join(' ');
            opt.textContent = meta ? `${m.name} (${meta})` : m.name;
            select.appendChild(opt);
        });
    }

    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = 'Custom...';
    select.appendChild(customOpt);

    if (saved && (availableModels.some(m => m.name === saved) || saved === '__custom__')) {
        select.value = saved;
    } else if (availableModels.length > 0) {
        select.value = availableModels[0].name;
    }
    handleModelChange();
}

function handleModelChange() {
    const select = document.getElementById('modelSelect');
    const customInput = document.getElementById('customModelInput');
    const value = select.value;
    localStorage.setItem('selectedOllamaModel', value);
    if (value === '__custom__') {
        customInput.classList.remove('hidden');
        if (document.activeElement !== customInput) {
            const savedCustom = localStorage.getItem('customOllamaModel') || '';
            customInput.value = savedCustom;
        }
    } else {
        customInput.classList.add('hidden');
    }
}

function getSelectedModel() {
    const select = document.getElementById('modelSelect');
    const customInput = document.getElementById('customModelInput');
    if (select.value === '__custom__') {
        return customInput.value.trim() || 'llama3.2';
    }
    return select.value || 'llama3.2';
}

async function generateLesson(topic, subtopic) {
    const model = getSelectedModel();
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const prompt = `You are an expert, engaging Spanish language tutor. Generate a comprehensive lesson on the following subtopic, tailored for a ${levelName} student.

Topic: ${topic}
Subtopic: ${subtopic}
Study Level: ${levelName}

Your lesson MUST include ALL of the following sections, clearly marked with markdown headers:

## Introduction
Brief overview of what this lesson covers and why it's important for Spanish learners.

## Key Vocabulary
List 8-12 essential Spanish words/phrases related to this subtopic. Format each as: **Spanish word** — English translation

## Grammar & Rules
Explain the grammatical concepts clearly with examples in bold Spanish and English translations in parentheses.

## Example Sentences
Provide 6-8 example sentences demonstrating the concept. Format each as:
- **Spanish sentence** (English translation)

## Practice Exercises
Create 5 fill-in-the-blank or translation exercises for the student to practice.

## Mini Quiz
Create a 4-question multiple choice quiz. Format as:
**Q#:** Question text
- A) Option
- B) Option  
- C) Option
- D) Option
**Answer:** X

## Cultural Note
Share a brief interesting cultural fact related to this topic.

Write explanations in English with Spanish examples. Be thorough but concise. Use clear formatting.`;

    state.isGenerating = true;
    renderLessonArea();

    let fullContent = '';

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: true })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ollama error: ${response.status} - ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const streamPreview = document.getElementById('streamPreview');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        fullContent += json.response;
                        if (streamPreview) {
                            streamPreview.textContent = fullContent.slice(-500);
                            streamPreview.scrollTop = streamPreview.scrollHeight;
                        }
                    }
                    if (json.error) throw new Error(json.error);
                } catch (parseErr) {
                    // skip malformed lines
                }
            }
        }

        const lesson = await saveLesson(state.selectedSubtopicId, fullContent);
        showToast('Lesson generated and saved!', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        state.isGenerating = false;
        renderLessonArea();
    }
}

async function generateTopicSuggestions(levelName, existingTopics) {
    const model = getSelectedModel();
    const existingList = existingTopics.length > 0
        ? `Existing topics for this level:\n${existingTopics.map(t => `- ${t}`).join('\n')}\n`
        : '';

    const prompt = `You are an expert Spanish language tutor. Suggest exactly 5 topic ideas for a ${levelName} Spanish student.

${existingList}Requirements:
- Each topic should be 1 to 4 words long.
- Topics should be diverse and relevant to Spanish language learning at the ${levelName} level.
- Do NOT repeat any topic from the existing list above.
- Return ONLY a numbered list (1. to 5.) with no extra commentary.`;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.response || '';
}
