# GO!

GO! is a web platform that connects customers with photographers in Da Nang. The MVP focuses on a simple marketplace flow:

`Search -> Compare -> Booking -> Confirm -> Review`

## Problem

Customers currently find photographers through Facebook, Instagram, groups, or referrals. Information is scattered, prices are unclear, portfolio styles are hard to compare, and service quality is risky.

GO! centralizes photographer profiles, portfolios, service packages, booking requests, status tracking, and post-booking reviews.

## Main Users

- Customer: searches photographers, compares style/price/reviews, sends booking requests, writes reviews.
- Photographer: manages profile, portfolio, packages, schedules, and booking requests.
- Admin: manages users, photographers, bookings, reviews, and moderation.

## Tech Stack

- Backend: ASP.NET Core Web API, .NET 8.
- Frontend: React + Vite + TypeScript.
- Database: SQL Server.
- ORM/data access: Entity Framework Core.
- Authentication: JWT bearer token.
- API documentation: Swagger/OpenAPI.

SignalR, real payment gateways, AI recommendation, and realtime chat are intentionally out of MVP scope.

## Project Structure

```text
.
├── EXE201.sln
├── AGENTS.md
├── README.md
├── PhotoStudioBooking_v3.sql
├── insert_sample_data.sql
├── EXE201.Server/
│   ├── Controllers/
│   ├── DTOs/
│   ├── Models/
│   ├── Repositories/
│   ├── Services/
│   ├── Utils/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── CHANGELOG.md
└── exe201.client/
    ├── src/
    │   ├── api/
    │   ├── assets/
    │   ├── components/
    │   ├── data/
    │   ├── pages/
    │   ├── store/
    │   ├── App.tsx
    │   └── main.tsx
    ├── public/
    ├── package.json
    └── CHANGELOG.md
```

Recommended documentation folder:

```text
docs/
├── API.md
├── DATABASE.md
├── ROADMAP.md
├── TEAM_WORKFLOW.md
└── AI_AUDIT_LOG.md
```

## MVP Features

- Register/login.
- Role-based access for Customer, Photographer, and Admin.
- Photographer profile management.
- Photographer portfolio management.
- Service package management.
- Search and filter photographers.
- Photographer detail page.
- Booking request creation.
- Photographer confirm/reject booking.
- Customer review after completed booking.
- Basic admin dashboard and moderation.
- Simulated payment status only.

## Deferred Features

- Real online payments.
- Realtime chat.
- AI recommendation.
- Escrow or unlock-after-payment workflow.
- Advanced analytics.
- Mobile app.

## Run Backend

```powershell
dotnet restore EXE201.sln
dotnet build EXE201.sln
dotnet run --project EXE201.Server
```

Configure the SQL Server connection string in `EXE201.Server/appsettings.Development.json` or environment variables. Do not commit real secrets.

## Run Frontend

```powershell
cd exe201.client
npm install
npm run dev
```

## Database

Use SQL Server and initialize the schema/sample data from:

- `PhotoStudioBooking_v3.sql`
- `insert_sample_data.sql`

Core tables include users, roles, studios/photographer profiles, services, packages, portfolio images, bookings, booking statuses, payments, reviews, notifications, reports, and admin/system views.

## Team Workflow

- Create a branch per feature: `feature/bookings`, `feature/search-filter`, `fix/auth-token`.
- Keep backend and frontend changes scoped to the module being worked on.
- Update DTOs and API documentation whenever endpoint contracts change.
- Update SQL scripts and database docs whenever schema changes.
- Update `CHANGELOG.md` for major changes.
- Update `docs/AI_AUDIT_LOG.md` when AI generates meaningful code.

## Suggested Team Ownership

- Leader/Product Owner: scope, backlog, API contract review, demo script.
- Backend Developer: controllers, services, repositories, auth, booking flow.
- Frontend Developer: pages, components, route guards, API integration.
- Database/QA Developer: SQL Server schema, sample data, test cases.
- AI Documentation/DevOps Support: README, API docs, audit log, build/run scripts.

## Quality Checklist

- `dotnet build EXE201.sln` passes.
- `npm run build` passes in `exe201.client`.
- Protected endpoints reject unauthorized users.
- Customer cannot confirm photographer bookings.
- Photographer cannot manage another photographer profile.
- Review can only be created after a completed booking.
- Booking status transitions are valid and auditable.
