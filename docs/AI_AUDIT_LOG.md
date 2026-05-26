# AI Audit Log

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
