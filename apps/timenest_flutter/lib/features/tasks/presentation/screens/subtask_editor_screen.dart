import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../../../../shared/models/task_model.dart';
import '../../../../shared/providers/repository_providers.dart';

class SubtaskEditorScreen extends ConsumerStatefulWidget {
  final String goalId;
  final String taskId;

  const SubtaskEditorScreen({
    super.key,
    required this.goalId,
    required this.taskId,
  });

  @override
  ConsumerState<SubtaskEditorScreen> createState() =>
      _SubtaskEditorScreenState();
}

class _SubtaskEditorScreenState extends ConsumerState<SubtaskEditorScreen> {
  final _nameController = TextEditingController();
  final _uuid = const Uuid();

  // Start with mock subtasks if editing an existing task.
  late List<Subtask> _subtasks;

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSubtasks();
  }

  Future<void> _loadSubtasks() async {
    try {
      final repo = ref.read(taskRepositoryProvider);
      final task = await repo.getTask(widget.goalId, widget.taskId);
      if (task != null && mounted) {
        setState(() {
          _subtasks = List.from(task.subtasks);
          _loading = false;
        });
      } else {
        if (mounted) setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Subtask Editor',
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Break your task into smaller steps',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // Existing subtasks
                      if (_subtasks.isNotEmpty) ...[
                        ...List.generate(_subtasks.length, (i) {
                          final s = _subtasks[i];
                          return Padding(
                            padding:
                                const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _subtasks[i] = s.copyWith(
                                          isCompleted: !s.isCompleted);
                                    });
                                  },
                                  child: Icon(
                                    s.isCompleted
                                        ? Icons.check_circle
                                        : Icons.radio_button_unchecked,
                                    color: s.isCompleted
                                        ? AppColors.success
                                        : AppColors.textMutedDark,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(
                                  child: Text(
                                    s.name,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      decoration: s.isCompleted
                                          ? TextDecoration.lineThrough
                                          : null,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 18),
                                  color: AppColors.textMutedDark,
                                  onPressed: () {
                                    setState(() => _subtasks.removeAt(i));
                                  },
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: AppSpacing.md),
                      ],

                      // Add new subtask
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _nameController,
                              decoration: const InputDecoration(
                                labelText: 'Subtask Name',
                                hintText: 'e.g. Update milestone slide',
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          IconButton(
                            icon: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.cyan.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.add,
                                  color: AppColors.cyan, size: 20),
                            ),
                            onPressed: _addSubtask,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      GradientButton(
                        label: 'Save Subtasks',
                        onPressed: _handleSave,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _addSubtask() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    setState(() {
      _subtasks.add(Subtask(id: _uuid.v4(), name: name));
      _nameController.clear();
    });
  }

  Future<void> _handleSave() async {
    try {
      final repo = ref.read(taskRepositoryProvider);
      await repo.updateSubtasks(widget.goalId, widget.taskId, _subtasks);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving subtasks: $e')),
        );
      }
    }
  }
}
