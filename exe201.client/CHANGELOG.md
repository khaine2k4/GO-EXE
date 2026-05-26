This file explains how Visual Studio created the project.

The following tools were used to generate this project:
- create-vite

The following steps were used to generate this project:
- Create react project with create-vite: `npm init --yes vite@latest exe201.client -- --template=react-ts`.
- Create project file (`exe201.client.esproj`).
- Create `launch.json` to enable debugging.
- Add project to solution.
- Update proxy endpoint to be the backend server endpoint.
- Add project to the startup projects list.
- Write this file.

## 2026-05-23 - Premium marketplace UI refactor

- Added design-system tokens for the light photography marketplace theme.
- Refactored the shared customer layout, admin shell, home page, service listing, service detail, studio profile, and photo cards toward an Airbnb/Apple-style customer experience.
- Improved customer-facing loading, empty, pricing, rating, portfolio, and sticky booking-panel presentation while keeping existing API calls and route contracts intact.
- Revised the home page to feel more like a photography booking marketplace: real service cards, photography collage hero, Airbnb-style city/category/price search, quick filters, hidden zero stats, clearer CTA copy, and English navigation labels.
- Replaced the Studios page mock-store data source with the public database-backed `/api/studios` endpoint and added API-backed studio search/filter cards.
- Kept studio/admin management pages on the existing API-driven workflows and aligned their shared shell with the clean SaaS dashboard direction.
- Verification: `npm run build` succeeded. Normal `dotnet build EXE201.sln` was blocked by the running backend executable lock, so the backend project was compiled with `UseAppHost=false` to a temporary output folder successfully.

## 2026-05-22 - Hoang Core MVP FE integration

- Replaced customer service listing filters with API-backed search/category/city/price filters.
- Replaced service detail and studio detail mock data with API-backed service, package, portfolio, and review displays.
- Added studio service management, studio package management, portfolio management, and admin category management pages.
- Added frontend API client modules for categories, services, studios, packages, portfolios, reviews, and admin categories.
- Added navigation routes for `/photographer/services`, `/photographer/packages`, and `/admin/categories`.
