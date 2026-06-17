// ──────────────────────────── Conversational Practice ────────────────────────────

/**
 * In-memory handle for the chat record currently bound to the panel.
 * Resolved from state.chats by the selected subtopic.
 */
let _activeChat = null;

/**
 * Open the practice chat panel for the currently selected subtopic.
 * Lazily creates a persisted chat record on first use.
 */
async function openChatPanel() {
    if (!state.selectedSubtopicId) {
        showToast('Select a subtopic to start practicing.', 'info');
        return;
    }

    _activeChat = await getOrCreateChat(state.selectedSubtopicId);
    state.chatPanelOpen = true;
    renderChatPanel();
    // Focus the input after the panel markup is in the DOM.
    setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
    }, 50);
}

function closeChatPanel() {
    state.chatPanelOpen = false;
    _activeChat = null;
    renderChatPanel();
}

/**
 * Re-render the chat panel container. Called whenever the panel opens/closes
 * or when a new subtopic is selected while the panel is open.
 */
function renderChatPanel() {
    const panel = document.getElementById('chatPanel');
    if (!panel) return;

    if (!state.chatPanelOpen) {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        return;
    }

    const subtopic = state.subtopics.find(s => s.id === state.selectedSubtopicId);
    const topic = state.topics.find(t => t.id === subtopic?.topicId);
    const headerLabel = subtopic ? `${escapeHtml(topic?.name || '')} · ${escapeHtml(subtopic.name)}` : 'Practice';

    panel.classList.remove('hidden');
    panel.innerHTML = `
        <div class="chat-panel-inner flex flex-col h-full">
            <div class="chat-header flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="fa-solid fa-comments text-pastel-blue"></i>
                    <div class="min-w-0">
                        <div class="text-sm font-bold text-dark-gray truncate">Practice Chat</div>
                        <div class="text-xs text-medium-gray truncate">${headerLabel}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    ${_activeChat && _activeChat.messages.length > 0 ? `
                        <button onclick="confirmClearChat()" class="w-8 h-8 rounded-lg flex items-center justify-center text-medium-gray hover:bg-red-50 hover:text-red-500" title="Clear conversation">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    ` : ''}
                    <button onclick="closeChatPanel()" class="w-8 h-8 rounded-lg flex items-center justify-center text-medium-gray hover:bg-gray-100" title="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <div id="chatMessages" class="chat-messages flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3 bg-light-gray">
                ${_renderChatMessages()}
            </div>

            <div class="chat-composer border-t border-gray-100 bg-white px-3 py-3">
                <div class="flex items-end gap-2">
                    <textarea id="chatInput" rows="1" placeholder="Escribe en español…"
                        class="chat-input flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pastel-blue text-sm leading-relaxed"
                        oninput="autoGrowChatInput(this)"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMessage();}"></textarea>
                    <button id="chatSendBtn" onclick="sendChatMessage()" class="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 flex-shrink-0">
                        <i class="fa-solid fa-paper-plane"></i>
                        <span class="hidden sm:inline">Send</span>
                    </button>
                </div>
                <p class="text-xs text-medium-gray mt-2 px-1">
                    <i class="fa-solid fa-circle-info mr-1"></i>Reply in Spanish — the tutor will gently correct mistakes. Press Enter to send, Shift+Enter for a new line.
                </p>
            </div>
        </div>`;

    scrollChatToBottom();
}

/**
 * Build the HTML for the message list, including a typing indicator while sending.
 */
