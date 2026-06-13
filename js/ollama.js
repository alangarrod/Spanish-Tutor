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
    const prompt = `You are an expert, engaging Spanish language tutor. Generate a thorough instructional lesson on the following subtopic, tailored for a ${levelName} student.

Topic: ${topic}
Subtopic: ${subtopic}
Study Level: ${levelName}

Your lesson MUST include ALL of the following sections, clearly marked with markdown headers:

## Introduction
A clear overview of what this lesson covers, why it matters for Spanish learners, and how it fits into broader language use.

## Key Vocabulary
List 15-20 essential Spanish words/phrases related to this subtopic. Format each as: **Spanish word** — English translation

## Grammar & Rules
Explain the grammatical concepts thoroughly. Cover any important rules, exceptions, and variations. Include multiple examples in bold Spanish with English translations in parentheses.

## Example Sentences
Provide 10-12 example sentences demonstrating the concept across a range of contexts. Format each as:
- **Spanish sentence** (English translation)

## Flashcard Vocabulary (DO NOT SHOW IN LESSON)
After the visible lesson content, append a final section with the exact header above. Inside this section provide 8-12 English-Spanish word pairs drawn from the lesson vocabulary. These pairs are hidden from the main lesson view and used only for flashcard practice. Format each pair on its own line as:
- English word/phrase :: Spanish word/phrase

Write all explanations in English with Spanish examples. Be thorough and instructive. Use clear formatting.`;

    state.isGenerating = true;
    renderLessonArea();

    const streamPreviewEl = document.getElementById('streamPreview');
    if (streamPreviewEl) streamPreviewEl.textContent = '';

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

        const lesson = await saveLesson(state.selectedSubtopicId, fullContent, model);
        extractAndStoreFlashcards(lesson);
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

async function generateSubtopicSuggestions(topicName, existingSubtopics) {
    const model = getSelectedModel();
    const existingList = existingSubtopics.length > 0
        ? `Existing subtopics for this topic:\n${existingSubtopics.map(s => `- ${s}`).join('\n')}\n`
        : '';

    const prompt = `You are an expert Spanish language tutor. Suggest exactly 5 subtopic ideas for the topic "${topicName}".

${existingList}Requirements:
- Each subtopic should be 1 to 5 words long.
- Subtopics should be diverse and relevant to learning "${topicName}" in Spanish.
- Do NOT repeat any subtopic from the existing list above.
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

function buildStoryCurriculumContext() {
    const levelTopics = state.topics.filter(t => t.studyLevelId === state.currentStudyLevel);
    if (levelTopics.length === 0) return '';

    const lines = [];
    lines.push('The student is currently studying the following topics and subtopics. Try to naturally weave in relevant vocabulary and grammar from these areas, but keep the story fun and coherent:');
    for (const topic of levelTopics) {
        const topicSubs = state.subtopics.filter(s => s.topicId === topic.id);
        if (topicSubs.length > 0) {
            lines.push(`- ${topic.name}: ${topicSubs.map(s => s.name).join(', ')}`);
        } else {
            lines.push(`- ${topic.name}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}

// ──────────────── Story Generation ────────────────

async function generateStory(storyTitle) {
    const model = getSelectedModel();
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';
    const curriculumContext = buildStoryCurriculumContext();
    const prompt = `Eres un experto escritor de historias para estudiantes de español. Genera una historia en español para un estudiante de nivel ${levelName}.

Título de la historia: "${storyTitle}"
Nivel de estudio: ${levelName}

${curriculumContext}Escribe una historia de 400-500 palabras enteramente en español, apropiada para un estudiante de nivel ${levelName}. Usa vocabulario y gramática adecuados al nivel. La historia debe ser coherente, interesante y tener un principio, desarrollo y desenlace claros.

Escribe SOLAMENTE la historia en texto plano. No incluyas secciones adicionales, vocabulario, preguntas, ejercicios ni notas. No uses encabezados markdown ni formato especial — solo la narrativa.

IMPORTANTE: Escribe TODO el contenido enteramente en español. No uses inglés.`;

    state.isGenerating = true;
    renderLessonArea();

    const streamPreviewEl = document.getElementById('streamPreview');
    if (streamPreviewEl) streamPreviewEl.textContent = '';

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

        await saveStory(state.selectedStoryId, fullContent, model);
        showToast('Story generated and saved!', 'success');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        state.isGenerating = false;
        renderLessonArea();
    }
}

async function generateStoryTitleSuggestions(levelName, existingTitles) {
    const model = getSelectedModel();
    const existingList = existingTitles.length > 0
        ? `Existing story titles for this level:\n${existingTitles.map(t => `- ${t}`).join('\n')}\n`
        : '';
    const curriculumContext = buildStoryCurriculumContext();

    const prompt = `You are an expert Spanish language tutor and storyteller. Suggest exactly 5 Spanish story title ideas for a ${levelName} Spanish student.

${existingList}${curriculumContext}Requirements:
- Each title should be a short, catchy Spanish phrase (2-6 words).
- Titles should suggest engaging stories that help practice Spanish at the ${levelName} level.
- Do NOT repeat any title from the existing list above.
- Titles should be entirely in Spanish.
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

// ──────────────── Quiz Generation ────────────────

async function generateQuiz(lessonContent) {
    const model = getSelectedModel();
    const levelName = STUDY_LEVELS.find(l => l.id === state.currentStudyLevel)?.name || 'Lower Beginner';

    const prompt = `You are an expert Spanish language tutor. Based on the following lesson, generate exactly 7 multiple-choice quiz questions to test the student's understanding.

Study Level: ${levelName}

LESSON CONTENT:
${lessonContent}

Return ONLY valid JSON in this exact format, with no additional text before or after:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Rules:
- Generate exactly 7 questions
- Each question must have exactly 4 options
- "correct" is the 0-based index of the correct option
- Mix question types: vocabulary translation, fill-in-the-blank, and grammar rule questions
- Base all questions strictly on content from the lesson above
- Return ONLY the JSON object, no markdown fences, no other text`;

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
