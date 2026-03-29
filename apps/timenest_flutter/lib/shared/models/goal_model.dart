import 'package:equatable/equatable.dart';

/// Goal types: short-term (30-90 days) or long-term.
enum GoalType { shortTerm, longTerm }

/// Goal status lifecycle.
enum GoalStatus { inProgress, completed, delayed }

/// Core goal entity — maps to Firestore `users/{uid}/goals/{goalId}`.
class GoalModel extends Equatable {
  final String id;
  final String name;
  final String? description;
  final GoalType type;
  final GoalStatus status;
  final DateTime startDate;
  final DateTime targetDate;
  final double progressPercent;
  final bool isDefaultSample;
  final DateTime? completedAt;
  final bool completedOnTime;
  final DateTime createdAt;
  final DateTime updatedAt;

  const GoalModel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    this.status = GoalStatus.inProgress,
    required this.startDate,
    required this.targetDate,
    this.progressPercent = 0,
    this.isDefaultSample = false,
    this.completedAt,
    this.completedOnTime = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory GoalModel.fromFirestore(String id, Map<String, dynamic> data) {
    return GoalModel(
      id: id,
      name: data['name'] as String? ?? '',
      description: data['description'] as String?,
      type: GoalType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => GoalType.shortTerm,
      ),
      status: GoalStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => GoalStatus.inProgress,
      ),
      startDate: DateTime.parse(data['startDate'] as String),
      targetDate: DateTime.parse(data['targetDate'] as String),
      progressPercent: (data['progressPercent'] as num?)?.toDouble() ?? 0,
      isDefaultSample: data['isDefaultSample'] as bool? ?? false,
      completedAt: data['completedAt'] != null
          ? DateTime.parse(data['completedAt'] as String)
          : null,
      completedOnTime: data['completedOnTime'] as bool? ?? false,
      createdAt: DateTime.parse(data['createdAt'] as String),
      updatedAt: DateTime.parse(data['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toFirestore() => {
        'name': name,
        'description': description,
        'type': type.name,
        'status': status.name,
        'startDate': startDate.toIso8601String(),
        'targetDate': targetDate.toIso8601String(),
        'progressPercent': progressPercent,
        'isDefaultSample': isDefaultSample,
        'completedAt': completedAt?.toIso8601String(),
        'completedOnTime': completedOnTime,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  GoalModel copyWith({
    String? name,
    String? description,
    GoalType? type,
    GoalStatus? status,
    DateTime? startDate,
    DateTime? targetDate,
    double? progressPercent,
    bool? isDefaultSample,
    DateTime? completedAt,
    bool? completedOnTime,
  }) =>
      GoalModel(
        id: id,
        name: name ?? this.name,
        description: description ?? this.description,
        type: type ?? this.type,
        status: status ?? this.status,
        startDate: startDate ?? this.startDate,
        targetDate: targetDate ?? this.targetDate,
        progressPercent: progressPercent ?? this.progressPercent,
        isDefaultSample: isDefaultSample ?? this.isDefaultSample,
        completedAt: completedAt ?? this.completedAt,
        completedOnTime: completedOnTime ?? this.completedOnTime,
        createdAt: createdAt,
        updatedAt: DateTime.now(),
      );

  /// Label used in the UI for the status pill.
  String get statusLabel {
    switch (status) {
      case GoalStatus.inProgress:
        return 'In Progress';
      case GoalStatus.completed:
        return 'Completed';
      case GoalStatus.delayed:
        return 'Delayed';
    }
  }

  @override
  List<Object?> get props => [
        id, name, description, type, status, startDate, targetDate,
        progressPercent, isDefaultSample, completedAt, completedOnTime,
        createdAt, updatedAt,
      ];
}
