# Changelog

## 2026-06-08

- Enhanced AI Chatbot visual cards to support direct service details navigation. Added `serviceId` support on the chatbot card template and RAG database context.
- Refactored `AIChatbot.tsx` with robust key-value parsing to handle card attributes dynamically, and introduced double-action buttons: "Hồ Sơ Studio" (navigates to studio profile) and "Xem Dịch Vụ" (navigates directly to the specific photoset/service page).
- Integrated a premium double-click zoom overlay modal for comparative tables in the chatbot, resolving visibility constraint issues on narrow screens.
- Migrated AI Chatbot from Gemini API to DeepSeek API using model `deepseek-chat` and API key `sk-5034f0e31c744be2a3b52320e8301359`.
- Refactored C# interfaces and implementation to reflect provider change: introduced `IChatbotService` and `DeepSeekChatbotService` while clean deleting `IGeminiChatbotService` and `GeminiChatbotService`.
- Upgraded the API client payload schema to standard OpenAI Chat Completions compatibility.

## 2026-05-27

- Refreshed the customer marketplace UI around a white/blue/orange palette (`#004aad`, `#ff751f`), including shared theme tokens, GO! navigation, and a fuller marketplace footer.
- Localized the main customer discovery flow to Vietnamese across Home, Services, Studios, Studio detail, Service detail, Customer bookings, and Customer booking detail.
- Simplified search UX by merging city into keyword search, replacing text search buttons with search icons, adding price-range filters, and adding "Xem thêm" loading on service/studio lists.
- Improved cards and detail pages for incomplete studio data, larger price display, compact homepage rule cards, service expansion, portfolio grid display, and booking/report/review visibility.
- Added customer booking report UI using the existing dispute endpoint and refreshed review handling after completion so the booking detail reloads current review eligibility.
- Implemented Wallet System (Customer Wallet and Studio Wallet) with automated credit and refund integrations.
- Resolved JSON object cycle exception (`JsonException`) by introducing flat DTO projections (`WalletDto` and `WalletTransactionDto`).
- Fully implemented Wallet Withdrawal flow (bank info inputs, quick percents 25%-100%, secure validations, debit ledger records `DEBIT_WITHDRAW` in the backend).
- Integrated a premium glassmorphic emerald gradient card in `FinanceManager.tsx` with a responsive modal to request withdrawals easily.
- Created `wallets` and `wallet_transactions` tables in the database schema.
- Added Wallet and WalletTransaction EF Core models, DB mappings, and context registrations.
- Implemented `WalletRepository` and `WalletService` data access and business logic layers.
- Integrated wallet credits automatically into `BookingWorkflowService` upon customer confirmation of booking completion (+90% Studio revenue credited to Studio wallet).
- Integrated wallet refunds automatically into `BookingWorkflowService` upon booking cancellation or rejection by Studio (+100% price credited to Customer wallet, payment status updated to REFUNDED).
- Created `WalletsController` exposing `/api/wallet/mine` for Studio, `/api/customer/wallet` for Customer, and `/api/admin/wallets` for Admin.
- Restructured frontend `FinanceManager.tsx` to showcase real-time Studio Wallet Balance and detailed transaction logs within the unified photographer dashboard.
- Integrated a premium `Ví tiền của tôi` (My Wallet) tab into `ProfilePage.tsx` for Customers to view their balance and refund transaction history.

## 2026-05-26

- Added photo delivery steps to the booking workflow: demo photo upload, customer feedback, final photo delivery, and customer confirmation after final photos.
- Added customer review creation after completed bookings, enforcing one review per completed booking.
- Added a dedicated photographer booking detail page for demo/final photo links, customer feedback, customer messaging, final delivery confirmation, and review submission while keeping the main booking schedule view unchanged.
- Added booking statuses for `DEMO_UPLOADED`, `EDITING`, and `FINAL_DELIVERED` in the SQL setup script.

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
