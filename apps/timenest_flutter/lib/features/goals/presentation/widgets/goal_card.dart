import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../shared/models/goal_model.dart';

class GoalCard extends StatelessWidget {
  final GoalModel goal;
  final VoidCallback? onTap;

  const GoalCard({super.key, required this.goal, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(AppSpacing.borderRadius),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              goal.type == GoalType.shortTerm
                  ? '${goal.name} Goal'
                  : goal.name,
              style: TextStyle(
                color: AppColors.cyan,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              goal.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (goal.description != null) ...[
              const SizedBox(height: 4),
              Text(
                goal.description!,
                style: Theme.of(context).textTheme.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: goal.progressPercent / 100,
                minHeight: 6,
                backgroundColor: AppColors.darkBorder,
                valueColor:
                    AlwaysStoppedAnimation<Color>(_progressColor(goal)),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                _statusPill(goal),
                const Spacer(),
                Text(
                  '${goal.progressPercent.toInt()}%',
                  style: const TextStyle(
                    color: AppColors.textSecondaryDark,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusPill(GoalModel goal) {
    Color bg;
    Color fg;
    String label;

    switch (goal.status) {
      case GoalStatus.inProgress:
        bg = AppColors.success.withOpacity(0.12);
        fg = AppColors.success;
        label = goal.progressPercent >= 70 ? 'On Track' : 'In Progress';
        break;
      case GoalStatus.completed:
        bg = AppColors.cyan.withOpacity(0.12);
        fg = AppColors.cyan;
        label = 'Completed';
        break;
      case GoalStatus.delayed:
        bg = AppColors.error.withOpacity(0.12);
        fg = AppColors.error;
        label = 'Needs Fix';
        break;
    }

    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Color _progressColor(GoalModel goal) {
    if (goal.status == GoalStatus.delayed) return AppColors.error;
    if (goal.progressPercent >= 70) return AppColors.success;
    if (goal.progressPercent >= 40) return AppColors.warning;
    return AppColors.cyan;
  }
}
