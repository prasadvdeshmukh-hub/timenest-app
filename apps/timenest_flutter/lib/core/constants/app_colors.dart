import 'package:flutter/material.dart';

/// TimeNest color system — extracted from the approved UI prototype.
/// Dark surfaces with luminous accent layers, glassmorphism accents.
class AppColors {
  AppColors._();

  // Primary brand colors
  static const Color cyan = Color(0xFF00C8FF);
  static const Color purple = Color(0xFF6C63FF);
  static const Color orange = Color(0xFFFF6B35);

  // Dark theme surfaces
  static const Color darkBg = Color(0xFF0A0E1A);
  static const Color darkSurface = Color(0xFF111827);
  static const Color darkCard = Color(0xFF1A1F35);
  static const Color darkCardHover = Color(0xFF222842);
  static const Color darkBorder = Color(0xFF2A3050);

  // Light theme surfaces
  static const Color lightBg = Color(0xFFF0F4FF);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFF8FAFF);
  static const Color lightBorder = Color(0xFFE0E6F0);

  // Text colors
  static const Color textPrimaryDark = Color(0xFFE8ECF4);
  static const Color textSecondaryDark = Color(0xFF8B95B0);
  static const Color textMutedDark = Color(0xFF5A6480);
  static const Color textPrimaryLight = Color(0xFF1A1F35);
  static const Color textSecondaryLight = Color(0xFF5A6480);

  // Status colors
  static const Color success = Color(0xFF00E676);
  static const Color warning = Color(0xFFFFAB00);
  static const Color error = Color(0xFFFF5252);
  static const Color info = Color(0xFF00C8FF);

  // Gradient presets
  static const LinearGradient auroraGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF6C63FF),
      Color(0xFF00C8FF),
      Color(0xFF00E676),
    ],
  );

  static const LinearGradient cyanPurpleGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [cyan, purple],
  );

  static const LinearGradient cardGlassGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x1AFFFFFF),
      Color(0x0DFFFFFF),
    ],
  );
}
