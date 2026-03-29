# Parallel Workflow for ChatGPT and Claude

This document defines the safest way for ChatGPT/Codex and Claude to work on TimeNest in parallel without breaking the app.

## Repository Strategy

- `main` is always reviewable and stable
- prototype UI files stay in the repo root
- production app code should live in `apps/timenest_flutter/`
- docs and handoff prompts stay in `docs/`

## Ownership Split

### ChatGPT / Codex

- HTML/CSS/JS prototype
- UI review adjustments
- mobile UX refinements
- product docs
- handoff prompts

### Claude

- Flutter app implementation
- Firebase integration
- domain models
- repositories
- authentication
- sync logic
- notification plumbing

## Branching Rules

- create a new branch for each feature
- never let both tools edit the same production file in parallel
- use pull requests for every merge into `main`

Suggested branch naming:

- `claude/flutter-bootstrap`
- `claude/auth-foundation`
- `claude/dashboard-shell`
- `codex/prototype-polish`
- `codex/design-docs`

## Safe Working Pattern

1. ChatGPT/Codex finalizes a screen or UX rule in the prototype.
2. Claude implements that screen in Flutter on a feature branch.
3. Claude opens a PR.
4. ChatGPT/Codex reviews the result against the prototype and updates docs if needed.
5. Merge only when the branch is stable.

## Do Not

- do not have Claude and ChatGPT rewrite the same screen implementation files at the same time
- do not let prototype edits directly overwrite Flutter implementation files
- do not build the full backend in one giant branch

## Recommended Next Claude Task

Start a Flutter app in `apps/timenest_flutter/` and implement:

- app bootstrap
- theme
- router
- login screen
- dashboard shell

Keep all data mocked first. Add Firebase only after the screens and routing are stable.
