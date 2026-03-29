import 'package:equatable/equatable.dart';

/// Aggregated dashboard metrics shown on the home screen.
class DashboardSummary extends Equatable {
  final int completedGoals;
  final int inProgressGoals;
  final int completedOnTime;
  final int delayedGoals;
  final int activeStreak;
  final int snoozedReminders;
  final int recurringTasksToday;
  final double executionRhythm;

  const DashboardSummary({
    this.completedGoals = 0,
    this.inProgressGoals = 0,
    this.completedOnTime = 0,
    this.delayedGoals = 0,
    this.activeStreak = 0,
    this.snoozedReminders = 0,
    this.recurringTasksToday = 0,
    this.executionRhythm = 0,
  });

  @override
  List<Object?> get props => [
        completedGoals, inProgressGoals, completedOnTime, delayedGoals,
        activeStreak, snoozedReminders, recurringTasksToday, executionRhythm,
      ];
}
