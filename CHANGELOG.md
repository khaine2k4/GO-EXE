# Changelog

## 2026-05-24

- Refactored Photographer studio management into `/photographer/dashboard` with tab-based detail views.
- Added dashboard overview cards and quick management sections for services, packages, portfolio, bookings, revenue, and reviews.
- Added drawer-based create/edit/detail flows for studio management tasks.
- Redirected legacy Photographer management routes to dashboard tabs to keep old links working.
- Reduced duplicate Photographer navigation and restored explicit Customer booking navigation for backend `CUSTOMER` role sessions.
- Added local CORS support for `http://127.0.0.1:5173`.
- Added Schedule as a Studio Dashboard tab, redirected the old schedule route, and added manual slot creation.
- Improved booking time selection visibility and defaulted MVP booking payment to simulated bank transfer.
- Changed booking completion flow so Studio completion moves to customer confirmation first; `READY` settlement is created only after the customer confirms completion.
- Clarified the Admin payout confirmation screen by renaming Settlements to Payout approvals and making the READY-to-PAID action explicit.
- Replaced the browser-native payout confirmation alert with an in-app admin confirmation modal.
