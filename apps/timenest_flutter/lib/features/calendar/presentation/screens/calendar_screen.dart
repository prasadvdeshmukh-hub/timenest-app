import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  late DateTime _currentDate;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _currentDate = DateTime.now();
    _selectedDate = DateTime.now();
  }

  void _previousMonth() {
    setState(() {
      _currentDate = DateTime(
        _currentDate.year,
        _currentDate.month - 1,
        1,
      );
    });
  }

  void _nextMonth() {
    setState(() {
      _currentDate = DateTime(
        _currentDate.year,
        _currentDate.month + 1,
        1,
      );
    });
  }

  /// Returns the number of days in the current month.
  int _daysInMonth(DateTime date) {
    return DateTime(date.year, date.month + 1, 0).day;
  }

  /// Returns the weekday (0 = Monday, 6 = Sunday) of the first day of the month.
  int _firstDayWeekday(DateTime date) {
    return DateTime(date.year, date.month, 1).weekday - 1;
  }

  void _selectDate(int day) {
    setState(() {
      _selectedDate = DateTime(_currentDate.year, _currentDate.month, day);
    });
  }

  @override
  Widget build(BuildContext context) {
    final monthName = DateFormat('MMMM yyyy').format(_currentDate);
    final daysInMonth = _daysInMonth(_currentDate);
    final firstDayWeekday = _firstDayWeekday(_currentDate);

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
                        Text('Calendar',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'View your tasks and deadlines',
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Calendar Card ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Month navigation
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.chevron_left,
                                  color: Colors.white),
                              onPressed: _previousMonth,
                            ),
                            Text(
                              monthName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(color: Colors.white),
                            ),
                            IconButton(
                              icon: const Icon(Icons.chevron_right,
                                  color: Colors.white),
                              onPressed: _nextMonth,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),

                        // Day labels
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceEvenly,
                          children: const [
                            _DayLabel('Mon'),
                            _DayLabel('Tue'),
                            _DayLabel('Wed'),
                            _DayLabel('Thu'),
                            _DayLabel('Fri'),
                            _DayLabel('Sat'),
                            _DayLabel('Sun'),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),

                        // Calendar grid
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 7,
                            childAspectRatio: 1.2,
                          ),
                          itemCount: firstDayWeekday + daysInMonth,
                          itemBuilder: (context, index) {
                            if (index < firstDayWeekday) {
                              // Empty cell before month starts
                              return const SizedBox();
                            }

                            final day = index - firstDayWeekday + 1;
                            final dateForDay =
                                DateTime(_currentDate.year,
                                    _currentDate.month, day);
                            final isSelected =
                                _selectedDate.year ==
                                    dateForDay.year &&
                                    _selectedDate.month ==
                                        dateForDay.month &&
                                    _selectedDate.day == day;
                            final isToday =
                                DateTime.now().year ==
                                    dateForDay.year &&
                                    DateTime.now().month ==
                                        dateForDay.month &&
                                    DateTime.now().day == day;

                            return GestureDetector(
                              onTap: () => _selectDate(day),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.cyan
                                          .withOpacity(0.3)
                                      : isToday
                                          ? Colors.white
                                              .withOpacity(0.1)
                                          : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.cyan
                                        : isToday
                                            ? Colors.white30
                                            : Colors.transparent,
                                  ),
                                  borderRadius:
                                      BorderRadius.circular(4),
                                ),
                                child: Center(
                                  child: Text(
                                    '$day',
                                    style: TextStyle(
                                      color: isSelected
                                          ? AppColors.cyan
                                          : Colors.white,
                                      fontWeight:
                                          isToday || isSelected
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Tasks for Selected Day ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tasks for ${DateFormat('MMM d, yyyy').format(_selectedDate)}',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                vertical: AppSpacing.lg),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.calendar_today,
                                  color: Colors.white30,
                                  size: 40,
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Text(
                                  'No tasks for this day',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: Colors.white54,
                                      ),
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

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayLabel extends StatelessWidget {
  final String label;

  const _DayLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: Colors.white70,
        fontWeight: FontWeight.w500,
        fontSize: 12,
      ),
    );
  }
}
