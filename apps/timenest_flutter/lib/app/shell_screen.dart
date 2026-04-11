import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

/// Bottom navigation shell wrapping the main app tabs.
/// Matches the prototype's bottom-tabbar layout with overflow menu.
class ShellScreen extends StatelessWidget {
  final Widget child;

  const ShellScreen({super.key, required this.child});

  // Primary tabs shown in bottom nav (max 5 for usability)
  static const _primaryTabs = [
    _Tab(label: 'Dashboard', icon: Icons.dashboard_rounded, path: '/'),
    _Tab(label: 'Goals', icon: Icons.flag_rounded, path: '/short-term-goals'),
    _Tab(label: 'Tasks', icon: Icons.task_alt_rounded, path: '/daily-tasks'),
    _Tab(label: 'Habits', icon: Icons.loop_rounded, path: '/habits'),
    _Tab(label: 'More', icon: Icons.menu_rounded, path: '_more'),
  ];

  // Secondary tabs in the "More" menu
  static const _moreTabs = [
    _Tab(label: 'Long-Term Goals', icon: Icons.emoji_events_rounded, path: '/long-term-goals'),
    _Tab(label: 'Calendar', icon: Icons.calendar_month_rounded, path: '/calendar'),
    _Tab(label: 'Notifications', icon: Icons.notifications_rounded, path: '/notifications'),
    _Tab(label: 'Profile', icon: Icons.person_rounded, path: '/profile'),
    _Tab(label: 'Settings', icon: Icons.settings_rounded, path: '/settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _primaryTabs.indexWhere((t) => t.path == location);
    // Check if current location is in "more" section
    final isMoreActive = _moreTabs.any((t) => t.path == location);
    final activeIndex = currentIndex >= 0 ? currentIndex : (isMoreActive ? 4 : 0);

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
              children: List.generate(_primaryTabs.length, (i) {
                final tab = _primaryTabs[i];
                final isActive = i == activeIndex;
                return Expanded(
                  child: InkWell(
                    onTap: () {
                      if (tab.path == '_more') {
                        _showMoreMenu(context);
                      } else {
                        context.go(tab.path);
                      }
                    },
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

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: _moreTabs.map((tab) {
              final location = GoRouterState.of(context).matchedLocation;
              final isActive = tab.path == location;
              return ListTile(
                leading: Icon(tab.icon,
                    color: isActive ? AppColors.cyan : AppColors.textMutedDark),
                title: Text(tab.label,
                    style: TextStyle(
                      color: isActive ? AppColors.cyan : Colors.white,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                    )),
                onTap: () {
                  Navigator.pop(ctx);
                  context.go(tab.path);
                },
              );
            }).toList(),
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
