import 'package:equatable/equatable.dart';

/// Task priority levels.
enum TaskPriority { low, medium, high }

/// Task status.
enum TaskStatus { pending, completed, skipped }

/// Recurrence type for tasks.
enum RecurrenceType { none, daily, weekly, monthly, yearly, custom }

/// Notification channels the user can toggle per task.
class ReminderChannels extends Equatable {
  final bool push;
  final bool inApp;
  final bool email;
  final bool sms;
  final bool whatsapp;

  const ReminderChannels({
    this.push = false,
    this.inApp = true,
    this.email = false,
    this.sms = false,
    this.whatsapp = false,
  });

  factory ReminderChannels.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const ReminderChannels();
    return ReminderChannels(
      push: map['push'] as bool? ?? false,
      inApp: map['inApp'] as bool? ?? true,
      email: map['email'] as bool? ?? false,
      sms: map['sms'] as bool? ?? false,
      whatsapp: map['whatsapp'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'push': push,
        'inApp': inApp,
        'email': email,
        'sms': sms,
        'whatsapp': whatsapp,
      };

  ReminderChannels copyWith({
    bool? push,
    bool? inApp,
    bool? email,
    bool? sms,
    bool? whatsapp,
  }) =>
      ReminderChannels(
        push: push ?? this.push,
        inApp: inApp ?? this.inApp,
        email: email ?? this.email,
        sms: sms ?? this.sms,
        whatsapp: whatsapp ?? this.whatsapp,
      );

  int get activeCount =>
      [push, inApp, email, sms, whatsapp].where((c) => c).length;

  @override
  List<Object?> get props => [push, inApp, email, sms, whatsapp];
}

/// A subtask within a task.
class Subtask extends Equatable {
  final String id;
  final String name;
  final bool isCompleted;

  const Subtask({
    required this.id,
    required this.name,
    this.isCompleted = false,
  });

  factory Subtask.fromMap(Map<String, dynamic> map) => Subtask(
        id: map['id'] as String,
        name: map['name'] as String,
        isCompleted: map['isCompleted'] as bool? ?? false,
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'isCompleted': isCompleted,
      };

  Subtask copyWith({String? name, bool? isCompleted}) => Subtask(
        id: id,
        name: name ?? this.name,
        isCompleted: isCompleted ?? this.isCompleted,
      );

