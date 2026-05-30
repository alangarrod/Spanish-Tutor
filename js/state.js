// ──────────────────────────── State ────────────────────────────
let db = null;
const STUDY_LEVELS = [
    { id: 'lb', name: 'Lower Beginner' },
    { id: 'ub', name: 'Upper Beginner' },
    { id: 'li', name: 'Lower Intermediate' },
    { id: 'ui', name: 'Upper Intermediate' },
    { id: 'la', name: 'Lower Advanced' },
    { id: 'ua', name: 'Upper Advanced' }
];

let state = {
    topics: [],
    subtopics: [],
    lessons: [],
    stories: [],
    selectedTopicId: null,
    selectedSubtopicId: null,
    selectedStoryId: null,
    isGenerating: false,
    searchFilter: '',
    storiesExpanded: false,
    currentStudyLevel: localStorage.getItem('CurrentLevel') || 'lb'
};
