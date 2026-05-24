// ──────────────────────────── Markdown Parser ────────────────────────────
function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        // Code
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Blockquote
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Unordered list items
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Numbered list items
        .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-4 border-gray-200">');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Paragraphs: wrap lines that aren't already wrapped in tags
    html = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (/^<(h[1-6]|ul|li|ol|blockquote|hr|div|p)/.test(trimmed)) return line;
        return `<p>${line}</p>`;
    }).join('\n');

    return html;
}
