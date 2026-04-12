# TimeNest UI Prototype

TimeNest is a futuristic productivity app concept focused on goals, daily tasks, recurring reminders, habits, and progress tracking across mobile and desktop. This repository currently contains the approved HTML/CSS/JS prototype and the project planning documents that will be used to hand off implementation work to Claude.

## Current State

- mobile-first UI prototype in plain HTML, CSS, and JavaScript
- responsive login, dashboard, goals, tasks, habits, calendar, settings, and profile screens
- HUD-style clock and branded visual system
- project plan and implementation prompts for Claude

## Main Screens

- `login.html`
- `index.html`
- `short-term-goals.html`
- `long-term-goals.html`
- `goal-detail.html`
- `daily-tasks.html`
- `task-detail.html`
- `task-editor.html`
- `subtask-editor.html`
- `habits.html`
- `calendar.html`
- `notifications.html`
- `profile.html`
- `settings.html`

## Local Preview

Run the local preview server:

```bash
npm run ui:preview
```

Then open:

```text
http://localhost:4173
```

## Firebase Auth Setup

The prototype now supports real Firebase Authentication for:

- Google sign-in
- email/password sign-in and sign-up
- password reset emails
- phone OTP sign-in

To enable it locally:

1. Copy `.env.example` to `.env`
2. Fill in your Firebase web app config values
3. Enable the same providers in Firebase Authentication
4. Add `localhost` as an authorized domain in Firebase
5. Start the preview server with `npm run ui:preview`

Notes:

- Auth is served from `/app-config.json`, so you should use `http://localhost:4173` instead of opening the HTML files directly from disk.
- Phone auth on web may require Firebase test numbers, the Auth emulator, or a non-localhost authorized domain depending on your Firebase setup.

## Claude Handoff

Claude should not rewrite this prototype in place. The safer parallel workflow is:

1. Keep the approved prototype files in the repo root as the UI reference.
2. Let Claude build the production app in a separate implementation folder such as `apps/timenest_flutter/`.
3. Use branches and pull requests so UI review and backend implementation can progress without conflicts.

See:

- `CLAUDE.md`
- `docs/timenest-project-plan.md`
- `docs/timenest-claude-build-prompt.md`
- `docs/parallel-workflow.md`

## Recommended Ownership Split

- ChatGPT / Codex: prototype UI, design system guidance, review docs, handoff specs
- Claude: Flutter app structure, Firebase backend, production navigation, data layer, authentication, sync, and notifications

## Important Note

GitHub repository creation is blocked until the local GitHub CLI session is re-authenticated. The current `gh` login token on this machine is invalid.
