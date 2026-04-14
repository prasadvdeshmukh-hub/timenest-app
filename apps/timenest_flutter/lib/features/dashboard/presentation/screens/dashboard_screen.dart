import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../shared/models/dashboard_summary.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/models/goal_model.dart';
import '../../../../shared/providers/mock_data.dart';
import '../../../../shared/providers/repository_providers.dart';
import '../../../auth/domain/auth_state.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../widgets/stat_card.dart';
import '../widgets/task_row.dart';
import '../widgets/progress_row.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userName = authState is AuthAuthenticated
        ? authState.user.displayName ?? 'User'
        : 'User';

    // Use Firestore streams, fall back to mock data.
    final goalsAsync = ref.watch(goalsStreamProvider);
    final goals = goalsAsync.when(
      data: (g) => g,
      loading: () => MockData.goals,
      error: (_, __) => MockData.goals,
    );

    final completedGoals = goals.where((g) => g.status == GoalStatus.completed).length;
    final inProgressGoals = goals.where((g) => g.status == GoalStatus.inProgress).length;
    final completedOnTime = goals.where((g) => g.completedOnTime).length;
    final delayedGoals = goals.where((g) => g.status == GoalStatus.delayed).length;

    final summary = DashboardSummary(
      completedGoals: completedGoals,
      inProgressGoals: inProgressGoals,
      completedOnTime: completedOnTime,
      delayedGoals: delayedGoals,
      activeStreak: MockData.dashboardSummary.activeStreak,
      snoozedReminders: MockData.dashboardSummary.snoozedReminders,
      recurringTasksToday: MockData.dashboardSummary.recurringTasksToday,
      executionRhythm: goals.isEmpty ? 0 : goals.map((g) => g.progressPercent).reduce((a, b) => a + b) / goals.length,
    );
    final todaysTasks = MockData.todaysTasks;
    final upcomingTasks = MockData.upcomingTasks;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.darkBg, Color(0xFF0F1629), Color(0xFF121A33)],
          ),
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              // ── Hero header ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Dashboard',
                                      style: Theme.of(context).textTheme.bodySmall),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Good evening, $userName',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineMedium
                                        ?.copyWith(color: Colors.white),
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  Text(
                                    'You have ${summary.inProgressGoals} active goals, '
                                    '${todaysTasks.length} tasks due today, '
                                    '${summary.completedOnTime} goals completed on time, '
                                    'and ${summary.delayedGoals} delayed goals.',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            // Execution rhythm indicator
                            Container(
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: AppColors.cyanPurpleGradient,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.cyan.withOpacity(0.25),
                                    blurRadius: 16,
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  '${summary.executionRhythm.toInt()}%',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 18,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Stats grid ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: AppSpacing.sm,
                    mainAxisSpacing: AppSpacing.sm,
                    childAspectRatio: 1.6,
                    children: [
                      StatCard(
                        label: 'Completed Goals',
                        value: '${summary.completedGoals}',
                        subtitle: '3 finished this month',
                        accentColor: AppColors.cyan,
                      ),
                      StatCard(
                        label: 'In Progress',
                        value: '${summary.inProgressGoals}'.padLeft(2, '0'),
                        subtitle: '2 short-term, 4 long-term',
                        accentColor: AppColors.purple,
                      ),
                      StatCard(
                        label: 'Completed On Time',
                        value: '${summary.completedOnTime}'.padLeft(2, '0'),
                        subtitle: '75% deadline accuracy',
                        accentColor: AppColors.warning,
                      ),
                      StatCard(
                        label: 'Delayed Goals',
                        value: '${summary.delayedGoals}'.padLeft(2, '0'),
                        subtitle: '1 needs immediate follow-up',
                        accentColor: AppColors.error,
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),

              // ── Today's Tasks ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionHeader(
                          context,
                          eyebrow: 'Action Center',
                          title: "Today's Tasks",
                          action: 'View All',
                          onAction: () => context.go('/daily-tasks'),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ...todaysTasks.map((t) => TaskRow(
                              task: t,
                              onTap: () =>
                                  context.push('/task/${t.goalId}/${t.id}'),
                            )),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // ── Upcoming Tasks ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionHeader(
                          context,
                          eyebrow: 'Timeline',
                          title: 'Upcoming Tasks',
                          action: 'Calendar',
                          onAction: () {},
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ...upcomingTasks.map((t) => TaskRow(
                              task: t,
                              isUpcoming: true,
                              onTap: () =>
                                  context.push('/task/${t.goalId}/${t.id}'),
                            )),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // ── Progress Radar ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionHeader(
                          context,
                          eyebrow: 'Goal Drill-Down',
                          title: 'Progress Radar',
                          action: 'Details',
                          onAction: () => goals.isEmpty
                              ? context.push('/goals')
                              : context.push('/goal/${goals.first.id}'),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        if (goals.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                vertical: AppSpacing.md),
                            child: Text(
                              'No goals yet. Add one to start tracking progress.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          )
                        else
                          ...goals.take(3).map(
                                (g) => ProgressRow(
                                  label: g.name,
                                  detail: g.description ?? '',
                                  percent: (g.progressPercent / 100)
                                      .clamp(0.0, 1.0),
                                ),
                              ),
                        const SizedBox(height: AppSpacing.md),
                        // Insight boxes
                        Row(
                          children: [
                            _insightBox(context, '${summary.activeStreak}',
                                'Active streak'),
                            const SizedBox(width: AppSpacing.sm),
                            _insightBox(context, '${summary.snoozedReminders}',
                                'Snoozed'),
                            const SizedBox(width: AppSpacing.sm),
                            _insightBox(context, '${summary.recurringTasksToday}',
                                'Recurring today'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(
    BuildContext context, {
    required String eyebrow,
    required String title,
    required String action,
    required VoidCallback onAction,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(eyebrow, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 2),
            Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)),
          ],
        ),
        TextButton(
          onPressed: onAction,
          child: Text(action, style: const TextStyle(color: AppColors.cyan, fontSize: 13)),
        ),
      ],
    );
  }

  Widget _insightBox(BuildContext context, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSm),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(label,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
