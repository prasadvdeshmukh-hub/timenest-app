# Claude Backend Handoff

This repository contains the approved TimeNest UI prototype and planning material.

## Your Mission

Build the production application step by step, using the root prototype only as the visual reference.

## Do Not

- do not rewrite the root HTML prototype as the production app
- do not make broad destructive refactors to the prototype files
- do not mix Flutter implementation files into the root without a clear structure
- do not attempt the full app in one pass

## Do

- create the production implementation in `apps/timenest_flutter/`
- use Flutter for the client application
- use Firebase for auth, Firestore, messaging, and sync
- keep the app runnable after each step
- use mock data first where backend work is not finished
- preserve the TimeNest visual direction from the prototype

## Recommended Build Order

1. Create Flutter app skeleton in `apps/timenest_flutter/`
2. Add routing, theme, and shared design tokens
3. Implement the login screen
4. Implement the dashboard and drill-down navigation
5. Implement goals and tasks domain models
6. Implement Firebase authentication
7. Implement Firestore repositories and offline cache
8. Implement reminders and notification channels

## Navigation to Support

- Dashboard
- Short-Term Goal
- Long-Term Goal
- Daily Task
- Habits
- Calendar
- Notifications
- Profile
- Settings

## Core Functional Scope

- Google sign-in
- email/password sign-in
- mobile-based sign-in flow
- goals with create, edit, delete
- tasks with create, edit, delete
- subtasks
- recurrence: none, daily, weekly, monthly, yearly, custom days
- notification toggles: in-app, push, email, SMS, WhatsApp
- dashboard summaries
- drill-down from dashboard to goal to task
- offline-first local cache and sync

## Collaboration Rules

- keep `main` stable
- use feature branches for every unit of work
- Claude should own `apps/timenest_flutter/` and related backend/config files
- ChatGPT / Codex can continue owning prototype files, docs, and review assets
- if a shared file must be touched, prefer a small PR and note the reason

## Required Reading

- `README.md`
- `docs/timenest-project-plan.md`
- `docs/timenest-claude-build-prompt.md`
- `docs/parallel-workflow.md`
