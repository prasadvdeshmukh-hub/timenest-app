import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';

/// Habit model for local state management.
class Habit {
  final String id;
  final String name;
  int streakDays;
  DateTime lastCheckIn;
  bool isCheckedToday;

  Habit({
    required this.id,
    required this.name,
    required this.streakDays,
    required this.lastCheckIn,
    required this.isCheckedToday,
  });

  /// Copy with for updates.
  Habit copyWith({
    String? id,
    String? name,
    int? streakDays,
    DateTime? lastCheckIn,
    bool? isCheckedToday,
  }) {
    return Habit(
      id: id ?? this.id,
      name: name ?? this.name,
      streakDays: streakDays ?? this.streakDays,
      lastCheckIn: lastCheckIn ?? this.lastCheckIn,
      isCheckedToday: isCheckedToday ?? this.isCheckedToday,
    );
  }
}

class HabitsScreen extends ConsumerStatefulWidget {
  const HabitsScreen({super.key});

  @override
  ConsumerState<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends ConsumerState<HabitsScreen> {
  late List<Habit> habits;

  @override
  void initState() {
    super.initState();
    // Default sample habits have been removed — users start with an
    // empty list and add their own habits.
    habits = <Habit>[];
  }

  void _checkInHabit(int index) {
    setState(() {
      final habit = habits[index];
      final now = DateTime.now();
      final isToday = habit.lastCheckIn.year == now.year &&
          habit.lastCheckIn.month == now.month &&
          habit.lastCheckIn.day == now.day;

      if (!isToday) {
        // Increment streak if not checked in today
        habits[index] = habit.copyWith(
          streakDays: habit.streakDays + 1,
          lastCheckIn: now,
          isCheckedToday: true,
        );
      }
    });
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
                        Text('Habits',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Build consistency with daily habits',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.cyan,
                              padding: const EdgeInsets.symmetric(
                                vertical: AppSpacing.sm,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              // TODO: Add habit action
                            },
                            child: const Text(
                              'Add Habit',
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Habits List ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    children: List.generate(
                      habits.length,
                      (index) => Padding(
                        padding: const EdgeInsets.only(
                            bottom: AppSpacing.md),
                        child: _HabitCard(
                          habit: habits[index],
                          onCheckIn: () => _checkInHabit(index),
                        ),
                      ),
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
}

class _HabitCard extends StatelessWidget {
  final Habit habit;
  final VoidCallback onCheckIn;

  const _HabitCard({
    required this.habit,
    required this.onCheckIn,
  });

  @override
  Widget build(BuildContext context) {
    final lastCheckInStr =
        DateFormat('MMM d, yyyy').format(habit.lastCheckIn);

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      habit.name,
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Streak: ${habit.streakDays} days • Last: $lastCheckInStr',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: habit.isCheckedToday
                      ? AppColors.cyan.withOpacity(0.2)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: habit.isCheckedToday
                        ? AppColors.cyan
                        : AppColors.darkBorder,
                  ),
                ),
                child: Text(
                  habit.isCheckedToday ? '✓ Done' : 'Pending',
                  style: TextStyle(
                    color: habit.isCheckedToday
                        ? AppColors.cyan
                        : Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: habit.isCheckedToday
                    ? AppColors.cyan.withOpacity(0.2)
                    : AppColors.cyan,
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.sm,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              onPressed: habit.isCheckedToday ? null : onCheckIn,
              child: Text(
                habit.isCheckedToday ? 'Checked In Today' : 'Check In',
                style: TextStyle(
                  color: habit.isCheckedToday
                      ? Colors.black54
                      : Colors.black,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
