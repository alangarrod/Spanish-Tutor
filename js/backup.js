// ──────────────────────────── Backup (Export / Import) ────────────────────────────

const BACKUP_VERSION = 1;
const BACKUP_STORES = ['topics', 'subtopics', 'lessons', 'stories', 'chats'];

/**
 * Collects all user data from IndexedDB into a single JSON-serialisable object.
 * Study levels are excluded — they are seeded automatically on first run.
 */
async function buildBackupObject() {
    const data = {};
    for (const store of BACKUP_STORES) {
        data[store] = await dbGetAll(store);
    }
    return {
        version: BACKUP_VERSION,
        app: 'SpanishTutor',
        exportedAt: new Date().toISOString(),
        data
    };
}

/**
 * Triggers a browser download of the current data as a JSON file.
 */
async function exportBackup() {
    try {
        const backup = await buildBackupObject();
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `spanish-tutor-backup-${stamp}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const counts = BACKUP_STORES.map(s => `${s}: ${backup.data[s].length}`).join(', ');
        showToast(`Backup exported (${counts})`, 'success');
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
    }
}

/**
 * Opens a file picker, reads a JSON backup, and restores it into IndexedDB.
 * Existing records with the same id are overwritten (put semantics).
 */
function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        document.body.removeChild(input);
        if (!file) return;
        await handleImportFile(file);
    });

    input.click();
}

async function handleImportFile(file) {
    let backup;
    try {
        const text = await file.text();
        backup = JSON.parse(text);
    } catch (err) {
        showToast('Could not read file: ' + err.message, 'error');
        return;
    }

    if (!backup || backup.app !== 'SpanishTutor' || !backup.data) {
        showToast('Invalid backup file format.', 'error');
        return;
    }

    // Confirm before overwriting.
    const counts = BACKUP_STORES.map(s => `${s}: ${(backup.data[s] || []).length}`).join(', ');
    showImportConfirmModal(file.name, counts, async () => {
        await restoreBackup(backup);
    });
}

function showImportConfirmModal(filename, counts, onConfirm) {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-2"><i class="fa-solid fa-file-import mr-2 text-pastel-blue"></i>Import Backup</h3>
        <p class="text-sm text-medium-gray mb-2 leading-relaxed">
            Restore from <span class="font-semibold text-dark-gray">${escapeHtml(filename)}</span>
        </p>
        <p class="text-xs text-medium-gray mb-4">Contents — ${escapeHtml(counts)}</p>
        <div class="bg-soft-blue border border-pastel-blue/40 rounded-lg p-3 mb-4 text-xs text-dark-gray leading-relaxed">
            <i class="fa-solid fa-triangle-exclamation mr-1 text-yellow-600"></i>
            This will <strong>overwrite</strong> any existing records with the same ID. Records not present in the backup are kept.
        </div>
        <div class="flex justify-end gap-2">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Cancel</button>
            <button onclick="hideModal();window.__confirmImport()" class="btn-primary px-5 py-2 rounded-lg text-sm font-bold">Import</button>
        </div>
    `);
    window.__confirmImport = onConfirm;
}

async function restoreBackup(backup) {
    try {
        let imported = 0;
        for (const store of BACKUP_STORES) {
            const records = backup.data[store] || [];
            for (const record of records) {
                await dbPut(store, record);
                imported++;
            }
        }

        // Reload state from DB so the UI reflects the merged data.
        state.topics = await dbGetAll('topics');
        state.subtopics = await dbGetAll('subtopics');
        state.lessons = await dbGetAll('lessons');
        state.stories = await dbGetAll('stories');
        state.chats = await dbGetAll('chats');

        state.topics.sort((a, b) => a.createdAt - b.createdAt);
        state.subtopics.sort((a, b) => a.createdAt - b.createdAt);
        state.stories.sort((a, b) => a.createdAt - b.createdAt);
        state.chats.sort((a, b) => a.createdAt - b.createdAt);

        // Clear stale selection if the selected topic/subtopic no longer exists.
        if (state.selectedTopicId && !state.topics.some(t => t.id === state.selectedTopicId)) {
            state.selectedTopicId = null;
            state.selectedSubtopicId = null;
        }
        if (state.selectedSubtopicId && !state.subtopics.some(s => s.id === state.selectedSubtopicId)) {
            state.selectedSubtopicId = null;
        }

        renderTopics();
        renderLessonArea();

        showToast(`Import complete — ${imported} records restored.`, 'success');
    } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
    }
}

// ──────────────── Backup Modal ────────────────

function showBackupModal() {
    showModal(`
        <h3 class="text-lg font-bold text-dark-gray mb-4"><i class="fa-solid fa-database mr-2 text-pastel-blue"></i>Backup &amp; Restore</h3>
        <p class="text-sm text-medium-gray mb-5 leading-relaxed">
            Export all your topics, subtopics, lessons, stories, and chats to a JSON file, or restore from a previous backup.
        </p>
        <div class="space-y-3">
            <button onclick="hideModal();exportBackup()" class="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-pastel-blue hover:bg-soft-blue transition text-left">
                <i class="fa-solid fa-file-export text-xl text-pastel-blue"></i>
                <div>
                    <div class="text-sm font-semibold text-dark-gray">Export Backup</div>
                    <div class="text-xs text-medium-gray">Download all data as a JSON file</div>
                </div>
            </button>
            <button onclick="hideModal();importBackup()" class="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-pastel-blue hover:bg-soft-blue transition text-left">
                <i class="fa-solid fa-file-import text-xl text-pastel-blue"></i>
                <div>
                    <div class="text-sm font-semibold text-dark-gray">Import Backup</div>
                    <div class="text-xs text-medium-gray">Restore data from a JSON file</div>
                </div>
            </button>
        </div>
        <div class="flex justify-end mt-5">
            <button onclick="hideModal()" class="px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:bg-gray-100">Close</button>
        </div>
    `);
}