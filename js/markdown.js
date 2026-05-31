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
        // Unordered list items (handle optional leading spaces and common bullet chars)
        .replace(/^[ \t]*[-*•][ \t]+(.+)$/gm, '<li>$1</li>')
        // Numbered list items
        .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-4 border-gray-200">');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Tables: convert GFM pipe tables to HTML before paragraph wrapping
    html = html.replace(/((?:\|.+\|[ \t]*\n?)+)/g, (match) => {
        const rows = match.trim().split('\n').map(r => r.trim()).filter(Boolean);
        const sepIdx = rows.findIndex(r => /^\|[\s|:\-]+\|$/.test(r));
        if (sepIdx < 0) return match; // not a valid table, leave as-is
        const headerRows = rows.slice(0, sepIdx);
        const bodyRows = rows.slice(sepIdx + 1);
        const parseRow = (row, tag) => {
            const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
        };
        let out = '<table class="lesson-table"><thead>';
        out += headerRows.map(r => parseRow(r, 'th')).join('');
        out += '</thead><tbody>';
        out += bodyRows.map(r => parseRow(r, 'td')).join('');
        out += '</tbody></table>';
        return out;
    });

    // Paragraphs: wrap lines that aren't already wrapped in tags
    html = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (/^<\/?(?:h[1-6]|ul|li|ol|blockquote|hr|div|p|table|thead|tbody|tr|th|td)/.test(trimmed)) return line;
        return `<p>${line}</p>`;
    }).join('\n');

    return html;
}
