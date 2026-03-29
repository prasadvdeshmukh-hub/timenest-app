import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

/// Bottom navigation shell wrapping the main app tabs.
/// Matches the prototype's bottom-tabbar layout.
class ShellScreen extends StatelessWidget {
  final Widget child;

  const ShellScreen({super.key, required this.child});

  static const _tabs = [
    _Tab(label: 'Dashboard', icon: Icons.dashboard_rounded, path: '/'),
    _Tab(label: 'Short-Term', icon: Icons.flag_rounded, path: '/short-term-goals'),
    _Tab(label: 'Long-Term', icon: Icons.emoji_events_rounded, path: '/long-term-goals'),
    _Tab(label: 'Tasks', icon: Icons.task_alt_rounded, path: '/daily-tasks'),
    _Tab(label: 'Habits', icon: Icons.loop_rounded, path: '/habits'),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _tabs.indexWhere((t) => t.path == location);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.darkSurface,
          border: const Border(
            top: BorderSide(color: AppColors.darkBorder, width: 1),
          ),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final isActive = i == (currentIndex >= 0 ? currentIndex : 0);
                return Expanded(
                  child: InkWell(
                    onTap: () => context.go(tab.path),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          tab.icon,
                          size: 22,
                          color: isActive
                              ? AppColors.cyan
                              : AppColors.textMutedDark,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight:
                                isActive ? FontWeight.w600 : FontWeight.w400,
                            color: isActive
                                ? AppColors.cyan
                                : AppColors.textMutedDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _Tab {
  final String label;
  final IconData icon;
  final String path;

  const _Tab({
    required this.label,
    required this.icon,
    required this.path,
  });
}
