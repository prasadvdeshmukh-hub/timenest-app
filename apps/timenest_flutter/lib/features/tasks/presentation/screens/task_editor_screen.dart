import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/providers/repository_providers.dart';

class TaskEditorScreen extends ConsumerStatefulWidget {
  final String? goalId;
  final String? taskId;

  const TaskEditorScreen({super.key, this.goalId, this.taskId});

  @override
  ConsumerState<TaskEditorScreen> createState() => _TaskEditorScreenState();
}

class _TaskEditorScreenState extends ConsumerState<TaskEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _notesController = TextEditingController();

  TaskPriority _priority = TaskPriority.medium;
  DateTime _deadlineDate = DateTime.now();
  TimeOfDay _deadlineTime = const TimeOfDay(hour: 19, minute: 30);
  bool _timeEnabled = true;
  RecurrenceType _recurrence = RecurrenceType.none;
  ReminderChannels _channels = const ReminderChannels(inApp: true);

  bool get isEditing => widget.taskId != null;

  @override
  void dispose() {
    _nameController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios, size: 20),
                    onPressed: () => context.pop(),
                    color: AppColors.textSecondaryDark,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                GlassCard(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          isEditing ? 'Edit Task' : 'Create Task',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Set date, time, recurrence, and reminders',
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.lg),

                        // Name
                        TextFormField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Task Name',
                            hintText: 'Submit investor-ready roadmap',
                          ),
                          validator: (v) =>
                              v == null || v.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Priority
                        Text('Priority',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: TaskPriority.values
                              .map((p) => Expanded(
                                    child: Padding(
                                      padding: EdgeInsets.only(
                                          right: p != TaskPriority.high
                                              ? AppSpacing.sm
                                              : 0),
                                      child: _selectablePill(
                                        p.name[0].toUpperCase() +
                                            p.name.substring(1),
                                        _priority == p,
                                        () => setState(() => _priority = p),
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Date & Time
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () async {
                                  final d = await showDatePicker(
                                    context: context,
                                    initialDate: _deadlineDate,
                                    firstDate: DateTime(2020),
                                    lastDate: DateTime(2030),
                                  );
                                  if (d != null) {
                                    setState(() => _deadlineDate = d);
                                  }
                                },
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Deadline Date',
                                    suffixIcon:
                                        Icon(Icons.calendar_today, size: 18),
                                  ),
                                  child: Text(
                                    DateFormat('dd MMM yyyy')
                                        .format(_deadlineDate),
                                    style:
                                        const TextStyle(color: Colors.white),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: GestureDetector(
                                onTap: () async {
                                  final t = await showTimePicker(
                                    context: context,
                                    initialTime: _deadlineTime,
                                  );
                                  if (t != null) {
                                    setState(() {
                                      _deadlineTime = t;
                                      _timeEnabled = true;
                                    });
                                  }
                                },
                                child: InputDecorator(
                                  decoration: const InputDecoration(
                                    labelText: 'Time',
                                    suffixIcon:
                                        Icon(Icons.access_time, size: 18),
                                  ),
                                  child: Text(
                                    _timeEnabled
                                        ? _deadlineTime.format(context)
                                        : 'Not set',
                                    style:
                                        const TextStyle(color: Colors.white),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Notes
                        TextFormField(
                          controller: _notesController,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'Notes',
                            hintText: 'Add notes, context, or checklist',
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),

                        // Recurrence
                        Text('Recurrence',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.sm),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: RecurrenceType.values
                              .map((r) => _selectablePill(
                                    r == RecurrenceType.custom
                                        ? 'Custom Days'
                                        : r.name[0].toUpperCase() +
                                            r.name.substring(1),
                                    _recurrence == r,
                                    () => setState(() => _recurrence = r),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: AppSpacing.lg),

                        // Notification channels
                        Text('Notification Channels',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.sm),
                        Wrap(
                          spacing: AppSpacing.sm,
                          runSpacing: AppSpacing.sm,
                          children: [
                            _togglePill('Push', _channels.push, (v) {
                              setState(() =>
                                  _channels = _channels.copyWith(push: v));
                            }),
                            _togglePill('In-App', _channels.inApp, (v) {
                              setState(() =>
                                  _channels = _channels.copyWith(inApp: v));
                            }),
                            _togglePill('Email', _channels.email, (v) {
                              setState(() =>
                                  _channels = _channels.copyWith(email: v));
                            }),
                            _togglePill('SMS', _channels.sms, (v) {
                              setState(() =>
                                  _channels = _channels.copyWith(sms: v));
                            }),
                            _togglePill('WhatsApp', _channels.whatsapp, (v) {
                              setState(() =>
                                  _channels = _channels.copyWith(whatsapp: v));
                            }),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.xl),

                        // Actions
                        GradientButton(
                          label: isEditing ? 'Save Task' : 'Create Task',
                          onPressed: _handleSave,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () =>
                                    context.push('/subtask-editor/${widget.goalId ?? "new"}/new'),
                                child: const Text('Add Subtask'),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _resetForm,
                                child: const Text('Reset'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _selectablePill(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.cyan.withOpacity(0.15)
              : AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.cyan : AppColors.darkBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.cyan : AppColors.textMutedDark,
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _togglePill(
      String label, bool isOn, ValueChanged<bool> onChanged) {
    return GestureDetector(
      onTap: () => onChanged(!isOn),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isOn ? AppColors.cyan.withOpacity(0.15) : AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isOn ? AppColors.cyan : AppColors.darkBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isOn ? AppColors.cyan : AppColors.textMutedDark,
            fontSize: 13,
            fontWeight: isOn ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  bool _saving = false;

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.goalId == null || widget.goalId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a goal for this task')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final repo = ref.read(taskRepositoryProvider);
      final now = DateTime.now();
      final deadlineWithTime = DateTime(
        _deadlineDate.year,
        _deadlineDate.month,
        _deadlineDate.day,
        _deadlineTime.hour,
        _deadlineTime.minute,
      );
      if (isEditing) {
        final existing = await repo.getTask(widget.goalId!, widget.taskId!);
        if (existing != null) {
          await repo.updateTask(existing.copyWith(
            name: _nameController.text.trim(),
            notes: _notesController.text.trim(),
            priority: _priority,
            deadlineDate: deadlineWithTime,
            deadlineTimeEnabled: _timeEnabled,
            deadlineHour: _deadlineTime.hour,
            deadlineMinute: _deadlineTime.minute,
            recurrenceType: _recurrence,
            reminderChannels: _channels,
          ));
        }
      } else {
        await repo.createTask(TaskModel(
          id: '',
          goalId: widget.goalId!,
          name: _nameController.text.trim(),
          notes: _notesController.text.trim(),
          priority: _priority,
          deadlineDate: deadlineWithTime,
          deadlineTimeEnabled: _timeEnabled,
          deadlineHour: _deadlineTime.hour,
          deadlineMinute: _deadlineTime.minute,
          recurrenceType: _recurrence,
          reminderChannels: _channels,
          createdAt: now,
          updatedAt: now,
        ));
      }
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _resetForm() {
    _nameController.clear();
    _notesController.clear();
    setState(() {
      _priority = TaskPriority.medium;
      _deadlineDate = DateTime.now();
      _deadlineTime = const TimeOfDay(hour: 19, minute: 30);
      _recurrence = RecurrenceType.none;
      _channels = const ReminderChannels(inApp: true);
    });
  }
}
