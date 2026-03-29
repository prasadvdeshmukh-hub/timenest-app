import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../shared/models/task_model.dart';

class TaskRow extends StatelessWidget {
  final TaskModel task;
  final bool isUpcoming;
  final VoidCallback? onTap;

  const TaskRow({
    super.key,
    required this.task,
    this.isUpcoming = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final priorityColor = _priorityColor(task.priority);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSm),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Row(
          children: [
            // Status dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isUpcoming
                    ? AppColors.textMutedDark
                    : priorityColor,
                boxShadow: isUpcoming
                    ? null
                    : [BoxShadow(color: priorityColor.withOpacity(0.4), blurRadius: 6)],
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            // Task info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    task.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _subtitleText(),
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Tag
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm, vertical: 4),
              decoration: BoxDecoration(
                color: priorityColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                task.isHabit ? 'Habit' : task.priorityLabel,
                style: TextStyle(
                  color: priorityColor,
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

  String _subtitleText() {
    final parts = <String>[];

    // Find goal name from mock data (simplified).
    if (task.recurrenceType != RecurrenceType.none) {
      parts.add('${task.recurrenceLabel} recurrence');
    }

    if (task.deadlineTimeEnabled) {
      final time = task.deadlineTimeString;
      if (isUpcoming) {
        final dateStr = DateFormat('dd MMM yyyy').format(task.deadlineDate);
        parts.add('$dateStr · $time');
      } else {
        parts.add('Due $time');
      }
    }

    return parts.join(' · ');
  }

  Color _priorityColor(TaskPriority p) {
    switch (p) {
      case TaskPriority.high:
        return AppColors.error;
      case TaskPriority.medium:
        return AppColors.warning;
      case TaskPriority.low:
        return AppColors.success;
    }
  }
}
