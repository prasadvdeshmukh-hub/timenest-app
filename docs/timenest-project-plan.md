# TimeNest Project Plan

## 1. Product Vision

TimeNest is a futuristic, cross-platform productivity app for Android, iOS, and Desktop that helps users manage goals, daily tasks, recurring routines, reminders, habits, and progress from one clean dashboard.

The core product promise is:

- one place to capture goals and tasks
- one dashboard to see progress, deadlines, and today's priorities
- one reliable reminder system across in-app, push, SMS, email, and WhatsApp
- one responsive experience across phone, tablet, desktop, and web preview

## 2. Recommended Launch Strategy

Your full vision is strong, but shipping fast and safely means splitting it into phases.

### Phase 1: MVP for Fast Launch

Build these first:

- Google Sign-In
- Email and password login
- Mobile number and password login via backend-managed credential flow
- Dashboard home page
- Short-term goals
- Long-term goals
- Daily tasks
- Habits
- Task recurrence: none, daily, weekly, monthly, yearly, custom days
- Reminder setup toggles: in-app, push, email, SMS, WhatsApp
- Today and Upcoming task lists with drill-down to task detail
- Mark task complete from dashboard task cards
- Calendar view
- Progress summary:
  - completed goals
  - in-progress goals
  - completed on time
  - delayed goals
- Offline storage with sync
- Light and dark mode
- English first, Marathi next

### Phase 2: Strong Enhancements

- WhatsApp Business API automation
- SMS provider integration
- backup and restore
- export to PDF and Excel
- search, filters, tags, categories
- voice input
- streaks and gamification
- widgets
- advanced analytics

### Phase 3: Premium Intelligence

- AI task breakdown
- AI schedule suggestions
- missed-task recovery plans
- adaptive notification timing

## 3. What Current Top Apps Do Well

Research based on current store listings and descriptions:

- Todoist on Google Play emphasizes natural task capture, recurring dates, reminders, and multiple planning views including list, board, and calendar.
- TickTick on the Apple App Store emphasizes multiple reminders, flexible recurring tasks, calendar integration, tags, habits, and focus tools.
- Habitica on Google Play emphasizes gamification, recurring routines, streaks, rewards, and motivation through progress loops.

What TimeNest should borrow:

- from Todoist: quick capture, clarity-first UI, recurring scheduling, fast task completion
- from TickTick: rich reminder controls, calendar-centric planning, habits plus tasks in one app
- from Habitica: streaks, rewards, and motivation layers

What TimeNest should improve:

- better goal-to-task drill-down
- stronger dashboard summaries for delayed vs on-time goals
- more visible multi-channel notification toggles
- futuristic UI without making the app complicated

Sources:

