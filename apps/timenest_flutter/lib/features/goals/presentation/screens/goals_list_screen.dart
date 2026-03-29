import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../shared/models/goal_model.dart';
import '../../../../shared/providers/mock_data.dart';
import '../widgets/goal_card.dart';

/// Reusable screen for both short-term and long-term goals.
class GoalsListScreen extends ConsumerWidget {
  final GoalType goalType;

  const GoalsListScreen({super.key, required this.goalType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Using mock data. Switch to Firestore stream later.
    final goals =
        MockData.goals.where((g) => g.type == goalType).toList();
    final isShortTerm = goalType == GoalType.shortTerm;

    final completed = goals.where((g) => g.status == GoalStatus.completed).length;
    final inProgress = goals.where((g) => g.status == GoalStatus.inProgress).length;
    final delayed = goals.where((g) => g.status == GoalStatus.delayed).length;

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
                        Text(
                          isShortTerm ? 'Short-Term Focus' : 'Long-Term Vision',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isShortTerm
                              ? 'High-momentum goals for the next 30 to 90 days'
                              : 'Strategic goals for the next 6 to 12 months',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            _actionPill(
                                context, 'Add Goal', () => context.push('/goal-editor')),
                            const SizedBox(width: AppSpacing.sm),
                            _actionPill(
                                context, 'Add Task', () => context.push('/task-editor')),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Metric strip
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Row(
                    children: [
                      _miniMetric(context, 'Completed', '$completed'),
                      const SizedBox(width: AppSpacing.sm),
                      _miniMetric(context, 'In Progress', '$inProgress'),
                      const SizedBox(width: AppSpacing.sm),
                      _miniMetric(context, 'Delayed', '$delayed'),
                      const SizedBox(width: AppSpacing.sm),
                      _miniMetric(context, 'Total', '${goals.length}'),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),

              // Goal cards grid
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => GoalCard(
                      goal: goals[index],
                      onTap: () => context.push('/goal/${goals[index].id}'),
                    ),
                    childCount: goals.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 400,
                    mainAxisSpacing: AppSpacing.md,
                    crossAxisSpacing: AppSpacing.md,
                    childAspectRatio: 1.3,
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
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Text(label,
            style: const TextStyle(color: AppColors.cyan, fontSize: 13)),
      ),
    );
  }

  Widget _miniMetric(BuildContext context, String label, String value) {
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
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
