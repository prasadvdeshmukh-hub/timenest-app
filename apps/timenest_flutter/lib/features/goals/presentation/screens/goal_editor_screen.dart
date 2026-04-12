import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../../../../shared/models/goal_model.dart';
import '../../../../shared/providers/repository_providers.dart';

class GoalEditorScreen extends ConsumerStatefulWidget {
  final String? goalId; // null = create, non-null = edit

  const GoalEditorScreen({super.key, this.goalId});

  @override
  ConsumerState<GoalEditorScreen> createState() => _GoalEditorScreenState();
}

class _GoalEditorScreenState extends ConsumerState<GoalEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  GoalType _type = GoalType.shortTerm;
  DateTime _startDate = DateTime.now();
  DateTime _targetDate = DateTime.now().add(const Duration(days: 30));

  bool get isEditing => widget.goalId != null;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
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
                // Back
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
                          isEditing ? 'Edit Goal' : 'Create Goal',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.lg),

                        // Name
                        TextFormField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Goal Name',
                            hintText: 'e.g. Fitness Goal',
                          ),
                          validator: (v) =>
                              v == null || v.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Description
                        TextFormField(
                          controller: _descController,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'Description',
                            hintText: 'Describe your goal...',
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Type selector
                        Text('Goal Type',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            _typePill('Short-Term', GoalType.shortTerm),
                            const SizedBox(width: AppSpacing.sm),
                            _typePill('Long-Term', GoalType.longTerm),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Dates
                        Row(
                          children: [
                            Expanded(
                              child: _datePicker(
                                context,
                                label: 'Start Date',
                                date: _startDate,
                                onPicked: (d) =>
                                    setState(() => _startDate = d),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: _datePicker(
                                context,
                                label: 'Target Date',
                                date: _targetDate,
                                onPicked: (d) =>
                                    setState(() => _targetDate = d),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.xl),

                        GradientButton(
                          label: isEditing ? 'Save Changes' : 'Create Goal',
                          onPressed: _handleSave,
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

  Widget _typePill(String label, GoalType type) {
    final selected = _type == type;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _type = type),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.cyan.withOpacity(0.15) : AppColors.darkCard,
            borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSm),
            border: Border.all(
              color: selected ? AppColors.cyan : AppColors.darkBorder,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: selected ? AppColors.cyan : AppColors.textMutedDark,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _datePicker(
    BuildContext context, {
    required String label,
    required DateTime date,
    required ValueChanged<DateTime> onPicked,
  }) {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date,
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
        );
        if (picked != null) onPicked(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today, size: 18),
        ),
        child: Text(
          DateFormat('dd MMM yyyy').format(date),
          style: const TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  bool _saving = false;

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_targetDate.isBefore(_startDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Target date must be after start date')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final repo = ref.read(goalRepositoryProvider);
      final now = DateTime.now();
      if (isEditing) {
        final existing = await repo.getGoal(widget.goalId!);
        if (existing != null) {
          await repo.updateGoal(existing.copyWith(
            name: _nameController.text.trim(),
            description: _descController.text.trim(),
            type: _type,
            startDate: _startDate,
            targetDate: _targetDate,
          ));
        }
      } else {
        await repo.createGoal(GoalModel(
          id: '',
          name: _nameController.text.trim(),
          description: _descController.text.trim(),
          type: _type,
          startDate: _startDate,
          targetDate: _targetDate,
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
}