  @override
  List<Object?> get props => [id, name, isCompleted];
}

/// Core task entity — maps to Firestore `users/{uid}/goals/{goalId}/tasks/{taskId}`.
class TaskModel extends Equatable {
  final String id;
  final String goalId;
  final String name;
  final String? notes;
  final TaskPriority priority;
  final TaskStatus status;
  final DateTime deadlineDate;
  final bool deadlineTimeEnabled;
  final int deadlineHour;
  final int deadlineMinute;
  final int deadlineSecond;
  final List<String> tags;
  final bool isHabit;
  final RecurrenceType recurrenceType;
  final List<int> customDays; // 1=Mon..7=Sun
  final ReminderChannels reminderChannels;
  final List<Subtask> subtasks;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TaskModel({
    required this.id,
    required this.goalId,
    required this.name,
    this.notes,
    this.priority = TaskPriority.medium,
    this.status = TaskStatus.pending,
    required this.deadlineDate,
    this.deadlineTimeEnabled = false,
    this.deadlineHour = 0,
    this.deadlineMinute = 0,
    this.deadlineSecond = 0,
    this.tags = const [],
    this.isHabit = false,
    this.recurrenceType = RecurrenceType.none,
    this.customDays = const [],
    this.reminderChannels = const ReminderChannels(),
    this.subtasks = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory TaskModel.fromFirestore(String id, Map<String, dynamic> data) {
    return TaskModel(
      id: id,
      goalId: data['goalId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      notes: data['notes'] as String?,
      priority: TaskPriority.values.firstWhere(
        (e) => e.name == data['priority'],
        orElse: () => TaskPriority.medium,
      ),
      status: TaskStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => TaskStatus.pending,
      ),
      deadlineDate: DateTime.parse(data['deadlineDate'] as String),
      deadlineTimeEnabled: data['deadlineTimeEnabled'] as bool? ?? false,
      deadlineHour: data['deadlineHour'] as int? ?? 0,
      deadlineMinute: data['deadlineMinute'] as int? ?? 0,
      deadlineSecond: data['deadlineSecond'] as int? ?? 0,
      tags: List<String>.from(data['tags'] as List? ?? []),
      isHabit: data['isHabit'] as bool? ?? false,
      recurrenceType: RecurrenceType.values.firstWhere(
        (e) => e.name == data['recurrenceType'],
        orElse: () => RecurrenceType.none,
      ),
      customDays: List<int>.from(data['customDays'] as List? ?? []),
      reminderChannels: ReminderChannels.fromMap(
        data['reminderChannels'] as Map<String, dynamic>?,
      ),
      subtasks: (data['subtasks'] as List? ?? [])
          .map((s) => Subtask.fromMap(s as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(data['createdAt'] as String),
      updatedAt: DateTime.parse(data['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toFirestore() => {
        'goalId': goalId,
        'name': name,
        'notes': notes,
        'priority': priority.name,
        'status': status.name,
        'deadlineDate': deadlineDate.toIso8601String(),
        'deadlineTimeEnabled': deadlineTimeEnabled,
        'deadlineHour': deadlineHour,
        'deadlineMinute': deadlineMinute,
        'deadlineSecond': deadlineSecond,
        'tags': tags,
        'isHabit': isHabit,
        'recurrenceType': recurrenceType.name,
        'customDays': customDays,
        'reminderChannels': reminderChannels.toMap(),
        'subtasks': subtasks.map((s) => s.toMap()).toList(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  TaskModel copyWith({
    String? goalId,
    String? name,
    String? notes,
    TaskPriority? priority,
    TaskStatus? status,
    DateTime? deadlineDate,
    bool? deadlineTimeEnabled,
    int? deadlineHour,
    int? deadlineMinute,
    int? deadlineSecond,
    List<String>? tags,
    bool? isHabit,
    RecurrenceType? recurrenceType,
    List<int>? customDays,
    ReminderChannels? reminderChannels,
    List<Subtask>? subtasks,
  }) =>
      TaskModel(
        id: id,
        goalId: goalId ?? this.goalId,
        name: name ?? this.name,
        notes: notes ?? this.notes,
        priority: priority ?? this.priority,
        status: status ?? this.status,
        deadlineDate: deadlineDate ?? this.deadlineDate,
        deadlineTimeEnabled: deadlineTimeEnabled ?? this.deadlineTimeEnabled,
        deadlineHour: deadlineHour ?? this.deadlineHour,
        deadlineMinute: deadlineMinute ?? this.deadlineMinute,
        deadlineSecond: deadlineSecond ?? this.deadlineSecond,
        tags: tags ?? this.tags,
        isHabit: isHabit ?? this.isHabit,
        recurrenceType: recurrenceType ?? this.recurrenceType,
        customDays: customDays ?? this.customDays,
        reminderChannels: reminderChannels ?? this.reminderChannels,
        subtasks: subtasks ?? this.subtasks,
        createdAt: createdAt,
        updatedAt: DateTime.now(),
      );

  /// Human-readable priority label.
  String get priorityLabel {
    switch (priority) {
      case TaskPriority.low:
        return 'Low';
      case TaskPriority.medium:
        return 'Medium';
      case TaskPriority.high:
        return 'High';
    }
  }

  /// Formatted deadline time string.
  String get deadlineTimeString {
    if (!deadlineTimeEnabled) return '';
    final h = deadlineHour.toString().padLeft(2, '0');
    final m = deadlineMinute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  /// Recurrence label for display.
  String get recurrenceLabel {
    switch (recurrenceType) {
      case RecurrenceType.none:
        return 'None';
      case RecurrenceType.daily:
        return 'Daily';
      case RecurrenceType.weekly:
        return 'Weekly';
      case RecurrenceType.monthly:
        return 'Monthly';
      case RecurrenceType.yearly:
        return 'Yearly';
      case RecurrenceType.custom:
        return 'Custom Days';
    }
  }

  @override
  List<Object?> get props => [
        id, goalId, name, notes, priority, status, deadlineDate,
        deadlineTimeEnabled, deadlineHour, deadlineMinute, deadlineSecond,
        tags, isHabit, recurrenceType, customDays, reminderChannels,
        subtasks, createdAt, updatedAt,
      ];
}
