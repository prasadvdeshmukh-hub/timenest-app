import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../auth/domain/auth_state.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Extract user info from authenticated state
    final userName = authState is AuthAuthenticated
        ? authState.user.displayName ?? 'User'
        : 'User';
    final userEmail = authState is AuthAuthenticated
        ? authState.user.email ?? 'user@example.com'
        : 'user@example.com';
    final firstLetter = userName.isNotEmpty ? userName[0] : 'U';

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
              // ── User Profile Header ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: AppColors.cyan,
                          child: Text(
                            firstLetter.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 32,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          userName,
                          style: Theme.of(context)
                              .textTheme
                              .headlineMedium
                              ?.copyWith(color: Colors.white),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          userEmail,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.white70),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Your Stats Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Your Stats',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics:
                            const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: AppSpacing.sm,
                        mainAxisSpacing: AppSpacing.sm,
                        childAspectRatio: 1.4,
                        children: [
                          _StatBox(
                            label: 'Total Goals',
                            value: '12',
                            accentColor: AppColors.cyan,
                          ),
                          _StatBox(
                            label: 'Completed',
                            value: '7',
                            accentColor: Colors.greenAccent,
                          ),
                          _StatBox(
                            label: 'Active Streak',
                            value: '28',
                            accentColor: AppColors.warning,
                          ),
                          _StatBox(
                            label: 'Tasks Done',
                            value: '156',
                            accentColor: AppColors.purple,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.lg)),

              // ── Account Actions Section ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Account Actions',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      GlassCard(
                        child: Column(
                          children: [
                            _ActionButton(
                              label: 'Edit Profile',
                              icon: Icons.person,
                              onPressed: () {
                                // TODO: Navigate to edit profile
                              },
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            _ActionButton(
                              label: 'Change Password',
                              icon: Icons.lock,
                              onPressed: () {
                                // TODO: Navigate to change password
                              },
                            ),
                            Container(
                              color: AppColors.darkBorder,
                              height: 0.5,
                            ),
                            _ActionButton(
                              label: 'Logout',
                              icon: Icons.logout,
                              onPressed: () async {
                                // Sign out and navigate to login
                                await ref
                                    .read(authProvider.notifier)
                                    .signOut();
                                if (context.mounted) {
                                  context.go('/login');
                                }
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

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color accentColor;

  const _StatBox({
    required this.label,
    required this.value,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius:
            BorderRadius.circular(AppSpacing.borderRadiusSm),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool isDestructive;

  const _ActionButton({
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
