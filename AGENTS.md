# Opportunities Portal — Project Rules

## 1. Project Context

- Read `proposal.md` before planning development tasks.
- Use `proposal.md` as the primary reference for the project's scope and user stories.
- Follow the approved task list (`TASKS.md`) when available.
- Flag any contradictions or ambiguities between project requirements, rules, and tasks before implementation.
- Do not add out-of-scope or unplanned features without my explicit approval.
- Do not modify `proposal.md` without my approval.

## 2. Technology & Design

- Build the MVP using HTML, CSS, JavaScript, and JSON, without a backend, cloud database, or unnecessary frameworks.
- Do not depend on external CDNs for scripts, styles, libraries, or fonts. Use local assets or system fonts instead.
- Build an Arabic-first RTL interface, ensuring English content and URLs display correctly in LTR.
- Organize UI text to allow future English localization. Full English translation and language switching are not required for the initial MVP.
- Build a fully responsive website for mobile, tablet, and desktop.
- Ensure the website works at 360px width without horizontal scrolling.
- Prefer Amiri or Noto Naskh Arabic for Arabic text when locally available, with suitable system font fallbacks.
- Use English for code comments.
- Keep the application compatible with GitHub Pages by using static files and relative paths, without server-side dependencies.

## 3. Security & File Management

- Never permanently delete files.
- If a file must be removed, explain why and request approval before moving it to a project-local `_trash` folder.
- Do not read `.env`, passwords, API keys, or other sensitive files.
- Never modify files outside the project directory.
- Do not install packages without explicit approval.
- Before executing any terminal command, briefly explain in simple Arabic what it does, why it is needed, which files or resources it may affect, and any potential risks. Never bypass required approval.
- Never upload or transmit local project files to external services without explicit approval.

## 4. Data Integrity

- Never invent scholarships, courses, internships, deadlines, or eligibility requirements.
- Only add or update opportunity records using data manually provided and verified by me from official sources.
- Preserve the official source URL and verification date for every opportunity.
- Display eligibility warnings when official sources explicitly exclude Yemenis or their qualifications.
- Do not assume an opportunity accepts Yemenis merely because no exclusion is mentioned.
- Do not implement automatic opportunity collection or RAG features in the MVP.

## 5. Agent Workflow

- Present an implementation plan before development changes and wait for my approval.
- Explain important technical decisions in simple Arabic.
- Make only the changes required for the currently approved task and its implementation plan.
- After each completed task, summarize the changes, list the affected files, explain how to verify the results, and report any unfinished work.
- Clearly distinguish between tests actually executed and tests not yet performed.
- Suggest a clear Git commit message after each completed feature.