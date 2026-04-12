import 'dart:ui';
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';

/// Glassmorphism card matching the TimeNest prototype visual system.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final double blur;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius = AppSpacing.borderRadius,
    this.blur = 12,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            gradient: isDark
                ? AppColors.cardGlassGradient
                : const LinearGradient(
                    colors: [
                      Color(0xCCFFFFFF),
                      Color(0x99FFFFFF),
                    ],
                  ),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: isDark
                  ? AppColors.darkBorder
                  : AppColors.lightBorder,
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
