# AI Audit Log

## 2026-05-22

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
