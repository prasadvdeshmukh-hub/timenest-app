import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../../domain/auth_state.dart';
import '../providers/auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _obscurePassword = true;
  _LoginMode _mode = _LoginMode.email;

  // Phone verification state
  String? _verificationId;
  final _otpController = TextEditingController();
  bool _otpSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState is AuthLoading;
    final errorMessage = authState is AuthError ? authState.message : null;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.darkBg,
              Color(0xFF0F1629),
              Color(0xFF121A33),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo & Branding
                    _buildLogo(),
                    const SizedBox(height: AppSpacing.xxl),

                    // Login Card
                    GlassCard(
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Welcome Back',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(color: Colors.white),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'Sign in to continue your journey',
                              style: Theme.of(context).textTheme.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: AppSpacing.lg),

                            // Login mode selector
                            _buildModeSelector(),
                            const SizedBox(height: AppSpacing.lg),

                            // Error message
                            if (errorMessage != null) ...[
                              Container(
                                padding: const EdgeInsets.all(AppSpacing.sm),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(
                                      AppSpacing.borderRadiusSm),
                                  border: Border.all(
                                      color: AppColors.error.withOpacity(0.3)),
                                ),
                                child: Text(
                                  errorMessage,
                                  style: const TextStyle(
                                    color: AppColors.error,
                                    fontSize: 13,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.md),
                            ],

                            // Input fields based on mode
                            if (_mode == _LoginMode.email) ...[
                              _buildEmailFields(),
                            ] else ...[
                              _buildPhoneFields(),
                            ],

                            const SizedBox(height: AppSpacing.lg),

                            // Sign-in button
                            GradientButton(
                              label: _mode == _LoginMode.phone && !_otpSent
                                  ? 'Send OTP'
                                  : 'Sign In',
                              isLoading: isLoading,
                              onPressed: isLoading ? null : _handleSignIn,
                            ),

                            if (_mode == _LoginMode.email) ...[
                              const SizedBox(height: AppSpacing.md),
                              TextButton(
                                onPressed: () =>
                                    context.push('/forgot-password'),
                                child: Text(
                                  'Forgot Password?',
                                  style: TextStyle(
                                    color: AppColors.cyan.withOpacity(0.8),
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],

                            const SizedBox(height: AppSpacing.lg),
                            _buildDivider(),
                            const SizedBox(height: AppSpacing.lg),

                            // Google Sign-In
                            OutlinedButton.icon(
                              onPressed: isLoading
                                  ? null
                                  : () => ref
                                      .read(authProvider.notifier)
                                      .signInWithGoogle(),
                              icon: const Icon(Icons.g_mobiledata, size: 24),
                              label: const Text('Continue with Google'),
                            ),

                            const SizedBox(height: AppSpacing.lg),

                            // Sign up link
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "Don't have an account? ",
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                GestureDetector(
                                  onTap: () => context.push('/signup'),
                                  child: const Text(
                                    'Sign Up',
                                    style: TextStyle(
                                      color: AppColors.cyan,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
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
        ),
      ),
    );
  }

  // ── Logo ──

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppColors.cyanPurpleGradient,
            borderRadius: BorderRadius.circular(AppSpacing.borderRadiusLg),
            boxShadow: [
              BoxShadow(
                color: AppColors.cyan.withOpacity(0.3),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(
            Icons.access_time_rounded,
            color: Colors.white,
            size: 36,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        const Text(
          'TimeNest',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  // ── Mode Selector (Email / Phone) ──

  Widget _buildModeSelector() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSm),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          _modeTab('Email', _LoginMode.email),
          _modeTab('Mobile', _LoginMode.phone),
        ],
      ),
    );
  }

  Widget _modeTab(String label, _LoginMode mode) {
    final isSelected = _mode == mode;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() {
          _mode = mode;
          _otpSent = false;
          _verificationId = null;
        }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.cyan.withOpacity(0.15) : null,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? AppColors.cyan : AppColors.textMutedDark,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }

  // ── Email Fields ──

  Widget _buildEmailFields() {
    return Column(
      children: [
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email_outlined, size: 20),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Email is required';
            if (!v.contains('@')) return 'Enter a valid email';
            return null;
          },
        ),
        const SizedBox(height: AppSpacing.md),
        TextFormField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off : Icons.visibility,
                size: 20,
              ),
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Password is required';
            if (v.length < 6) return 'At least 6 characters';
            return null;
          },
        ),
      ],
    );
  }

  // ── Phone Fields ──

  Widget _buildPhoneFields() {
    return Column(
      children: [
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Phone Number',
            hintText: '+91 9876543210',
            prefixIcon: Icon(Icons.phone_outlined, size: 20),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Phone number is required';
            return null;
          },
        ),
        if (_otpSent) ...[
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: const InputDecoration(
              labelText: 'Enter OTP',
              prefixIcon: Icon(Icons.pin_outlined, size: 20),
              counterText: '',
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'OTP is required';
              if (v.length != 6) return 'Enter 6-digit OTP';
              return null;
            },
          ),
        ],
      ],
    );
  }

  // ── Divider ──

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: AppColors.darkBorder)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Text(
            'or',
            style: TextStyle(color: AppColors.textMutedDark, fontSize: 13),
          ),
        ),
        Expanded(child: Divider(color: AppColors.darkBorder)),
      ],
    );
  }

  // ── Sign-In Handler ──

  void _handleSignIn() {
    if (!_formKey.currentState!.validate()) return;
    final notifier = ref.read(authProvider.notifier);

    if (_mode == _LoginMode.email) {
      notifier.signInWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    } else if (!_otpSent) {
      // Send OTP
      notifier.startPhoneVerification(
        phoneNumber: _phoneController.text.trim(),
        onCodeSent: (verId) {
          setState(() {
            _verificationId = verId;
            _otpSent = true;
          });
        },
        onError: (_) {},
      );
    } else {
      // Verify OTP
      notifier.verifyPhoneOtp(
        verificationId: _verificationId!,
        smsCode: _otpController.text.trim(),
      );
    }
  }
}

enum _LoginMode { email, phone }
