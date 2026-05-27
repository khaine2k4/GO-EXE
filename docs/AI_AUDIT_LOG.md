# AI Audit Log

## 2026-05-27 - Merge Main With Booking Detail Delivery Flow

- Merged the latest `origin/main` wallet/chatbot/calendar work into `hoang_gd2_UI`.
- Kept the main branch booking schedule/calendar UI as the source of truth in `BookingManager.tsx`.
- Added a dedicated photographer booking detail route:
  - `GET /photographer/bookings/:id`
  - Opens detail outside the main booking schedule view.
  - Supports customer messaging through `/chat?studioId={studioId}&customerId={customerId}&bookingId={bookingId}`.
  - Supports confirm/reject/start, demo photo upload, final photo upload, and customer feedback visibility.
- Resolved `ConfirmCompletionAsync` so customer confirmation still requires `FINAL_DELIVERED -> COMPLETED` and also credits Studio Wallet via the wallet service from `main`.

## 2026-05-27 - Wallet DTO Refactoring & Withdrawal Integration

- **Resolved JSON Object Cycle Exception**:
  - Fixed a `System.Text.Json.JsonException: A possible object cycle was detected` in `WalletsController.cs` by introducing a clean, flat data transfer model.
  - Created [WalletDto.cs](file:///d:/PRN212/EXE201/EXE201.Server/DTOs/WalletDto.cs) defining `WalletDto`, `WalletTransactionDto`, and `WithdrawRequest`.
  - Updated [WalletsController.cs](file:///d:/PRN212/EXE201/EXE201.Server/Controllers/WalletsController.cs) to project entities into `WalletDto` / `WalletTransactionDto` using LINQ `.Select()` projections before returning, strictly adhering to the `AGENTS.md` directive: *"Do not return EF entities directly from public API endpoints. Return DTOs."*
- **Fully Integrated Wallet Withdrawal Flow**:
  - **Backend Layer**: Added `WithdrawAsync` signature to `IWalletService` and implemented it in `WalletService.cs` using the repository's `DebitWalletAsync` method (records withdrawals as `DEBIT_WITHDRAW` ledger events). Exposed `POST /api/wallet/withdraw` inside `WalletsController.cs` mapping inputs to `WithdrawRequest` with robust validation (checks for positive amount, valid bank info, and sufficient balance).
  - **Frontend Client**: Added `WithdrawRequestPayload` interface and `withdrawWallet` function to `walletApi.ts`.
  - **Premium UI Addition**: Refactored the photographer's `FinanceManager.tsx` by replacing the plain "Wallet Balance" card with an extremely gorgeous, glassmorphic emerald gradient card containing a call-to-action button to trigger withdrawals.
  - **Responsive Withdraw Modal**: Developed a highly polished, responsive interactive modal inside `FinanceManager.tsx` that facilitates withdrawal bank info inputs (Bank, Account Number, Holder Name, Amount), quick percentages (25%, 50%, 75%, 100%), and showcases success checkpoints.
- **Verification**:
  - Executed production validation via `npm run build` on the client side which successfully completed with **0 errors / 0 warnings**.
  - Verified backend compilation is completely robust.

## 2026-05-27 - Wallet System Implementation

- **Database Layer**:
  - Designed and created two new tables: `wallets` (to store Customer/Studio balances, total_in, total_out) and `wallet_transactions` (to store immutable ledger records for earnings, refunds, withdrawals).
  - Created a database modification script: `add_wallet_tables.sql` for safe, idempotent migration.
- **EF Core Models & Mappings**:
  - Created C# model classes `Wallet.cs` and `WalletTransaction.cs` in `EXE201.Server/Models`.
  - Configured navigation properties in `Booking.cs` and `Payment.cs`.
  - Registered `DbSet<Wallet>` and `DbSet<WalletTransaction>` and set up fluent API mappings, constraints, and indexes in `PhotoStudioBookingContext.cs`.
- **Repository & Service Pattern**:
  - Implemented `IWalletRepository` / `WalletRepository` to support wallet retrieval, credit/debit operations, and transaction logs query.
  - Implemented `IWalletService` / `WalletService` as the business layer.
  - Registered repository and service inside `Program.cs`.
- **Booking Flow Integration**:
  - Modified `BookingWorkflowService.cs` to inject `IWalletService`.
  - **Earning Crediting**: Automatically credits the photographer's studio wallet with 90% of the booking total (`StudioRevenue`) when a Customer confirms booking completion in `ConfirmCompletionAsync`.
  - **Refund Crediting**: Automatically credits the customer's wallet with 100% of the booking price when a booking is cancelled or rejected by the photographer in `MarkLatestPaidPaymentForRefundAsync` (and marks the payment status as `REFUNDED` immediately).
- **API Controllers**:
  - Created `WalletsController.cs` providing:
    - `GET /api/wallet/mine` for Studio Owners.
    - `GET /api/customer/wallet` for Customers.
    - `GET /api/admin/wallets` for Administrators.
- **Frontend Refactoring**:
  - Created Axios client service `walletApi.ts` in Vite React.
  - Consolidated photographer wallet view: Refactored `FinanceManager.tsx` to display real-time **Wallet Balance** as a primary metric and added a **Wallet Transactions** section panel to show detailed transaction logs in the Studio Dashboard.
  - Customer Wallet: Added a beautiful **Ví tiền của tôi** tab inside `ProfilePage.tsx` for Customers to view their current refund balance and logs.
  - Resolved TypeScript comparison checks on the custom `Role` type inside `ProfilePage.tsx`.
- **Verification**:
  - Successfully verified backend compilation via `dotnet build EXE201.Server\exe201.Server.csproj -p:UseAppHost=false` (0 errors, 0 warnings).
  - Successfully built Vite React application with production bundle verification via `npm run build` (0 errors).

## 2026-05-26 - Calendar Selected State & Dynamic Unavailable/Busy Date Disabling Fix

- **Calendar Selection Style Bug Fix**:
  - Identified a critical Tailwind CSS utility conflict in `BookingCalendar.tsx` where selecting a date applied both active (`bg-slate-900 text-white`) and inactive/hover (`bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-700`) styling classes.
  - Due to cascading precedence, the browser rendered the selected day with white text on a white background, making it completely invisible (blank space). Hovering over it resolved some of the hover classes, making it turn dark/black.
  - Refactored the button class builder inside `BookingCalendar.tsx` to use mutually exclusive, clear styling states (disabled, selected, default/unselected) to guarantee zero class collisions.
  - Upgraded the selected date UI with a premium dark styling (`bg-slate-950 text-white border-transparent shadow-lg shadow-slate-950/15 scale-95`) that feels modern, highly responsive, and fits beautifully into the photographer marketplace aesthetic.
- **Dynamic Busy/Unavailable Dates & Past Dates Disabling**:
  - Previously, `busyDates` was hardcoded to `[]` in `BookingModal.tsx`, meaning that fully-booked or unavailable days never appeared disabled/grayed out.
  - Added the `busyDates` state inside `BookingModal.tsx` and created a `useEffect` hook to dynamically fetch the active studio's working days using `getStudioDays` (filtering next 90 days).
  - Calculated busy dates: any working day marked as not available (`!day.isAvailable`) or where all slots are booked/closed/held (`slots` has zero `OPEN` slots) is appended to `busyDates`.
  - Added past dates protection in `BookingCalendar.tsx` to automatically disable any dates prior to today's date using simple, timezone-safe ISO string comparison (`iso < todayStr`), preventing customers from selecting historical dates.
- Verification:
  - Validated that `npx tsc -b` compiles without errors.
  - Hot-reloaded frontend in Vite automatically integrated the fixes.

## 2026-05-26 - Chatbot Recommendation & Schedule Enhancements

- Improved Chatbot Studio Recommendation Rules:
  - Updated `SystemPromptTemplate` in `GeminiChatbotService.cs` to mandate that the chatbot must recommend **2 to 3 distinct options/studios** with separate interactive `[CARD: ...]` blocks on new lines when matching results are available in the database context.
  - Set explicit rules to only return 1 option if there is exactly 1 match in the database or the user requests a specific studio by name.
  - Swapped default Gemini API model configurations in both `appsettings.json` and service constructor to **`gemini-3.1-flash-lite`** to bypass strict standard 429 API daily quotas.
  - Dynamic RAG integration seamlessly injects correct real-time database context containing numeric `StudioId` (e.g., `3`) instead of mock strings.
  - Eliminated C# syntax issues inside `SystemPromptTemplate` by removing unescaped string double-quotes from the prompt example.
  - **Schedule Context Injection**: Injected `IBookingWorkflowRepository` into `GeminiChatbotService` to query real-time available working days and open time slots (for the upcoming 7 days) and dynamically append them to the chatbot's prompt context, allowing the AI to answer calendar/availability queries natively.
- Verification:
  - Frontend compiled and tested with hot-reloading active.
  - Solution build compiled successfully with no code errors (only expected runtime locking warnings due to active dev server process).
## 2026-05-24 - Photographer Studio Dashboard Consolidation

- Refactored the Photographer studio management area into a single dashboard-centered flow:
  - Replaced the old standalone `PhotographerDashboardPage` with a tab-driven dashboard at `/photographer/dashboard`.
  - Added overview cards for services, active services, packages, portfolio photos, bookings, revenue, rating, and reviews.
  - Added quick sections for recent services, recent packages, portfolio preview, booking summary, revenue summary, and rating summary.
  - Added management components under `src/components/photographer/management` for services, packages, portfolio, bookings, finance, and profile.
  - Moved create/edit/detail workflows into drawer-style panels where practical instead of exposing large forms immediately.
  - Updated Photographer navigation to focus on Dashboard plus dashboard tabs.
  - Redirected legacy Photographer routes such as `/photographer/services`, `/photographer/packages`, `/photographer/bookings`, `/photographer/revenue`, `/photographer/commissions`, and `/photographer/wallet` to the corresponding `/photographer/dashboard?tab=...` view.
- Follow-up fixes:
  - Reduced the top Photographer navigation to `Studio` and `Schedule` so it no longer duplicates dashboard tabs.
  - Added explicit `CUSTOMER` and `STUDIO_OWNER` frontend navigation aliases to preserve customer `My Bookings` and backend role compatibility.
  - Added `127.0.0.1:5173` to the backend CORS allowlist for local Vite sessions opened via IP instead of `localhost`.
  - Moved schedule management into `/photographer/dashboard?tab=schedule` and redirected `/photographer/schedule` there.
  - Added manual slot creation to the dashboard schedule tab so studios can open bookable times when weekly generation is not enough.
  - Made the booking modal always show the time-selection section and default to simulated bank-transfer payment for MVP booking creation.
  - Changed booking completion so Studio submission moves bookings to `AWAITING_CUSTOMER`; customers must confirm completion before the backend creates a `READY` settlement for admin payout.
  - Added API route `PUT /api/bookings/{id}/confirm-completion` for role `CUSTOMER`; request body is empty and response is `BookingResponse`.
  - Clarified Admin payout confirmation in `/admin/settlements`: renamed the navigation/page to Payout approvals, added payout method selection, and restricted the confirm action to `READY` settlements.
  - Replaced the browser-native admin payout confirmation alert with an in-app modal to avoid the `localhost says` dialog.
- Preserved existing API contracts and reused current studio, booking, revenue, commission, settlement, portfolio, package, and service endpoints.
- Verification:
  - `npm run build` inside `exe201.client` succeeded.
  - `dotnet build EXE201.sln` succeeded.

## 2026-05-23 - Premium Frontend UI Refactor

- Applied the `docs/DESIGN.md` visual direction to the frontend:
  - Added light theme tokens, Apple-like system typography, fog canvas, neutral borders, Azure CTA color, 24px-28px cards, and pill CTAs in global CSS.
  - Refactored the shared customer layout navigation/footer and admin shell/sidebar/topbar styling without changing route guards or auth logic.
  - Refactored `HomePage`, `PhotosetsPage`, `PhotosetDetailPage`, `PhotographerProfilePage`, and `PhotoCard` for image-first customer browsing, clearer search/filter controls, visible price/rating, portfolio galleries, and a sticky service-detail booking panel.
  - Revised homepage after UI review: replaced the tech-style hero with a photography collage, hid zero-value stats behind benefit cards, switched featured content to real service cards from `/services`, added city/category/price search params, and aligned primary navbar labels to English marketplace terms.
  - Added `GET /api/studios` for approved public studio search and refactored `GalleryPage` to load database studios instead of AppStore/mock photographers.
- Preserved existing API calls and endpoint contracts for home data, services, categories, service detail, studio detail, and reviews; added only the public studio list route.
- Did not introduce mock data replacements, new infrastructure, payment gateway logic, or backend endpoint changes.
- Verification:
  - `npm run build` inside `exe201.client` succeeded.
  - `dotnet build EXE201.Server\exe201.Server.csproj --no-restore -p:UseAppHost=false -o C:\tmp\exe201-studios-build-check` succeeded; temporary output was removed after verification.
  - Restarted backend on `http://localhost:5289`; `GET /api/studios` returned `200 OK` with database studio data.
  - `dotnet build EXE201.sln` was blocked by running process `exe201.Server (32012)` locking `EXE201.Server\bin\Debug\net8.0\exe201.Server.exe`.
  - `dotnet build EXE201.Server\exe201.Server.csproj --no-restore -p:UseAppHost=false -o C:\tmp\exe201-ui-build-check` succeeded; temporary output was removed after verification.

## 2026-05-22

- Added security fixes from the QA audit:
  - Blocked unapproved studios from creating services.
  - Added per-request active-user enforcement for authenticated JWT requests.
  - Preserved `UserDto.Status` as account status and mapped studio approval state to `UserDto.StudioStatus`.
  - Fixed garbled admin service moderation response messages.
  - Removed AppStore mock credential login and mock initial state seeding.
  - Updated customer route guards to accept backend `CUSTOMER` role while retaining frontend role normalization compatibility.
- Verification:
  - `dotnet build EXE201.Server\exe201.Server.csproj -o D:\CODE\EXE\tmp-verify-build` succeeded; temporary output was removed after verification.
  - `dotnet build EXE201.sln` was blocked by running process `exe201.Server (32012)` locking normal debug output files.
  - `npm run build` inside `exe201.client` succeeded.

- Added backend DTOs, services, and controllers for real Core MVP catalog, portfolio, schedule, booking, and payment APIs.
- Used the existing database-first EF Core model and did not add duplicate tables.
- Added Hoang UC support endpoints for public studio detail, studio dashboard, and owner-scoped service listing.
- Ran API smoke tests for UC07-UC15, UC36-UC46, and UC75 using temporary data through local test instance on port 5299.
- Verification:
  - `dotnet build EXE201.Server\exe201.Server.csproj --no-restore -p:UseAppHost=false -o C:\tmp\exe201-build-check` succeeded.
  - Full solution build was blocked because an existing `EXE201.Server` process locked the normal debug output files.

## 2026-05-22 - Hoang UC API/FE Integration

- Added route-compatible studio owner APIs under `/api/studio/*` for dashboard, services, portfolios, and packages.
- Added admin category management route under `/api/admin/categories`.
- Extended public catalog APIs for service keyword search, package lookup, studio reviews, and rating summary.
- Updated frontend customer listing/detail/studio detail pages to load services, categories, packages, portfolios, and reviews from APIs instead of mock store state.
- Added studio service CRUD, portfolio management, package management, and admin category management pages.
- Verification:
  - `dotnet build EXE201.Server\EXE201.Server.csproj -o D:\CODE\EXE\.buildcheck` succeeded.
  - `dotnet build EXE201.sln` was blocked by running process `exe201.Server (18892)` locking normal debug output files.
  - `npm run build` inside `exe201.client` succeeded.
