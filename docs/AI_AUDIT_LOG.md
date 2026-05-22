# AI Audit Log

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
