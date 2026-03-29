import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/domain/auth_state.dart';
import '../features/auth/presentation/providers/auth_providers.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/signup_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/goals/presentation/screens/goals_list_screen.dart';
import '../features/goals/presentation/screens/goal_detail_screen.dart';
import '../features/goals/presentation/screens/goal_editor_screen.dart';
import '../features/tasks/presentation/screens/daily_tasks_screen.dart';
import '../features/tasks/presentation/screens/task_detail_screen.dart';
import '../features/tasks/presentation/screens/task_editor_screen.dart';
import '../features/tasks/presentation/screens/subtask_editor_screen.dart';
import '../shared/models/goal_model.dart';
import 'shell_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// GoRouter configuration with auth guards and bottom navigation shell.
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuth = authState is AuthAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup' ||
          state.matchedLocation == '/forgot-password';

      if (authState is AuthInitial || authState is AuthLoading) return null;
      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/';
      return null;
    },
    routes: [
      // ── Auth routes (no bottom nav) ──
      GoRoute(
        path: '/login',
        name: 'login',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        name: 'signup',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // ── Main app shell with bottom navigation ──
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/short-term-goals',
            name: 'short-term-goals',
            builder: (context, state) =>
                const GoalsListScreen(goalType: GoalType.shortTerm),
          ),
          GoRoute(
            path: '/long-term-goals',
            name: 'long-term-goals',
            builder: (context, state) =>
                const GoalsListScreen(goalType: GoalType.longTerm),
          ),
          GoRoute(
            path: '/daily-tasks',
            name: 'daily-tasks',
            builder: (context, state) => const DailyTasksScreen(),
          ),
          GoRoute(
            path: '/habits',
            name: 'habits',
            builder: (context, state) => const Scaffold(
              body: Center(
                child: Text('Habits — Coming Soon',
                    style: TextStyle(color: Colors.white)),
              ),
            ),
          ),
        ],
      ),

      // ── Detail & editor routes (pushed on top, no bottom nav) ──
      GoRoute(
        path: '/goal/:goalId',
        name: 'goal-detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => GoalDetailScreen(
          goalId: state.pathParameters['goalId']!,
        ),
      ),
      GoRoute(
        path: '/goal-editor',
        name: 'goal-editor',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => GoalEditorScreen(
          goalId: state.uri.queryParameters['id'],
        ),
      ),
      GoRoute(
        path: '/task/:goalId/:taskId',
        name: 'task-detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => TaskDetailScreen(
          goalId: state.pathParameters['goalId']!,
          taskId: state.pathParameters['taskId']!,
        ),
      ),
      GoRoute(
        path: '/task-editor',
        name: 'task-editor',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => TaskEditorScreen(
          goalId: state.uri.queryParameters['goalId'],
          taskId: state.uri.queryParameters['taskId'],
        ),
      ),
      GoRoute(
        path: '/subtask-editor/:goalId/:taskId',
        name: 'subtask-editor',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => SubtaskEditorScreen(
          goalId: state.pathParameters['goalId']!,
          taskId: state.pathParameters['taskId']!,
        ),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text(
          'Page not found',
          style: const TextStyle(color: Colors.white),
        ),
      ),
    ),
  );
});
