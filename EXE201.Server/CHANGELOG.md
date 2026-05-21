This file explains how Visual Studio created the project.

The following steps were used to generate this project:
- Create new ASP\.NET Core Web API project.
- Update project file to add a reference to the frontend project and set SPA properties.
- Update `launchSettings.json` to register the SPA proxy as a startup assembly.
- Add project to the startup projects list.
- Write this file.

## 2026-05-22

- Added real SQL Server-backed Core MVP APIs for categories, services, packages, studio portfolios, schedules, bookings, and payments.
- Mapped new APIs to existing database-first EF Core entities and tables: `categories`, `services`, `service_images`, `packages`, `studio_portfolios`, `working_schedules`, `working_days`, `time_slots`, `bookings`, and `payments`.
- Added role and ownership checks so studio owners can only mutate their own studio data, customers can only access their bookings/payments, and admins manage categories.
- Kept existing Auth/Admin/Public controllers unchanged.
- Added public studio detail and studio-owner dashboard endpoints for Service/Package/Portfolio MVP coverage.
- Added owner-scoped service listing at `GET /api/services/mine` and restricted inactive service visibility to admins on public search.
