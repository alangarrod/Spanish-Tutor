// ──────────────────────────── Default Curriculum ────────────────────────────
const CURRICULUM_DATA = {
    lb: [
        { topic: "Greetings & Introductions", subtopics: ["Saying Hello & Goodbye", "Introducing Yourself", "Common Courtesies"] },
        { topic: "Numbers & Counting", subtopics: ["Numbers 1–20", "Numbers 20–100", "Ordinal Numbers"] },
        { topic: "Basic Phrases", subtopics: ["Asking for Help", "Expressing Needs", "Simple Questions"] },
        { topic: "Days & Months", subtopics: ["Days of the Week", "Months of the Year", "Dates & Seasons"] },
        { topic: "Family & People", subtopics: ["Immediate Family", "Extended Family", "Describing People"] }
    ],
    ub: [
        { topic: "Food & Drink", subtopics: ["Restaurant Vocabulary", "Ordering Food", "Common Dishes & Drinks"] },
        { topic: "Daily Routine", subtopics: ["Morning Routine", "Household Chores", "Evening Activities"] },
        { topic: "Present Tense Verbs", subtopics: ["Regular -ar Verbs", "Regular -er/-ir Verbs", "Common Irregular Verbs"] },
        { topic: "Descriptions & Adjectives", subtopics: ["Personality Adjectives", "Physical Descriptions", "Colors & Sizes"] },
        { topic: "Around the House", subtopics: ["Rooms & Furniture", "Kitchen Items", "Household Appliances"] }
    ],
    li: [
        { topic: "Past Tense (Preterite)", subtopics: ["Regular -ar Preterite", "Regular -er/-ir Preterite", "Irregular Preterite Verbs"] },
        { topic: "Travel & Transportation", subtopics: ["At the Airport", "Train & Bus Travel", "Asking for Directions"] },
        { topic: "Shopping & Money", subtopics: ["Clothing Vocabulary", "Bargaining & Prices", "At the Market"] },
        { topic: "Weather & Nature", subtopics: ["Weather Expressions", "Seasons & Climate", "Natural Landscapes"] },
        { topic: "Health & Body", subtopics: ["Body Parts", "Common Illnesses", "At the Doctor"] }
    ],
    ui: [
        { topic: "Past Tense (Imperfect)", subtopics: ["Regular Imperfect Verbs", "Irregular Imperfect Verbs", "Preterite vs Imperfect"] },
        { topic: "Subjunctive Mood", subtopics: ["Present Subjunctive Forms", "Subjunctive Triggers", "Subjunctive vs Indicative"] },
        { topic: "Work & Professions", subtopics: ["Job Titles & Workplaces", "Job Applications", "Office Vocabulary"] },
        { topic: "Technology & Media", subtopics: ["Computers & Internet", "Social Media", "News & Entertainment"] },
        { topic: "Relationships & Emotions", subtopics: ["Friendship & Dating", "Expressing Emotions", "Conflict & Resolution"] }
    ],
    la: [
        { topic: "Compound Tenses", subtopics: ["Present Perfect", "Past Perfect", "Future Perfect"] },
        { topic: "Literature & Arts", subtopics: ["Spanish Literature", "Visual Arts", "Music & Dance"] },
        { topic: "Politics & Society", subtopics: ["Government Systems", "Social Issues", "Civic Participation"] },
        { topic: "Advanced Vocabulary", subtopics: ["Idiomatic Expressions", "Proverbs & Sayings", "Regional Variations"] },
        { topic: "Formal Writing", subtopics: ["Business Letters", "Academic Writing", "Formal Email Etiquette"] }
    ],
    ua: [
        { topic: "Conditional & Future", subtopics: ["Conditional Tense", "Future Tense", "Conditional Perfect"] },
        { topic: "Advanced Subjunctive", subtopics: ["Imperfect Subjunctive", "Subjunctive in Compound Tenses", "Subjunctive in Relative Clauses"] },
        { topic: "Regional Spanish", subtopics: ["Spain vs Latin America", "Slang & Colloquialisms", "Regional Pronunciation"] },
        { topic: "Philosophy & Debate", subtopics: ["Philosophical Concepts", "Argumentation & Rhetoric", "Ethical Discussions"] },
        { topic: "Specialized Translation", subtopics: ["Legal Spanish", "Medical Spanish", "Technical Translation"] }
    ]
};