- [Todoist on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.todoist)
- [TickTick on the App Store](https://apps.apple.com/us/app/ticktick-%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB%E3%81%AAtodo%E3%83%AA%E3%82%B9%E3%83%88-%E3%82%BF%E3%82%B9%E3%82%AF%E7%AE%A1%E7%90%86%E3%82%A2%E3%83%97/id626144601)
- [Habitica on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=com.habitrpg.android.habitica)

## 4. Recommended Tech Stack

### Frontend

- Flutter
- Riverpod for state management
- GoRouter for navigation
- Hive or Isar for offline local storage
- Flutter Local Notifications
- Firebase Messaging
- Lottie and Rive for animation

Why Flutter:

- one codebase for Android, iOS, desktop, and web preview
- strong responsive layout support
- faster visual consistency across platforms
- easier design-system control for futuristic UI

### Backend

- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Messaging
- Cloud Functions
- Firebase Storage
- optional: BigQuery or analytics later

### Notification and Messaging

- Push: Firebase Cloud Messaging
- In-app alerts: app-level notification center + modal banners
- SMS: Twilio or regional SMS gateway
- Email: Firebase extension, SendGrid, or custom Cloud Function
- WhatsApp: WhatsApp Business API or deep linking fallback

## 5. Architecture

### App Layers

1. Presentation Layer
- responsive pages
- reusable design system
- animation components
- widgets for cards, toggles, pills, charts, timelines

2. Application Layer
- auth controller
- goals controller
- task controller
- habits controller
- dashboard aggregation logic
- reminder scheduling logic
- sync orchestration

3. Domain Layer
- entities: user, goal, task, task occurrence, habit, reminder, notification channel, dashboard summary
- use cases: create goal, create recurring task, mark complete, skip occurrence, reschedule occurrence, send daily summary

4. Data Layer
- Firebase repositories
- local cache repositories
- sync queue
- API clients for SMS and WhatsApp

## 6. Suggested Flutter Folder Structure

```text
lib/
  app/
    app.dart
    router.dart
    bootstrap.dart
  core/
    constants/
    theme/
    widgets/
    utils/
    services/
  features/
    auth/
    dashboard/
    goals/
    tasks/
    habits/
    calendar/
    notifications/
    profile/
    settings/
  shared/
    models/
    repositories/
    providers/
```

## 7. Main Navigation Structure

These should be the major in-app buttons as requested:

- Dashboard
- Short-Term Goal
- Long-Term Goal
- Daily Task
- Habits

Additional utility areas:

- Calendar
- Notifications
- Profile
- Settings

## 8. First Screen to Build

Do not build the full app at once.

### Step 1 Screen

Build the **Index/Home Dashboard** first.

This page should include:

- top app bar with profile icon and logout access
- greeting and date
- summary cards:
  - total goals
  - in progress
  - completed
  - delayed
- Today's Tasks section
- Upcoming Tasks section
- quick stats:
  - completed on time
  - missed deadlines
  - active streak
- primary navigation buttons:
  - Dashboard
  - Short-Term Goal
  - Long-Term Goal
  - Daily Task
  - Habits

### Required Behavior

- tapping a task in Today's Tasks opens task detail
- tapping a task in Upcoming Tasks opens task detail
- task detail allows mark as completed
- dashboard supports drill-down:
  - dashboard -> goal category -> goal detail -> task list -> task detail

## 9. UX Direction

### Design Style

TimeNest should feel:

- futuristic
- premium
- simple
- calm
- fast

### Visual Language

- glassmorphism only in moderation
- dark surfaces with luminous accent layers
- strong contrast for readability
- soft shadows, not muddy shadows
- rounded cards
- animated gradients
- subtle motion, not distracting motion
- large tap targets
- readable typography

### Motion Recommendations

- animated dashboard card reveal
- orbit or time-ring hero animation on home
- completion check animation
- recurring task pulse animation
- smooth bottom-nav transitions
- progress bar fill animation

Important:

- animation must never block usability
- low-end device fallback must disable heavy effects automatically

## 10. Functional Requirements Clarified

### Authentication

Supported login methods:

- Google Sign-In mandatory
- Email and password
- Mobile number and password

Recommendation:

- keep Google Sign-In and Email/Password in MVP
- implement mobile number and password carefully only if there is a real backend identity flow
- if mobile login means OTP, use phone auth instead of plain mobile-password storage

### Goal Types

- short-term
- long-term
- tasks

Default goals on first login:

- Fitness Goal
- Financial Goal
- Learning Goal

These must be editable and deletable.

### Task Fields

- task name
- notes
- priority
- deadline date
- optional time selector
- status
- tags
- recurrence
- reminder settings

### Time Capture

Task creation should allow:

- date required if task is scheduled
- time optional
- dropdown selectors for hour, minute, second

Recommendation:

- use HH and MM in most user flows
- keep SS optional and hidden under advanced scheduling, because seconds are rarely useful for productivity apps

### Recurrence

Provide toggle-button style options:

- none
- daily
- weekly
- monthly
- yearly
- custom days

### Notification Channel Toggles

Use toggle buttons wherever possible for:

- mobile push
- in-app
- email
- SMS
- WhatsApp

## 11. Firestore Data Model

### collections/users/{userId}

```json
{
  "displayName": "Vihaan",
  "email": "user@example.com",
  "phoneNumber": "+91XXXXXXXXXX",
  "photoUrl": "https://...",
  "preferredLanguage": "en",
  "themeMode": "dark",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp",
  "onboardingCompleted": true
}
```

### collections/users/{userId}/goals/{goalId}

```json
{
  "name": "Fitness Goal",
  "description": "Lose 5 kg and improve stamina",
  "type": "short_term",
  "status": "in_progress",
  "startDate": "timestamp",
  "targetDate": "timestamp",
  "progressPercent": 42,
  "isDefaultSample": true,
  "completedAt": null,
  "completedOnTime": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### collections/users/{userId}/goals/{goalId}/tasks/{taskId}

```json
{
  "name": "Morning walk",
  "notes": "30 minutes minimum",
  "priority": "medium",
  "status": "pending",
  "deadlineDate": "timestamp",
  "deadlineTimeEnabled": true,
  "deadlineHour": 6,
  "deadlineMinute": 30,
  "deadlineSecond": 0,
  "tags": ["health", "routine"],
  "isHabit": false,
  "recurrenceType": "daily",
  "customDays": [],
  "reminderChannels": {
    "push": true,
    "inApp": true,
    "email": false,
    "sms": false,
    "whatsapp": false
  },
  "reminderOffsetsMinutes": [10, 60],
  "snoozeEnabled": true,
  "autoEscalationEnabled": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "completedAt": null
}
```

### collections/users/{userId}/taskOccurrences/{occurrenceId}

Use a flattened occurrence collection for calendar and reminders.

```json
{
  "taskId": "task_001",
  "goalId": "goal_001",
  "scheduledFor": "timestamp",
  "status": "pending",
  "isSkipped": false,
  "isRescheduled": false,
  "originalScheduledFor": "timestamp",
  "completedAt": null
}
```

### collections/users/{userId}/notifications/{notificationId}

```json
{
  "taskId": "task_001",
  "goalId": "goal_001",
  "type": "task_reminder",
  "channel": "push",
  "scheduledAt": "timestamp",
  "sentAt": null,
  "status": "scheduled"
}
```

## 12. Core Screens

### Auth

- splash
- sign in
- email login
- phone login

### Main App

- dashboard home
- short-term goals list
- long-term goals list
- goal detail
- create/edit goal
- task detail
- create/edit task
- daily task center
- habits center
- calendar
- notifications center
- profile
- settings

## 13. Basic Wireframe Notes

### Dashboard Home

```text
+--------------------------------------------------+
| Profile | TimeNest | Search | Notifications      |
+--------------------------------------------------+
| Hello, Vihaan                                   |
| Today: 29 Mar 2026                              |
+--------------------------------------------------+
| Goals Summary                                   |
| [Completed] [In Progress] [Delayed] [On Time]   |
+--------------------------------------------------+
| Today's Tasks                                   |
| [Task Card] -> tap opens task detail            |
| [Task Card] -> quick complete toggle            |
+--------------------------------------------------+
| Upcoming Tasks                                  |
| [Task Card] -> tap opens task detail            |
+--------------------------------------------------+
| Progress                                        |
| Goal completion bars / streak / weekly insight  |
+--------------------------------------------------+
| Dashboard | Short | Long | Tasks | Habits       |
+--------------------------------------------------+
```

### Goal Detail

```text
+--------------------------------------------------+
| Goal Header + progress bar                       |
| Description                                      |
| Start date | target date | status                |
+--------------------------------------------------+
| Tasks under this goal                            |
| [Task item] [priority] [deadline] [status]       |
+--------------------------------------------------+
| Add task                                         |
+--------------------------------------------------+
```

## 14. Development Roadmap

### Sprint 0: Setup

- create GitHub repo
- define branching rules
- create Flutter project
- configure Firebase projects
- set up environments
- define design tokens

### Sprint 1: Index/Home Dashboard

- app shell
- navigation
- profile icon
- logout
- dashboard cards
- today and upcoming task widgets
- mock data
- responsive layout for mobile and desktop

### Sprint 2: Authentication

- Google Sign-In
- Email/Password
- phone or mobile auth flow
- secure session persistence

### Sprint 3: Goals

- goal CRUD
- default goals on first login
- short-term and long-term filters

### Sprint 4: Tasks and Recurrence

- task CRUD
- recurrence engine
- occurrence generation
- optional time selectors

### Sprint 5: Notifications

- local notifications
- FCM push
- daily summary
- snooze and escalation

### Sprint 6: Dashboard Intelligence

- completed vs pending metrics
- delayed analysis
- drill-down reports
- calendar integration

### Sprint 7: Offline and Quality

- local persistence
- sync conflict handling
- test hardening
- low-end performance tuning

## 15. Safe Workflow for ChatGPT + Claude Working on the Same Repo

To avoid crashes and conflicts when two AIs work on the same project:

1. Never let both AIs edit the same file at the same time.
2. Split ownership by module:
   - ChatGPT: UI specs, component plans, wireframes, design tokens, UX reviews
   - Claude: implementation, logic, Firebase integration, tests, refactors
3. Use branches for every task.
4. Merge only after running analysis and smoke tests.
5. Keep shared contracts stable:
   - models
   - API interfaces
   - theme tokens
   - routing names
6. Maintain a `docs/working-agreement.md` file later with:
   - current task owner
   - files in progress
   - blocked areas
7. Do work in slices:
   - first index page
   - then auth
   - then goals
   - then tasks
8. Avoid giant prompts asking Claude to build the whole app in one shot.

## 16. Release-First Recommendations

To publish faster and with less risk:

- launch with Flutter + Firebase only
- do not block MVP on WhatsApp Business API approval
- do not block MVP on AI suggestions
- do not block MVP on export features
- do not over-animate low-end screens
- keep first release extremely stable

## 17. Suggestions for Improvement

- Replace plain mobile number + password with phone auth or OTP for stronger security.
- Keep seconds optional but hidden in an advanced section.
- Treat habits as a specialized recurring-task mode rather than a completely separate backend model at first.
- Use a flattened task-occurrence model early, because reminders and calendars become much easier.
- Start with one premium dashboard and make that screen excellent before building all modules.

## 18. Immediate Next Step

The best next step is:

1. finalize the dashboard-first MVP scope
2. create the Flutter app shell
3. build the index/home dashboard with mock data
4. review the UI
5. then connect auth and real data
