# AI Audit Log

## 2026-05-26 - Booking Photo Delivery And Customer Review

- Extended the booking workflow to support the MVP photographer delivery flow:
  - Studio can move `CONFIRMED -> IN_PROGRESS`.
  - Studio can upload demo photo links and move `IN_PROGRESS -> DEMO_UPLOADED`.
  - Customer can submit demo feedback and move `DEMO_UPLOADED -> EDITING`.
  - Studio can upload final photo links and move `DEMO_UPLOADED/EDITING -> FINAL_DELIVERED`.
  - Customer confirms final receipt and moves `FINAL_DELIVERED -> COMPLETED`.
- Added customer review creation:
  - `POST /api/bookings/{id}/review`
  - Role: `CUSTOMER`
  - Request: `{ rating: number, comment?: string }`
  - Response: `BookingReviewResponse`
  - Business rule: only the booking customer can review, the booking must be `COMPLETED`, and each booking can only have one review.
- Added booking photo delivery endpoints:
  - `PUT /api/bookings/{id}/demo-photos`
  - Role: `STUDIO_OWNER`
  - Request: `{ photoUrls: string[], note?: string }`
  - Response: `BookingResponse`
  - `PUT /api/bookings/{id}/photo-feedback`
  - Role: `CUSTOMER`
  - Request: `{ feedback: string }`
  - Response: `BookingResponse`
  - `PUT /api/bookings/{id}/final-photos`
  - Role: `STUDIO_OWNER`
  - Request: `{ photoUrls: string[], note?: string }`
  - Response: `BookingResponse`
- Stored MVP photo delivery URLs and feedback in booking logs to avoid adding a new table before the team approves a dedicated delivery asset schema.
- Updated frontend customer booking detail with demo/final photo viewing, feedback, final receipt confirmation, and review submission.
- Updated photographer booking management with demo/final photo link upload actions and visible customer feedback.
- Verification:
  - `dotnet build EXE201.Server\exe201.Server.csproj -o C:\tmp\exe201-server-build-check` succeeded.
  - `dotnet build EXE201.sln` was blocked by running process `exe201.Server (17388)` locking normal debug output files.
  - `npm run build` inside `exe201.client` succeeded.

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
