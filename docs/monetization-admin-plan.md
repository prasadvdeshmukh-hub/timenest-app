# TimeNest Monetization and Admin Plan

## What Was Added

- `admin.html` acts as a prototype admin panel
- pricing, offer copy, and premium feature flags are stored in browser `localStorage`
- dashboard, settings, profile, and notifications now reflect the same monetization configuration

## Why This Helps

- you can keep the app free for the first growth phase
- later you can switch premium plans live without redesigning the product
- you can test which features should stay free versus premium

## Prototype Limits

- changes are saved only in the current browser
- this is not secure enough for a real production admin panel
- store billing is not connected yet

## Recommended Production Setup

### Mobile app

- Flutter app
- local-first storage with Isar or Drift
- Firebase Auth for sign-in
- Firestore for account backup and remote configuration

### Monetization

- Google Play Billing on Android
- StoreKit on iOS
- RevenueCat if you want simpler cross-platform subscription management

### Real admin panel

- admin users stored with explicit roles
- Firestore collection like `app_config/global`
- fields for:
  - `launchMode`
  - `freeAccessMonths`
  - `trialDays`
  - `monthlyPrice`
  - `yearlyPrice`
  - `currency`
  - `offerHeadline`
  - `offerMessage`
  - `premiumFeatures`
- mobile app listens to that config and updates paywall, feature locks, and banners

## Best Launch Strategy

1. Launch with free plan first
2. collect daily active usage and 30-day retention
3. turn on premium only after users clearly value backup, analytics, exports, and advanced reminder channels
4. keep core tasks and habits free
5. charge for power features instead of blocking the whole app

## Suggested Premium Features

- cloud backup across devices
- advanced analytics and productivity scorecards
- PDF and Excel exports
- WhatsApp escalation reminders
- future team and shared workspace features
