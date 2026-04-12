import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/providers/mock_data.dart';
import '../../../../shared/providers/repository_providers.dart';
import '../../../dashboard/presentation/widgets/task_row.dart';

class DailyTasksScreen extends ConsumerWidget {
  const DailyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allTasks = [...MockData.todaysTasks, ...MockData.upcomingTasks];
    final todayTasks = MockData.todaysTasks;
    final upcomingTasks = MockData.upcomingTasks;

    final pending =
        allTasks.where((t) => t.status == TaskStatus.pending).length;
    final completed =
        allTasks.where((t) => t.status == TaskStatus.completed).length;

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
              // Hero
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Action Center',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 4),
                        Text(
                          'Daily Task Management',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Track and complete your daily tasks. Tap any task to see details, subtasks, and reminders.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Row(
                          children: [
                            _actionPill(
                                context, 'Add Task', () => context.push('/task-editor')),
                            const SizedBox(width: AppSpacing.sm),
                            _infoPill('$pending pending'),
                            const SizedBox(width: AppSpacing.sm),
                            _infoPill('$completed done'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Today's tasks
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Today's Tasks",
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(color: Colors.white)),
                        const SizedBox(height: AppSpacing.md),
                        ...todayTasks.map((t) => TaskRow(
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

              // Upcoming
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Upcoming',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(color: Colors.white)),
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

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionPill(BuildContext context, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.cyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cyan.withOpacity(0.3)),
        ),
        child: Text(label,
            style: const TextStyle(color: AppColors.cyan, fontSize: 13)),
      ),
    );
  }

  Widget _infoPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
