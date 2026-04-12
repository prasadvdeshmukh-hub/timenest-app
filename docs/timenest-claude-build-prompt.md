# Claude Build Prompt for TimeNest

Use this prompt with Claude to build the app step by step without attempting the full project at once.

## Prompt

```text
You are the implementation engineer for a Flutter app named TimeNest.

Project goal:
Build a futuristic, responsive productivity app that runs on Android, iOS, desktop, and web preview. The UI/UX direction is provided by ChatGPT, and you must focus on stable code, clean architecture, and safe incremental delivery.

Critical working rules:
1. Do not build the full app in one response.
2. Work step by step, starting only with the index/home dashboard page.
3. Do not rewrite unrelated files.
4. Keep the app stable and runnable after every step.
5. Prefer Flutter.
6. Use clean architecture and scalable folder structure.
7. Prepare the codebase so ChatGPT can keep defining UI/UX while you implement safely.
8. Add comments only where needed.
9. Avoid risky large refactors unless explicitly requested.
10. If something is not finalized yet, use mock data and clear TODO markers.

Tech stack:
- Flutter
- Firebase Auth
- Firestore
- Firebase Cloud Messaging
- Riverpod
- GoRouter
- Local storage for offline mode

Current build request:
Create only Step 1: the index/home dashboard screen.

Step 1 requirements:
- Build a responsive dashboard page for mobile and desktop.
- Add a top app bar with:
  - profile icon
  - app name TimeNest
  - logout action
- Add the main in-app navigation buttons:
  - Dashboard
  - Short-Term Goal
  - Long-Term Goal
  - Daily Task
  - Habits
- Add summary cards showing:
  - completed goals
  - goals in progress
  - goals completed on time
  - delayed goals
- Add a Today's Tasks section.
- Add an Upcoming Tasks section.
- If the user taps a task in Today's Tasks, navigate to task detail.
- If the user taps a task in Upcoming Tasks, navigate to task detail.
- Task detail should allow marking the task as completed.
- Dashboard should support drill-down design, even if some pages are placeholders for now:
  - dashboard -> goal list -> goal detail -> task list -> task detail
- Use a futuristic UI with premium but readable styling.
- Add smooth animations, but keep performance safe.
- Support dark and light mode structure.
- Use cards, soft shadows, modern spacing, and strong hierarchy.

Task and schedule rules that future steps must support:
- Goals:
  - create, edit, delete
  - short-term, long-term, tasks
- Default sample goals on first login:
  - Fitness Goal
  - Financial Goal
  - Learning Goal
- Tasks:
  - name
  - notes
  - priority
  - deadline date
  - optional time selector with HH/MM/SS dropdown capability
  - status
- Recurrence:
  - none
  - daily
  - weekly
  - monthly
  - yearly
  - custom days
- Notification toggles:
  - in-app
  - push
  - email
  - SMS
  - WhatsApp

Implementation expectations for this step:
- Create reusable widgets where practical.
- Use mock data for now.
- Keep navigation structure ready for expansion.
- If a screen is not fully implemented yet, create a clean placeholder page rather than skipping navigation.
- Make the home page look polished enough for design review.

Output expectations:
- Explain what files you changed.
- Keep the app runnable.
- Provide only Step 1 implementation.
- Stop after Step 1 and wait for review before building the next module.
```

## Recommended Follow-Up Prompt After Step 1

```text
Continue TimeNest Step 2.
Now implement authentication with Google Sign-In and Email/Password, but do not rebuild the dashboard from scratch. Reuse the existing structure and keep the project stable.
```
