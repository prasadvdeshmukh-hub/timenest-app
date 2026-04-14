import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/providers/mock_data.dart';
import '../../../../shared/providers/repository_providers.dart';

class TaskDetailScreen extends ConsumerWidget {
  final String goalId;
  final String taskId;

  const TaskDetailScreen({
    super.key,
    required this.goalId,
    required this.taskId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Try Firestore first, fall back to mock.
    final tasksAsync = ref.watch(tasksForGoalProvider(goalId));
    final goalsAsync = ref.watch(goalsStreamProvider);

    // Default sample data has been removed — if Firestore has nothing
    // for this id, show an empty state instead of crashing on an empty
    // mock list.
    final allMockTasks = [...MockData.todaysTasks, ...MockData.upcomingTasks];
    final TaskModel? task = tasksAsync.when(
          data: (tasks) => tasks.where((t) => t.id == taskId).firstOrNull,
          loading: () => null,
          error: (_, __) => null,
        ) ??
        allMockTasks.where((t) => t.id == taskId).firstOrNull;
    final goal = goalsAsync.when(
          data: (goals) => goals.where((g) => g.id == goalId).firstOrNull,
          loading: () => null,
          error: (_, __) => null,
        ) ??
        MockData.goals.where((g) => g.id == goalId).firstOrNull;

    if (task == null || goal == null) {
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
                        'Task not found.\nCreate a new task to get started.',
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
              // Back
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
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Task Detail',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 4),
                        Text(
                          task.name,
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: [
                            _priorityPill(task.priority),
                            _infoPill(
                              '${DateFormat('dd MMM').format(task.deadlineDate)}'
                              '${task.deadlineTimeEnabled ? ' · ${task.deadlineTimeString}' : ''}',
                            ),
                            _infoPill('Recurrence: ${task.recurrenceLabel}'),
                            GestureDetector(
                              onTap: () => context.push('/task-editor'),
                              child: _infoPill('Edit Task'),
                            ),
                            GestureDetector(
                              onTap: () => context.push('/subtask-editor/$goalId/$taskId'),
                              child: _infoPill('Add Subtask'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // Execution details
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Execution Details',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.md),
                        _detailRow('Goal', goal.name),
                        _detailRow('Time',
                            task.deadlineTimeEnabled ? task.deadlineTimeString : 'No time set'),
                        _detailRow(
                            'Reminder Channels',
                            '${task.reminderChannels.activeCount} active'),
                        if (task.notes != null)
                          _detailRow('Notes', task.notes!),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // Notification channel toggles
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Notification Channels',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.md),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: [
                            _toggleChip('Push', task.reminderChannels.push),
                            _toggleChip('In-App', task.reminderChannels.inApp),
                            _toggleChip('Email', task.reminderChannels.email),
                            _toggleChip('SMS', task.reminderChannels.sms),
                            _toggleChip(
                                'WhatsApp', task.reminderChannels.whatsapp),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // Subtasks
              if (task.subtasks.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    child: GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Subtasks',
                              style: Theme.of(context).textTheme.bodySmall),
                          const SizedBox(height: AppSpacing.md),
                          ...task.subtasks.map((s) => Padding(
                                padding: const EdgeInsets.only(
                                    bottom: AppSpacing.sm),
                                child: Row(
                                  children: [
                                    Icon(
                                      s.isCompleted
                                          ? Icons.check_circle
                                          : Icons.radio_button_unchecked,
                                      color: s.isCompleted
                                          ? AppColors.success
                                          : AppColors.textMutedDark,
                                      size: 20,
                                    ),
                                    const SizedBox(width: AppSpacing.sm),
                                    Text(s.name,
                                        style: const TextStyle(
                                            color: Colors.white, fontSize: 14)),
                                  ],
                                ),
                              )),
                        ],
                      ),
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.md)),

              // Quick actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Quick Actions',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.md),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: [
                            GestureDetector(
                              onTap: () async {
                                final repo = ref.read(taskRepositoryProvider);
                                await repo.completeTask(goalId, taskId);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Task completed!')),
                                  );
                                }
                              },
                              child: _actionChip('Mark Complete', AppColors.success),
                            ),
                            GestureDetector(
                              onTap: () async {
                                final repo = ref.read(taskRepositoryProvider);
                                await repo.skipTask(goalId, taskId);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Task skipped')),
                                  );
                                }
                              },
                              child: _actionChip('Skip', AppColors.textSecondaryDark),
                            ),
                            GestureDetector(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: DateTime.now().add(const Duration(days: 1)),
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime(2030),
                                );
                                if (picked != null) {
                                  final repo = ref.read(taskRepositoryProvider);
                                  await repo.rescheduleTask(goalId, taskId, picked);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Task rescheduled')),
                                    );
                                  }
                                }
                              },
                              child: _actionChip('Reschedule', AppColors.textSecondaryDark),
                            ),
                            GestureDetector(
                              onTap: () async {
                                final repo = ref.read(taskRepositoryProvider);
                                await repo.snoozeTask(goalId, taskId);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Task snoozed by 1 hour')),
                                  );
                                }
                              },
                              child: _actionChip('Snooze', AppColors.textSecondaryDark),
                            ),
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

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: AppColors.textSecondaryDark, fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _toggleChip(String label, bool isOn) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isOn ? AppColors.cyan.withOpacity(0.12) : AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOn ? AppColors.cyan.withOpacity(0.3) : AppColors.darkBorder,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isOn ? AppColors.cyan : AppColors.textMutedDark,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _actionChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _priorityPill(TaskPriority priority) {
    final color = priority == TaskPriority.high
        ? AppColors.error
        : priority == TaskPriority.medium
            ? AppColors.warning
            : AppColors.success;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '${priority.name[0].toUpperCase()}${priority.name.substring(1)} Priority',
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
          style: const TextStyle(
              color: AppColors.textSecondaryDark, fontSize: 12)),
    );
  }
}
