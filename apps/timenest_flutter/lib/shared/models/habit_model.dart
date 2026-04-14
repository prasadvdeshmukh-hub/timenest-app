import 'package:equatable/equatable.dart';
import 'task_model.dart' show ReminderChannels;

/// How often a habit repeats.
enum HabitSchedule { daily, weekdays, weekends, custom }

/// The habit's overall lifecycle.
enum HabitStatus { active, paused, archived }

/// Core habit entity — maps to Firestore `users/{uid}/habits/{habitId}`.
class HabitModel extends Equatable {
  final String id;
  final String name;
  final String? category;
  final String? notes;
  final HabitSchedule schedule;
  final List<int> customDays; // 1=Mon..7=Sun
  final bool reminderTimeEnabled;
  final int reminderHour;
  final int reminderMinute;
  final ReminderChannels reminderChannels;
  final String? linkedGoalId;
  final String? successRule; // free-form description for now
  final HabitStatus status;
  final int streakDays;
  final int bestStreakDays;
  final DateTime? lastCheckIn;
  final Map<String, bool> history; // ISO yyyy-MM-dd → completed
  final DateTime createdAt;
  final DateTime updatedAt;

  const HabitModel({
    required this.id,
    required this.name,
    this.category,
    this.notes,
    this.schedule = HabitSchedule.daily,
    this.customDays = const [],
    this.reminderTimeEnabled = false,
    this.reminderHour = 9,
    this.reminderMinute = 0,
    this.reminderChannels = const ReminderChannels(),
    this.linkedGoalId,
    this.successRule,
    this.status = HabitStatus.active,
    this.streakDays = 0,
    this.bestStreakDays = 0,
    this.lastCheckIn,
    this.history = const {},
    required this.createdAt,
    required this.updatedAt,
  });

  factory HabitModel.fromFirestore(String id, Map<String, dynamic> data) {
    return HabitModel(
      id: id,
      name: data['name'] as String? ?? '',
      category: data['category'] as String?,
      notes: data['notes'] as String?,
      schedule: HabitSchedule.values.firstWhere(
        (e) => e.name == data['schedule'],
        orElse: () => HabitSchedule.daily,
      ),
      customDays: List<int>.from(data['customDays'] as List? ?? []),
      reminderTimeEnabled: data['reminderTimeEnabled'] as bool? ?? false,
      reminderHour: data['reminderHour'] as int? ?? 9,
      reminderMinute: data['reminderMinute'] as int? ?? 0,
      reminderChannels: ReminderChannels.fromMap(
        data['reminderChannels'] as Map<String, dynamic>?,
      ),
      linkedGoalId: data['linkedGoalId'] as String?,
      successRule: data['successRule'] as String?,
      status: HabitStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => HabitStatus.active,
      ),
      streakDays: data['streakDays'] as int? ?? 0,
      bestStreakDays: data['bestStreakDays'] as int? ?? 0,
      lastCheckIn: data['lastCheckIn'] != null
          ? DateTime.tryParse(data['lastCheckIn'] as String)
          : null,
      history: Map<String, bool>.from(
        (data['history'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, v as bool)),
      ),
      createdAt: DateTime.parse(
          data['createdAt'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(
          data['updatedAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toFirestore() => {
        'name': name,
        'category': category,
        'notes': notes,
        'schedule': schedule.name,
        'customDays': customDays,
        'reminderTimeEnabled': reminderTimeEnabled,
        'reminderHour': reminderHour,
        'reminderMinute': reminderMinute,
        'reminderChannels': reminderChannels.toMap(),
        'linkedGoalId': linkedGoalId,
        'successRule': successRule,
        'status': status.name,
        'streakDays': streakDays,
        'bestStreakDays': bestStreakDays,
        'lastCheckIn': lastCheckIn?.toIso8601String(),
        'history': history,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  HabitModel copyWith({
    String? name,
    String? category,
    String? notes,
    HabitSchedule? schedule,
    List<int>? customDays,
    bool? reminderTimeEnabled,
    int? reminderHour,
    int? reminderMinute,
    ReminderChannels? reminderChannels,
    String? linkedGoalId,
    String? successRule,
    HabitStatus? status,
    int? streakDays,
    int? bestStreakDays,
    DateTime? lastCheckIn,
    Map<String, bool>? history,
  }) =>
      HabitModel(
        id: id,
        name: name ?? this.name,
        category: category ?? this.category,
        notes: notes ?? this.notes,
        schedule: schedule ?? this.schedule,
        customDays: customDays ?? this.customDays,
        reminderTimeEnabled: reminderTimeEnabled ?? this.reminderTimeEnabled,
        reminderHour: reminderHour ?? this.reminderHour,
        reminderMinute: reminderMinute ?? this.reminderMinute,
        reminderChannels: reminderChannels ?? this.reminderChannels,
        linkedGoalId: linkedGoalId ?? this.linkedGoalId,
        successRule: successRule ?? this.successRule,
        status: status ?? this.status,
        streakDays: streakDays ?? this.streakDays,
        bestStreakDays: bestStreakDays ?? this.bestStreakDays,
        lastCheckIn: lastCheckIn ?? this.lastCheckIn,
        history: history ?? this.history,
        createdAt: createdAt,
        updatedAt: DateTime.now(),
      );

  /// Has the user already checked in today?
  bool get isCheckedToday {
    if (lastCheckIn == null) return false;
    final now = DateTime.now();
    return lastCheckIn!.year == now.year &&
        lastCheckIn!.month == now.month &&
        lastCheckIn!.day == now.day;
  }

  /// yyyy-MM-dd key used in history.
  static String dateKey(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';

  String get scheduleLabel {
    switch (schedule) {
      case HabitSchedule.daily:
        return 'Daily';
      case HabitSchedule.weekdays:
        return 'Weekdays';
      case HabitSchedule.weekends:
        return 'Weekends';
      case HabitSchedule.custom:
        return 'Custom';
    }
  }

  @override
  List<Object?> get props => [
        id,
        name,
        category,
        notes,
        schedule,
        customDays,
        reminderTimeEnabled,
        reminderHour,
        reminderMinute,
        reminderChannels,
        linkedGoalId,
        successRule,
        status,
        streakDays,
        bestStreakDays,
        lastCheckIn,
        history,
        createdAt,
        updatedAt,
      ];
}
