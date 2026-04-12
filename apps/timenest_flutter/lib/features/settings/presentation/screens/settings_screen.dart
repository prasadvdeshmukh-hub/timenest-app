import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _darkModeEnabled = true;
  bool _quietHoursEnabled = false;
  bool _masterNotificationsEnabled = true;
  Color _selectedThemeColor = AppColors.cyan;

  final List<Color> _themeColors = [
    AppColors.cyan,
    AppColors.purple,
    Colors.greenAccent,
    AppColors.warning,
    AppColors.error,
  ];

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
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
                        Text('Settings',
                            style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Customize your TimeNest experience',
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

              // ── Appearance Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(title: 'Appearance'),
                      const SizedBox(height: AppSpacing.md),
                      GlassCard(
                        child: Column(
                          children: [
                            SwitchListTile(
                              title: const Text(
                                'Dark Mode',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              value: _darkModeEnabled,
                              onChanged: (value) {
                                setState(() {
                                  _darkModeEnabled = value;
                                });
                              },
                              activeColor: AppColors.cyan,
                              inactiveThumbColor:
                                  Colors.white30,
                              inactiveTrackColor:
                                  Colors.white10,
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            Padding(
                              padding: const EdgeInsets.all(
                                  AppSpacing.md),
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Theme Color',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelLarge
                                        ?.copyWith(
                                            color: Colors
                                                .white),
                                  ),
                                  const SizedBox(
                                      height: AppSpacing.md),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment
                                            .spaceEvenly,
                                    children: List.generate(
                                      _themeColors.length,
                                      (index) {
                                        final color =
                                            _themeColors[
                                                index];
                                        final isSelected =
                                            _selectedThemeColor
                                                    .value ==
                                                color.value;

                                        return GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              _selectedThemeColor =
                                                  color;
                                            });
                                          },
                                          child: Container(
                                            width: 44,
                                            height: 44,
                                            decoration:
                                                BoxDecoration(
                                              color: color,
                                              shape: BoxShape
                                                  .circle,
                                              border:
                                                  Border.all(
                                                color: isSelected
                                                    ? Colors
                                                        .white
                                                    : Colors
                                                        .transparent,
                                                width: 2,
                                              ),
                                            ),
                                            child:
                                                isSelected
                                                    ? const Center(
                                                        child:
                                                            Icon(
                                                          Icons
                                                              .check,
                                                          color:
                                                              Colors
                                                                  .black,
                                                          size:
                                                              20,
                                                        ),
                                                      )
                                                    : null,
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Notifications Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(title: 'Notifications'),
                      const SizedBox(height: AppSpacing.md),
                      GlassCard(
                        child: Column(
                          children: [
                            SwitchListTile(
                              title: const Text(
                                'All Notifications',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              value:
                                  _masterNotificationsEnabled,
                              onChanged: (value) {
                                setState(() {
                                  _masterNotificationsEnabled =
                                      value;
                                });
                              },
                              activeColor: AppColors.cyan,
                              inactiveThumbColor:
                                  Colors.white30,
                              inactiveTrackColor:
                                  Colors.white10,
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            SwitchListTile(
                              title: const Text(
                                'Quiet Hours',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              value: _quietHoursEnabled,
                              onChanged: (value) {
                                setState(() {
                                  _quietHoursEnabled = value;
                                });
                              },
                              activeColor: AppColors.cyan,
                              inactiveThumbColor:
                                  Colors.white30,
                              inactiveTrackColor:
                                  Colors.white10,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Data Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(title: 'Data'),
                      const SizedBox(height: AppSpacing.md),
                      GlassCard(
                        child: Column(
                          children: [
                            _SettingButton(
                              label: 'Export Data',
                              icon: Icons.download,
                              onPressed: () {
                                // TODO: Handle export
                              },
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            _SettingButton(
                              label: 'Clear Cache',
                              icon: Icons.cleaning_services,
                              onPressed: () {
                                // TODO: Handle clear cache
                              },
                              isDestructive: true,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── About Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionTitle(title: 'About'),
                      const SizedBox(height: AppSpacing.md),
                      GlassCard(
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(
                                  AppSpacing.md),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment
                                        .spaceBetween,
                                children: [
                                  Text(
                                    'App Version',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelLarge
                                        ?.copyWith(
                                            color: Colors
                                                .white),
                                  ),
                                  Text(
                                    '1.0.0',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                            color: Colors
                                                .white70),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            _LinkButton(
                              label: 'Privacy Policy',
                              icon: Icons.privacy_tip,
                              onPressed: () {
                                _launchUrl(
                                    'https://example.com/privacy');
                              },
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            _LinkButton(
                              label: 'Terms of Service',
                              icon: Icons.description,
                              onPressed: () {
                                _launchUrl(
                                    'https://example.com/terms');
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
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

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context)
          .textTheme
          .titleLarge
          ?.copyWith(color: Colors.white),
    );
  }
}

class _SettingButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool isDestructive;

  const _SettingButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDestructive ? AppColors.error : Colors.white70,
              size: 20,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isDestructive
                      ? AppColors.error
                      : Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.white30,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class _LinkButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const _LinkButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: AppColors.cyan,
              size: 20,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: AppColors.cyan,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(
              Icons.open_in_new,
              color: AppColors.cyan,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