function _renderChatMessages() {
    if (!_activeChat) return '';

    const msgs = _activeChat.messages;
    if (msgs.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center h-full text-center px-4">
                <div class="w-14 h-14 rounded-full bg-soft-blue flex items-center justify-center mb-3">
                    <i class="fa-solid fa-comments text-2xl text-pastel-blue"></i>
                </div>
                <p class="text-sm font-medium text-dark-gray mb-1">¡Vamos a practicar!</p>
                <p class="text-xs text-medium-gray max-w-xs leading-relaxed">Start a conversation in Spanish about this subtopic. The tutor replies at your level and corrects mistakes.</p>
            </div>`;
    }

    let html = msgs.map(m => _renderChatBubble(m)).join('');

    if (state.chatIsSending) {
        html += `
            <div class="chat-bubble chat-bubble-tutor flex items-center gap-2">
                <div class="chat-typing"><span></span><span></span><span></span></div>
            </div>`;
    }

    return html;
}

/**
 * Render a single message bubble. Assistant messages get a "read aloud" button
 * that reuses the existing speech synthesis (speakText).
 */
function _renderChatBubble(message) {
    const isUser = message.role === 'user';
    const bubbleClass = isUser ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-tutor';
    const avatar = isUser
        ? '<i class="fa-solid fa-user"></i>'
        : '<i class="fa-solid fa-graduation-cap"></i>';

    // Use renderMarkdown for tutor replies (supports bold/corrections); plain text for user.
    const body = isUser ? escapeHtml(message.content) : renderMarkdown(message.content);

    const speakBtn = (!isUser && message.content)
        ? `<button onclick="speakChatMessage(${_activeChat.messages.indexOf(message)})" class="chat-speak-btn" title="Read aloud">
               <i class="fa-solid fa-volume-high"></i>
           </button>`
        : '';

    return `
        <div class="${bubbleClass}">
            <div class="chat-avatar">${avatar}</div>
            <div class="chat-bubble-content">
                <div class="chat-bubble-text">${body}</div>
                ${speakBtn}
            </div>
        </div>`;
}

/**
 * Read a tutor message aloud using the shared speech synthesizer.
 */
function speakChatMessage(index) {
    if (!_activeChat) return;
    const msg = _activeChat.messages[index];
    if (msg && msg.role === 'assistant' && msg.content) {
        speakText(msg.content);
    }
}

function autoGrowChatInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) container.scrollTop = container.scrollHeight;
}

/**
 * Send the user's message, stream the tutor's reply, and persist both.
 */
async function sendChatMessage() {
    if (state.chatIsSending) return;
    if (!_activeChat) return;

    const input = document.getElementById('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Capture the chat we're replying to so a mid-stream subtopic switch
    // doesn't redirect the reply into a different conversation.
    const chat = _activeChat;

    // Append the user message in-memory and persist.
    chat.messages.push({ role: 'user', content: text });
    await saveChat(chat);

    // Clear the composer and re-render to show the user bubble + typing indicator.
    input.value = '';
    input.style.height = 'auto';
    state.chatIsSending = true;
    renderChatPanel();

    try {
        const fullReply = await chatWithTutor(chat, text, (partial) => {
            // Live-update the last tutor bubble as tokens stream in.
            const container = document.getElementById('chatMessages');
            if (!container) return;
            // Replace the typing indicator bubble with a streaming tutor bubble.
            let streamBubble = container.querySelector('#chatStreamBubble');
            if (!streamBubble) {
                const typing = container.querySelector('.chat-typing');
                if (typing) typing.parentElement.remove();
                container.insertAdjacentHTML('beforeend', `
                    <div class="chat-bubble chat-bubble-tutor" id="chatStreamBubble">
                        <div class="chat-avatar"><i class="fa-solid fa-graduation-cap"></i></div>
                        <div class="chat-bubble-content">
                            <div class="chat-bubble-text" id="chatStreamText"></div>
                        </div>
                    </div>`);
                streamBubble = container.querySelector('#chatStreamBubble');
            }
            const textEl = streamBubble.querySelector('#chatStreamText');
            if (textEl) textEl.innerHTML = renderMarkdown(partial);
            scrollChatToBottom();
        });

        // Commit the assistant message to the same chat we started with.
        chat.messages.push({ role: 'assistant', content: fullReply });
        await saveChat(chat);
    } catch (err) {
        // Surface the error as a tutor-side system bubble so the conversation reads naturally.
        chat.messages.push({
            role: 'assistant',
            content: `⚠️ No pude responder: ${err.message}`
        });
        await saveChat(chat);
        showToast(`Chat error: ${err.message}`, 'error');
    } finally {
        state.chatIsSending = false;
        renderChatPanel();
    }
}

/**
 * Confirm and clear the current conversation (keeps the chat record, empties messages).
 */
function confirmClearChat() {
    if (!_activeChat || _activeChat.messages.length === 0) return;
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-triangle-exclamation mr-2 text-amber-500"></i>Clear Conversation</h3>
        <p class="text-sm text-medium-gray mb-4">Clear all messages in this practice chat? This cannot be undone.</p>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="executeClearChat()" class="btn-danger px-5 py-2 rounded-lg text-sm font-bold">Clear</button>
        </div>
    `);
}

async function executeClearChat() {
    if (_activeChat) {
        _activeChat.messages = [];
        await saveChat(_activeChat);
    }
    hideModal();
    renderChatPanel();
    showToast('Conversation cleared', 'info');
}