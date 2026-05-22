# GO! AI Coding Agent Guide

GO! is a Da Nang photographer marketplace. Keep every change aligned with the core flow:

`Search -> Compare -> Booking Request -> Photographer Confirm/Reject -> Customer Review`

## Tech Baseline

- Backend: ASP.NET Core Web API, .NET 8, C#.
- Frontend: React + Vite + TypeScript.
- Database: SQL Server.
- Data access: Entity Framework Core with repository/service layers.
- Auth: JWT bearer tokens with role-based authorization.

Do not introduce extra infrastructure such as microservices, message queues, Elasticsearch, Redis, or real payment gateways for MVP unless the team explicitly approves it.

## Roles

- `Customer`: search photographers, view profiles/packages/portfolio, create bookings, write reviews after completed bookings.
- `Photographer`: manage profile, portfolio, packages, working schedule, booking confirmations.
- `Admin`: manage users, photographers, bookings, reviews, reports, and moderation.

## Folder Ownership

- Backend controllers: `EXE201.Server/Controllers`
- Backend DTOs: `EXE201.Server/DTOs`
- Backend services: `EXE201.Server/Services`
- Backend repositories: `EXE201.Server/Repositories`
- Backend EF models/context: `EXE201.Server/Models`
- Frontend pages: `exe201.client/src/pages`
- Frontend components: `exe201.client/src/components`
- Frontend API client: `exe201.client/src/api`
- Frontend shared types/store: `exe201.client/src/types.ts`, `exe201.client/src/store`
- Documentation: `docs`, `README.md`, `CHANGELOG.md`

## Naming Rules

- C# classes, controllers, DTOs, services, repositories: `PascalCase`.
- C# local variables, parameters, private fields: `camelCase`; private fields may use `_camelCase`.
- Controller names end with `Controller`, for example `BookingsController`.
- Service interfaces/classes use `I{Name}Service` and `{Name}Service`.
- Repository interfaces/classes use `I{Name}Repository` and `{Name}Repository`.
- DTOs are named by intent: `CreateBookingRequest`, `BookingDetailResponse`, `UpdatePhotographerProfileRequest`.
- React components/pages use `PascalCase`, for example `PhotographerDetailPage`.
- API routes use plural resource names: `/api/bookings`, `/api/photographer-profiles`.

## Backend Rules

- Keep controllers thin. Controllers validate HTTP concerns, call services, and return DTOs.
- Put business rules in services.
- Put EF Core queries and persistence details in repositories.
- Do not return EF entities directly from public API endpoints. Return DTOs.
- Use `[Authorize(Roles = "...")]` for protected role-specific actions.
- Validate input with data annotations and service-level business checks.
- Use `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, and `ProblemDetails` consistently.
- Never hard-code passwords, API keys, JWT secrets, or connection strings in code.
- Use `appsettings.Development.json`, user secrets, or environment variables for local secrets.
- Do not change database schema without updating SQL scripts, EF model/context, and documentation.
- Keep payment as simulated status records for MVP.

## Database Rules

- SQL Server is the source of truth for persisted marketplace data.
- Use foreign keys for user, studio/photographer, package, booking, payment, and review relationships.
- Prefer soft delete fields such as `DeletedAt` when the existing schema uses them.
- Add indexes for search/filter fields: city, district, status, rating, price, shooting date, owner/customer ids.
- Do not remove existing columns or relationships without migration notes and team approval.

## Frontend Rules

- Use the existing React/Vite structure.
- Keep pages route-focused and components reusable.
- API calls go through `src/api`.
- Keep shared auth/user state in `src/store`.
- Do not duplicate role logic across pages when a route guard/helper can centralize it.
- Match the operational marketplace UX: dense, clear, searchable, and mobile-friendly.

## MVP Scope Guard

Must build first:

- Register/login.
- Customer, Photographer, Admin authorization.
- Photographer profile, portfolio, packages.
- Search/filter photographer.
- Photographer detail page.
- Booking request and confirm/reject workflow.
- Review after completed booking.
- Basic admin management.

Defer:

- Real online payments.
- Realtime chat.
- AI recommendation.
- Escrow/watermark release workflow.
- Advanced analytics.
- Mobile app.

## Documentation Rules

- Update `CHANGELOG.md` after major user-visible or architecture changes.
- Update `docs/AI_AUDIT_LOG.md` when AI generates or substantially changes code.
- Document any new API route with method, route, role, request, and response.
- Keep README setup steps working for a clean clone.

## Verification Before Handoff

- Backend: run `dotnet build EXE201.sln`.
- Frontend: run `npm run build` inside `exe201.client`.
- For API changes, test representative happy path and at least one authorization failure.
- For booking changes, verify status transitions do not allow invalid jumps.
