# AI Audit Log

## 2026-05-22

- Added backend DTOs, services, and controllers for real Core MVP catalog, portfolio, schedule, booking, and payment APIs.
- Used the existing database-first EF Core model and did not add duplicate tables.
- Added Hoang UC support endpoints for public studio detail, studio dashboard, and owner-scoped service listing.
- Ran API smoke tests for UC07-UC15, UC36-UC46, and UC75 using temporary data through local test instance on port 5299.
- Verification:
  - `dotnet build EXE201.Server\exe201.Server.csproj --no-restore -p:UseAppHost=false -o C:\tmp\exe201-build-check` succeeded.
  - Full solution build was blocked because an existing `EXE201.Server` process locked the normal debug output files.
