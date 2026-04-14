import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../shared/models/goal_model.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/providers/repository_providers.dart';
import '../../../../shared/providers/mock_data.dart';

class GoalDetailScreen extends ConsumerWidget {
  final String goalId;

  const GoalDetailScreen({super.key, required this.goalId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Try Firestore first, fall back to mock data.
    final goalsAsync = ref.watch(goalsStreamProvider);
    final tasksAsync = ref.watch(tasksForGoalProvider(goalId));

    // Default sample data has been removed — if Firestore has nothing
    // for this id, show an empty state rather than crashing on an empty
    // fallback list.
    final goal = goalsAsync.when(
          data: (goals) => goals.where((g) => g.id == goalId).firstOrNull,
          loading: () => null,
          error: (_, __) => null,
        ) ??
        MockData.goals.where((g) => g.id == goalId).firstOrNull;

    final tasks = tasksAsync.when(
      data: (t) => t,
      loading: () => <TaskModel>[],
      error: (_, __) => <TaskModel>[],
    );

    if (goal == null) {
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(
                      left: AppSpacing.md, top: AppSpacing.sm),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios, size: 20),
                    onPressed: () => context.pop(),
                    color: AppColors.textSecondaryDark,
                  ),
                ),
                const Expanded(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(AppSpacing.lg),
                      child: Text(
                        'Goal not found.\nCreate a new goal to get started.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondaryDark,
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

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
              // Back button
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(
                      left: AppSpacing.md, top: AppSpacing.sm),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios, size: 20),
                      onPressed: () => context.pop(),
                      color: AppColors.textSecondaryDark,
                    ),
                  ),
                ),
              ),

              // Hero
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 3,
                        child: GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Goal Detail',
                                  style: Theme.of(context).textTheme.bodySmall),
                              const SizedBox(height: 4),
                              Text(
                                goal.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(color: Colors.white),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              if (goal.description != null)
                                Text(goal.description!,
                                    style: Theme.of(context).textTheme.bodyMedium),
                              const SizedBox(height: AppSpacing.md),
                              Wrap(
                                spacing: AppSpacing.sm,
                                runSpacing: AppSpacing.sm,
                                children: [
                                  _statusPill(goal),
                                  _infoPill('Start: ${DateFormat('dd MMM yyyy').format(goal.startDate)}'),
                                  _infoPill('Target: ${DateFormat('dd MMM yyyy').format(goal.targetDate)}'),
                                  GestureDetector(
                                    onTap: () => context.push('/task-editor'),
                                    child: _infoPill('Add Task'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      // Progress side card
                      SizedBox(
                        width: 100,
                        child: GlassCard(
                          child: Column(
                            children: [
                              Text('Progress',
                                  style: Theme.of(context).textTheme.bodySmall),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                '${goal.progressPercent.toInt()}%',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: goal.progressPercent / 100,
                                  minHeight: 6,
                                  backgroundColor: AppColors.darkBorder,
                                  valueColor: const AlwaysStoppedAnimation<Color>(
                                      AppColors.cyan),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),

              // Tasks under goal
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tasks Under Goal',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.md),
                        if (tasks.isEmpty)
                          Center(
                            child: Text('No tasks yet',
                                style: Theme.of(context).textTheme.bodyMedium),
                          )
                        else
                          ...tasks.map((t) => _taskItem(context, t)),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () =>
                                  context.push('/goal-editor?id=$goalId'),
                              child: const Text('Edit Goal'),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () async {
                                final isCompleted =
                                    goal.status == GoalStatus.completed;
                                final updated = goal.copyWith(
                                  status: isCompleted
                                      ? GoalStatus.inProgress
                                      : GoalStatus.completed,
                                  completedAt:
                                      isCompleted ? null : DateTime.now(),
                                  completedOnTime: !isCompleted &&
                                      DateTime.now()
                                          .isBefore(goal.targetDate),
                                  progressPercent:
                                      isCompleted ? goal.progressPercent : 100,
                                );
                                await ref
                                    .read(goalRepositoryProvider)
                                    .updateGoal(updated);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(isCompleted
                                          ? 'Goal reopened'
                                          : 'Goal marked complete'),
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor:
                                    goal.status == GoalStatus.completed
                                        ? AppColors.warning
                                        : AppColors.success,
                                side: BorderSide(
                                  color: goal.status == GoalStatus.completed
                                      ? AppColors.warning
                                      : AppColors.success,
                                ),
                              ),
                              child: Text(goal.status == GoalStatus.completed
                                  ? 'Reopen'
                                  : 'Mark Complete'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () async {
                            final confirmed = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Delete Goal'),
                                content: const Text(
                                    'This will also delete all tasks under this goal. Continue?'),
                                actions: [
                                  TextButton(
                                      onPressed: () => Navigator.pop(ctx, false),
                                      child: const Text('Cancel')),
                                  TextButton(
                                      onPressed: () => Navigator.pop(ctx, true),
                                      child: const Text('Delete',
                                          style: TextStyle(color: Colors.red))),
                                ],
                              ),
                            );
                            if (confirmed == true) {
                              await ref
                                  .read(goalRepositoryProvider)
                                  .deleteGoal(goalId);
                              if (context.mounted) context.pop();
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: const BorderSide(color: AppColors.error),
                          ),
                          child: const Text('Delete Goal'),
                        ),
                      ),
                    ],
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

  Widget _taskItem(BuildContext context, TaskModel task) {
    return InkWell(
      onTap: () => context.push('/task/${task.goalId}/${task.id}'),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.name,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    '${DateFormat('dd MMM').format(task.deadlineDate)} · ${task.deadlineTimeString}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: task.status == TaskStatus.completed
                    ? AppColors.success.withOpacity(0.12)
                    : AppColors.warning.withOpacity(0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                task.status == TaskStatus.completed ? 'Done' : 'Pending',
                style: TextStyle(
                  color: task.status == TaskStatus.completed
                      ? AppColors.success
                      : AppColors.warning,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusPill(GoalModel goal) {
    final color = goal.status == GoalStatus.delayed
        ? AppColors.error
        : AppColors.success;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        goal.statusLabel,
        style:
            TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _infoPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Text(text,
          style: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
    );
  }
}
