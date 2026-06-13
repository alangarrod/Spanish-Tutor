// ──────────────────────────── Speech Synthesis ────────────────────────────
const speechState = {
    voices: [],
    spanishVoices: [],
    preferredVoice: null,
    isSpeaking: false,
    selectedText: ''
};

function initSpeechSynthesis() {
    const loadVoices = () => {
        speechState.voices = window.speechSynthesis.getVoices();
        speechState.spanishVoices = speechState.voices.filter(v =>
            v.lang && v.lang.toLowerCase().startsWith('es')
        );
        speechState.spanishVoices.sort((a, b) => {
            const aLocal = a.localService ? 1 : 0;
            const bLocal = b.localService ? 1 : 0;
            if (bLocal !== aLocal) return bLocal - aLocal;
            return b.lang.length - a.lang.length;
        });
        const savedName = localStorage.getItem('preferredVoiceName');
        speechState.preferredVoice = (savedName && speechState.voices.find(v => v.name === savedName))
            || speechState.spanishVoices[0]
            || null;
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function getSelectedText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return '';
    return selection.toString().trim();
}

function speakText(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (speechState.preferredVoice) {
        utterance.voice = speechState.preferredVoice;
        utterance.lang = speechState.preferredVoice.lang;
    } else {
        utterance.lang = 'es-ES';
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
        speechState.isSpeaking = true;
        updateAudioStatus();
    };
    utterance.onend = () => {
        speechState.isSpeaking = false;
        updateAudioStatus();
    };
    utterance.onerror = (e) => {
        speechState.isSpeaking = false;
        updateAudioStatus();
        if (e.error !== 'canceled') {
            console.error('Speech synthesis error:', e.error);
            showToast('Audio playback failed: ' + e.error, 'error');
        }
    };
    window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
    window.speechSynthesis.cancel();
    speechState.isSpeaking = false;
    updateAudioStatus();
}

function updateAudioStatus() {
    const statusEl = document.getElementById('audioStatus');
    if (speechState.isSpeaking) {
        statusEl.classList.remove('hidden');
    } else {
        statusEl.classList.add('hidden');
    }
}

function updateFloatingPlayButton() {
    const btn = document.getElementById('floatingPlayBtn');
    const text = getSelectedText();
    if (!text) {
        btn.classList.add('hidden');
        return;
    }
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX + (rect.width / 2) - 40;
        if (left < 8) left = 8;
        if (left + 100 > window.innerWidth) left = window.innerWidth - 108;
        btn.style.top = top + 'px';
        btn.style.left = left + 'px';
        btn.classList.remove('hidden');
    }
}

function showContextMenu(x, y) {
    const menu = document.getElementById('customContextMenu');
    const text = getSelectedText();
    const playBtn = document.getElementById('ctxPlayNative');
    if (text) {
        playBtn.classList.remove('disabled');
        playBtn.style.pointerEvents = 'auto';
    } else {
        playBtn.classList.add('disabled');
        playBtn.style.pointerEvents = 'none';
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let menuX = x;
    let menuY = y;
    if (menuX + 220 > viewportWidth) menuX = viewportWidth - 220;
    if (menuY + 150 > viewportHeight) menuY = viewportHeight - 150;
    menu.style.left = menuX + 'px';
    menu.style.top = menuY + 'px';
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    document.getElementById('customContextMenu').classList.add('hidden');
}

function copySelectedText() {
    const text = getSelectedText();
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard', 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Copied to clipboard', 'success');
        });
    }
}

function openVoiceSettings() {
    const voices = speechState.spanishVoices.length > 0 ? speechState.spanishVoices : speechState.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    const saved = localStorage.getItem('preferredVoiceName');

    let optionsHtml = '';
    if (voices.length === 0) {
        optionsHtml = '<option value="">No voices available yet (try again in a moment)</option>';
    } else {
        for (const v of voices) {
            const selected = (saved === v.name) ? 'selected' : '';
            const localTag = v.localService ? ' (Local)' : ' (Cloud)';
            optionsHtml += `<option value="${escapeAttr(v.name)}" ${selected}>${escapeHtml(v.name + localTag)}</option>`;
        }
    }

    const autoSelected = saved ? '' : 'selected';
    optionsHtml = `<option value="" ${autoSelected}>Auto (best Spanish voice)</option>` + optionsHtml;

    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-gear mr-2 text-pastel-blue"></i>Voice Settings</h3>
        <div class="voice-settings-form">
            <label for="voiceSelect">Preferred Spanish Voice</label>
            <select id="voiceSelect" onchange="handleVoiceChange()">
                ${optionsHtml}
            </select>
            <p class="hint">Choose the voice you prefer for native playback. Changes apply immediately.</p>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="testVoice()" class="btn-primary px-4 py-2 rounded-lg text-sm font-bold">Test Voice</button>
                <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Close</button>
            </div>
        </div>
    `);
}

function handleVoiceChange() {
    const select = document.getElementById('voiceSelect');
    const name = select.value;
    if (name) {
        localStorage.setItem('preferredVoiceName', name);
        speechState.preferredVoice = speechState.voices.find(v => v.name === name) || null;
    } else {
        localStorage.removeItem('preferredVoiceName');
        speechState.preferredVoice = speechState.spanishVoices[0] || null;
    }
}

function testVoice() {
    const phrase = 'Hola, como estas? Bienvenido a Spanish Tutor.';
    speakText(phrase);
}

function setupAudioInteractions() {
    const lessonArea = document.getElementById('lessonArea');
    lessonArea.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.lesson-content')) {
            e.preventDefault();
            speechState.selectedText = getSelectedText();
            showContextMenu(e.pageX, e.pageY);
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#customContextMenu')) {
            hideContextMenu();
        }
    });
    document.addEventListener('scroll', hideContextMenu, true);
    document.addEventListener('mouseup', () => {
        setTimeout(updateFloatingPlayButton, 10);
    });
    document.addEventListener('selectionchange', () => {
        setTimeout(updateFloatingPlayButton, 10);
    });
    document.getElementById('floatingPlayBtn').addEventListener('click', () => {
        const text = getSelectedText();
        if (text) speakText(text);
        document.getElementById('floatingPlayBtn').classList.add('hidden');
    });
    document.getElementById('ctxPlayNative').addEventListener('click', () => {
        const text = getSelectedText();
        if (text) speakText(text);
        hideContextMenu();
    });
    document.getElementById('ctxStopAudio').addEventListener('click', () => {
        stopSpeech();
        hideContextMenu();
    });
    document.getElementById('ctxCopy').addEventListener('click', () => {
        copySelectedText();
        hideContextMenu();
    });
    document.getElementById('voiceSettingsBtn').addEventListener('click', openVoiceSettings);
    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('#floatingPlayBtn')) {
            setTimeout(() => {
                if (!getSelectedText()) {
                    document.getElementById('floatingPlayBtn').classList.add('hidden');
                }
            }, 50);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            stopSpeech();
            hideContextMenu();
        }
    });
    setInterval(() => {
        if (speechState.isSpeaking && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
    }, 5000);
}
