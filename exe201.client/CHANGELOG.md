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

## 2026-05-22 - Hoang Core MVP FE integration

- Replaced customer service listing filters with API-backed search/category/city/price filters.
- Replaced service detail and studio detail mock data with API-backed service, package, portfolio, and review displays.
- Added studio service management, studio package management, portfolio management, and admin category management pages.
- Added frontend API client modules for categories, services, studios, packages, portfolios, reviews, and admin categories.
- Added navigation routes for `/photographer/services`, `/photographer/packages`, and `/admin/categories`.
