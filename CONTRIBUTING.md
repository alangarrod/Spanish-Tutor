# Contributing to Spanish Tutor

Thank you for your interest in improving Spanish Tutor! This is a small, personal side project, so please read the notes below before contributing.

## How to contribute

1. **Open an issue first** for bug reports, feature ideas, or large changes. This helps avoid wasted effort.
2. **Keep pull requests small and focused.** A PR that does one thing is much easier to review than a large refactor.
3. **Match the existing style.** The project uses vanilla JavaScript, Tailwind CSS classes, and the patterns described in `CLAUDE.md`.
4. **Do not add build tools or frameworks.** This project intentionally has no bundler, npm, or test framework.
5. **Test your change** by opening `Spanish-Tutor.html` in a browser and verifying the relevant feature still works.

## What to expect

- Responses may be slow — this is a side project maintained in spare time.
- Not every pull request will be merged. If a change does not fit the project’s direction, I will try to explain why.
- Issues and PRs may be closed if they become stale or no longer apply.

## Code conventions

- Use `camelCase` for functions and variables.
- Escape user content with `escapeHtml()` before inserting it into the DOM.
- Keep new JavaScript in the `js/` folder and add the `<script>` tag to `Spanish-Tutor.html` in the correct order.
- Follow the section-header style used throughout the codebase.

## Questions?

Feel free to open an issue if something is unclear. Thanks again!
