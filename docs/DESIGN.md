# Photography Booking Platform - Style Reference

> Premium photography marketplace inspired by Airbnb structure and Apple visual language.
> Clean, image-first, spacious, trustworthy, and easy to book.

**Theme:** Light
**Design Direction:** Airbnb layout + Apple visual + SaaS dashboard for management pages

---

## 1. Brand Feeling

The platform should feel like a premium photography booking marketplace.

Customer-facing pages must feel:

- Clean
- Premium
- Visual-first
- Easy to search
- Easy to compare
- Easy to book

Studio/Admin pages must feel:

- Professional
- Clear
- Data-driven
- Fast to manage
- Not overly decorative

The main design principle is:

> Let photos become the main visual highlight. UI should stay neutral, clean, and supportive.

---

# 2. Design Inspiration

## Customer Side

Inspired by:

- Airbnb: search, filter, card layout, booking flow, rating, location
- Apple: clean white/fog background, large typography, premium spacing
- Peerspace: studio/service marketplace and booking detail page
- Behance/Pixpa: portfolio gallery and image presentation

Used for:

- Home page
- Service listing
- Service detail
- Studio profile
- Portfolio gallery
- Booking modal

## Studio/Admin Side

Inspired by:

- Modern SaaS dashboard
- Clean admin panel
- ChatGPT-like simple layout for management pages

Used for:

- Studio dashboard
- Manage services
- Manage packages
- Manage portfolio
- Revenue
- Commission
- Booking statistics
- Admin users
- Admin studios
- Admin payments
- Admin categories

---

# 3. Tokens - Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Ink | `#1d1d1f` | `--color-ink` | Main text, headings, nav labels |
| Graphite | `#6b7280` | `--color-graphite` | Secondary text, descriptions, captions |
| Slate | `#374151` | `--color-slate` | Strong body text, table labels |
| Fog | `#f5f5f7` | `--color-fog` | Page background, section background |
| Snow | `#ffffff` | `--color-snow` | Card, modal, navbar background |
| Border | `#e5e7eb` | `--color-border` | Divider, card border, table border |
| Soft Border | `#f0f0f2` | `--color-soft-border` | Subtle section border |
| Azure | `#0071e3` | `--color-azure` | Primary CTA button, active state |
| Azure Dark | `#005bb5` | `--color-azure-dark` | CTA hover |
| Cobalt Link | `#0066cc` | `--color-cobalt-link` | Inline links |
| Success | `#16a34a` | `--color-success` | Approved, active, paid |
| Warning | `#f59e0b` | `--color-warning` | Pending, waiting approval |
| Danger | `#dc2626` | `--color-danger` | Delete, reject, locked |
| Black | `#000000` | `--color-black` | Premium CTA, dark card |
| Overlay | `rgba(0,0,0,0.48)` | `--color-overlay` | Image overlay, modal backdrop |

---

# 4. Tokens - Typography

Use system font stack similar to Apple.

```css
--font-display: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
--font-body: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
```

## Type Scale

| Role       | Size | Line Height | Weight | Letter Spacing | Usage                  |
| ---------- | ---: | ----------: | -----: | -------------: | ---------------------- |
| caption    | 12px |        1.33 |    400 |        -0.02em | Badge, helper text     |
| body-sm    | 14px |        1.43 |    400 |        -0.01em | Table, nav, small text |
| body       | 16px |        1.50 |    400 |        -0.01em | Main content           |
| subheading | 20px |        1.40 |    500 |       -0.015em | Section intro          |
| heading-sm | 24px |        1.30 |    600 |        -0.02em | Card title             |
| heading    | 40px |        1.15 |    700 |        -0.03em | Section title          |
| heading-lg | 56px |        1.08 |    700 |       -0.035em | Hero title             |
| display    | 72px |        1.04 |    700 |        -0.04em | Landing headline       |

## Typography Rules

### Do

* Use large headings on customer-facing pages.
* Use short, clear titles.
* Use neutral text colors.
* Use `font-weight: 700` for hero headlines.
* Use `font-weight: 600` for cards and dashboard sections.
* Keep body text readable at 16px.

### Don't

* Do not use too many font families.
* Do not use colorful headings.
* Do not center long paragraphs.
* Do not use tiny text for important booking information.

---

# 5. Tokens - Spacing

**Base unit:** 4px
**Density:** Comfortable

| Name | Value | Token           |
| ---- | ----: | --------------- |
| 4    |   4px | `--spacing-4`   |
| 8    |   8px | `--spacing-8`   |
| 12   |  12px | `--spacing-12`  |
| 16   |  16px | `--spacing-16`  |
| 20   |  20px | `--spacing-20`  |
| 24   |  24px | `--spacing-24`  |
| 28   |  28px | `--spacing-28`  |
| 32   |  32px | `--spacing-32`  |
| 40   |  40px | `--spacing-40`  |
| 48   |  48px | `--spacing-48`  |
| 64   |  64px | `--spacing-64`  |
| 80   |  80px | `--spacing-80`  |
| 120  | 120px | `--spacing-120` |

---

# 6. Border Radius

| Element              | Value |
| -------------------- | ----: |
| Small input/button   |  10px |
| Card                 |  24px |
| Premium feature card |  28px |
| Modal                |  28px |
| Image card           |  24px |
| Pill button          | 999px |
| Avatar/logo          | 999px |

Main rule:

> Use 24px-28px radius for cards. Use 999px only for primary CTA buttons and status pills.

---

# 7. Surfaces

| Level | Name          | Value              | Purpose                                |
| ----- | ------------- | ------------------ | -------------------------------------- |
| 0     | Canvas        | `#f5f5f7`          | Main page background                   |
| 1     | Card          | `#ffffff`          | Service cards, dashboard cards, modals |
| 2     | Recessed      | `#f9fafb`          | Input, filter area, nested content     |
| 3     | Dark Stage    | `#000000`          | Hero overlay, premium photo section    |
| 4     | Image Overlay | `rgba(0,0,0,0.48)` | Text over image                        |

Elevation should be subtle.

Use:

```css
box-shadow: 0 8px 24px rgba(0,0,0,0.04);
```

Only use shadow when needed. Prefer border and background contrast.

---

# 8. Layout System

## Page Width

```css
--page-max-width: 1200px;
--dashboard-max-width: 1440px;
```

## Customer Layout

Customer pages use:

* Large hero section
* Centered max-width container
* Search/filter bar
* Service card grid
* Large photo gallery
* Sticky booking panel on detail page

## Studio/Admin Layout

Dashboard pages use:

* Left sidebar
* Topbar
* Statistic cards
* Data table
* Filter/search row
* Create/update modal
* Confirmation dialog for dangerous actions

---

# 9. Components

## 9.1 Global Navigation Bar

**Role:** Main app navigation.

Style:

```css
height: 64px;
background: rgba(255,255,255,0.86);
backdrop-filter: blur(20px);
border-bottom: 1px solid #e5e7eb;
position: sticky;
top: 0;
z-index: 50;
```

Rules:

* Logo on the left.
* Main navigation in the center or left.
* Auth/profile actions on the right.
* Use simple text links.
* Active link uses `#1d1d1f`.
* Primary CTA uses Azure button.

---

## 9.2 Hero Section

**Role:** First impression on home page.

Style:

```css
background: #f5f5f7;
padding: 96px 24px 64px;
text-align: center;
```

Hero content:

* Eyebrow text
* Large headline
* Short description
* Search bar
* Hero image or image collage

Example copy structure:

```txt
Find the right studio for every moment.
Book professional photography services from trusted studios near you.
```

Hero headline:

```css
font-size: clamp(44px, 8vw, 72px);
font-weight: 700;
line-height: 1.04;
letter-spacing: -0.04em;
color: #1d1d1f;
```

---

## 9.3 Search Bar

**Role:** Main customer action.

Fields:

* City
* Category
* Price range
* Date/Time optional
* Search button

Style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 999px;
padding: 8px;
box-shadow: 0 12px 32px rgba(0,0,0,0.06);
```

Rules:

* Search button should be the strongest visual element.
* Keep fields compact.
* Use icons only if they improve clarity.
* On mobile, search bar becomes vertical card.

---

## 9.4 Primary Button

**Role:** Main action such as Search, Book Now, Save, Submit.

```css
background: #0071e3;
color: #ffffff;
border-radius: 999px;
padding: 10px 18px;
font-size: 16px;
font-weight: 500;
border: none;
```

Hover:

```css
background: #005bb5;
```

Rules:

* One primary CTA per visual area.
* Do not place too many blue buttons in one section.
* Use black button for premium hero if background has many photos.

---

## 9.5 Secondary Button

**Role:** View detail, cancel, back, learn more.

```css
background: #ffffff;
color: #1d1d1f;
border: 1px solid #e5e7eb;
border-radius: 999px;
padding: 10px 18px;
```

---

## 9.6 Danger Button

**Role:** Delete, reject, lock, hide service.

```css
background: #dc2626;
color: #ffffff;
border-radius: 999px;
padding: 10px 18px;
```

Rules:

* Always show confirmation before dangerous action.
* Use clear text: Delete, Reject, Lock, Hide.
* Do not use danger color for normal navigation.

---

## 9.7 Service Card

**Role:** Main listing item for customer.

Content:

* Large image
* Service name
* Studio name
* City
* Category
* Rating
* Price from
* View detail / Book button

Style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 24px;
overflow: hidden;
transition: transform 0.2s ease, box-shadow 0.2s ease;
```

Image:

```css
aspect-ratio: 4 / 3;
object-fit: cover;
width: 100%;
```

Hover:

```css
transform: translateY(-2px);
box-shadow: 0 12px 32px rgba(0,0,0,0.08);
```

Rules:

* Image must be the most important part.
* Price should be visible.
* Rating should be small but clear.
* Do not overcrowd card with too much text.

---

## 9.8 Service Detail Page

**Role:** Help customer decide and book.

Layout:

```txt
Photo Gallery
Service Title
Studio Info
Rating / Reviews
Description
Packages
Portfolio
Booking Panel
```

Desktop layout:

* Left: content and images
* Right: sticky booking card

Booking card:

```css
position: sticky;
top: 88px;
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 28px;
padding: 24px;
box-shadow: 0 12px 32px rgba(0,0,0,0.06);
```

Rules:

* Booking panel must always show price and CTA.
* Package selection must be clear.
* If backend requires `packageId` and `slotId`, UI must collect both.
* Show disabled state when missing required fields.

---

## 9.9 Studio Profile Page

**Role:** Present studio credibility.

Sections:

* Studio cover image
* Logo/avatar
* Studio name
* City/address
* Approval/verification badge
* Description
* Services
* Portfolio gallery
* Reviews

Style:

* Large cover image
* White info card overlapping cover
* Clean gallery grid
* Minimal text

Rules:

* Studio profile should feel like a premium portfolio.
* Use real photos heavily.
* Avoid admin-like layout on public studio page.

---

## 9.10 Portfolio Gallery

**Role:** Show studio work.

Layout options:

* Masonry grid
* 3-column grid
* Lightbox preview

Style:

```css
border-radius: 20px;
overflow: hidden;
```

Rules:

* Images should be large and clean.
* Do not add heavy borders.
* Use hover overlay only for action buttons.
* For studio management, show delete button only on hover.

---

## 9.11 Package Card

**Role:** Display photography package.

Content:

* Package name
* Price
* Duration
* Number of edited photos
* Description
* Select/Edit/Delete action

Customer style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 24px;
padding: 24px;
```

Studio management style:

* More compact
* Include edit/delete actions
* Show status if needed

Rules:

* Price must be easy to see.
* Package must clearly belong to one service.
* Customer should be able to select one package before booking.

---

## 9.12 Dashboard Sidebar

**Role:** Studio/Admin navigation.

Style:

```css
width: 260px;
background: #ffffff;
border-right: 1px solid #e5e7eb;
height: 100vh;
position: sticky;
top: 0;
```

Sidebar item:

```css
border-radius: 12px;
padding: 10px 14px;
font-size: 14px;
font-weight: 500;
```

Active item:

```css
background: #f5f5f7;
color: #1d1d1f;
```

Rules:

* Keep sidebar simple.
* Group related features.
* Do not use too many colors.

---

## 9.13 Dashboard Statistic Card

**Role:** Revenue, booking, commission, user count.

Style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 24px;
padding: 24px;
```

Content:

* Label
* Number
* Small description
* Optional trend

Rules:

* Number should be large.
* Label should be muted.
* Use real API data, not mock data.
* Show loading state while fetching.

---

## 9.14 Data Table

**Role:** Admin and studio management.

Used for:

* Users
* Studios
* Services
* Packages
* Payments
* Categories
* Bookings

Style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 24px;
overflow: hidden;
```

Rules:

* Include search/filter row above table.
* Include status badges.
* Include clear action buttons.
* Dangerous actions require confirmation.
* Empty state must be shown when no data.

---

## 9.15 Status Badge

Status badge style:

```css
border-radius: 999px;
padding: 4px 10px;
font-size: 12px;
font-weight: 600;
```

Status colors:

| Status   | Background | Text      |
| -------- | ---------- | --------- |
| ACTIVE   | `#dcfce7`  | `#166534` |
| APPROVED | `#dcfce7`  | `#166534` |
| PENDING  | `#fef3c7`  | `#92400e` |
| REJECTED | `#fee2e2`  | `#991b1b` |
| LOCKED   | `#fee2e2`  | `#991b1b` |
| HIDDEN   | `#f3f4f6`  | `#374151` |
| DELETED  | `#fee2e2`  | `#991b1b` |
| PAID     | `#dcfce7`  | `#166534` |
| FAILED   | `#fee2e2`  | `#991b1b` |

---

# 10. Page Guidelines

## 10.1 Home Page

Must include:

* Hero section
* Search bar
* Popular categories
* Featured services
* Featured studios
* Portfolio preview
* CTA section

Style:

* Apple-like big headline
* Airbnb-like search and cards
* Lots of white space
* High-quality photos

---

## 10.2 Service Listing Page

Must include:

* Search input
* Category filter
* City filter
* Price filter
* Sort option
* Service card grid
* Empty state
* Loading state

Rules:

* Filter must call real API or filter real API data.
* Do not use mock services.
* Customer only sees active, approved, visible services.

---

## 10.3 Service Detail Page

Must include:

* Image gallery
* Service information
* Studio information
* Package list
* Portfolio
* Review/rating
* Booking panel

Rules:

* Customer must select package before booking.
* If backend requires slot, UI must collect slot.
* Hidden/deleted/inactive service must not be bookable.

---

## 10.4 Studio Dashboard

Must include:

* Revenue summary
* Booking summary
* Service count
* Portfolio count
* Recent bookings
* Quick actions

Rules:

* No mock revenue if claiming UC is DONE.
* Show empty state if no booking.
* Show loading state while fetching.

---

## 10.5 Manage Services Page

Must include:

* Service list
* Create service
* Edit service
* Delete/soft delete service
* Toggle active/inactive
* Upload portfolio shortcut
* Manage packages shortcut

Rules:

* Studio can only manage its own services.
* Studio must be APPROVED before creating service.
* Use confirmation before delete.
* Refresh list after create/update/delete.

---

## 10.6 Manage Packages Page

Must include:

* Package list by service
* Create package
* Edit package
* Delete package
* Set package price

Rules:

* Package must belong to a service.
* Price must be required and greater than 0.
* Customer detail page should display packages from real API.

---

## 10.7 Manage Portfolio Page

Must include:

* Upload image
* Delete image
* Preview image
* Gallery grid

Rules:

* Show upload progress if possible.
* Image must belong to correct service/studio.
* Use confirmation before delete.

---

## 10.8 Admin Dashboard

Must include:

* Total users
* Total studios
* Total services
* Total payments
* Platform revenue
* Commission
* Pending studio approvals
* Recent admin actions if available

Rules:

* Admin data must come from API.
* Admin actions must be protected by ADMIN role.
* No mock payment/revenue data if UC is marked DONE.

---

# 11. Do's and Don'ts

## Do

* Use `#f5f5f7` as page background.
* Use white cards with 24px-28px radius.
* Use large photos on customer-facing pages.
* Use one clear primary CTA per section.
* Use Azure `#0071e3` only for important actions.
* Use neutral text colors.
* Use status badges consistently.
* Use confirmation dialogs for delete/hide/reject/lock.
* Use loading, empty, error, and success states.
* Keep layout spacious and clean.

## Don't

* Do not make the web look like a plain admin system on customer pages.
* Do not use too many colors.
* Do not use heavy shadows everywhere.
* Do not use tiny service images.
* Do not hide price on service cards.
* Do not show hidden/deleted/inactive services to customers.
* Do not use mock data after connecting API.
* Do not hard-code userId, studioId, or adminId.
* Do not let unapproved studios create services.
* Do not put too many buttons with the same visual priority.

---

# 12. Motion System

Use subtle motion only.

```css
--motion-fast: 0.1s;
--motion-normal: 0.2s;
--motion-slow: 0.32s;
--motion-ease: ease;
```

Recommended animation:

* Button hover: 0.1s
* Card hover: 0.2s
* Modal open: 0.2s
* Page section reveal: 0.32s

Rules:

* Do not use excessive animation.
* Do not animate important data tables too much.
* Use smooth transitions for hover and modal.

---

# 13. Responsive Rules

## Desktop

* Max width: 1200px for customer pages.
* Dashboard max width: 1440px.
* Service listing: 3 or 4 columns.
* Service detail: content left, booking card right.

## Tablet

* Service listing: 2 columns.
* Detail page: booking card below main information.
* Dashboard sidebar may collapse.

## Mobile

* Service listing: 1 column.
* Search bar becomes vertical.
* Hero headline should reduce to 40px-48px.
* Booking CTA should become sticky bottom button.
* Tables should become cards or horizontal scroll.

---

# 14. CSS Custom Properties

```css
:root {
  /* Colors */
  --color-ink: #1d1d1f;
  --color-graphite: #6b7280;
  --color-slate: #374151;
  --color-fog: #f5f5f7;
  --color-snow: #ffffff;
  --color-border: #e5e7eb;
  --color-soft-border: #f0f0f2;
  --color-azure: #0071e3;
  --color-azure-dark: #005bb5;
  --color-cobalt-link: #0066cc;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-danger: #dc2626;
  --color-black: #000000;
  --color-overlay: rgba(0,0,0,0.48);

  /* Fonts */
  --font-display: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;

  /* Type Scale */
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-subheading: 20px;
  --text-heading-sm: 24px;
  --text-heading: 40px;
  --text-heading-lg: 56px;
  --text-display: 72px;

  /* Line Height */
  --leading-caption: 1.33;
  --leading-body-sm: 1.43;
  --leading-body: 1.5;
  --leading-subheading: 1.4;
  --leading-heading-sm: 1.3;
  --leading-heading: 1.15;
  --leading-heading-lg: 1.08;
  --leading-display: 1.04;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-card: 24px;
  --radius-premium: 28px;
  --radius-full: 999px;

  /* Layout */
  --page-max-width: 1200px;
  --dashboard-max-width: 1440px;
  --navbar-height: 64px;
  --sidebar-width: 260px;

  /* Motion */
  --motion-fast: 0.1s;
  --motion-normal: 0.2s;
  --motion-slow: 0.32s;
  --motion-ease: ease;
}
```

---

# 15. Tailwind Theme Reference

```css
@theme {
  --color-ink: #1d1d1f;
  --color-graphite: #6b7280;
  --color-slate: #374151;
  --color-fog: #f5f5f7;
  --color-snow: #ffffff;
  --color-border: #e5e7eb;
  --color-soft-border: #f0f0f2;
  --color-azure: #0071e3;
  --color-azure-dark: #005bb5;
  --color-cobalt-link: #0066cc;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-danger: #dc2626;

  --font-display: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;

  --radius-card: 24px;
  --radius-premium: 28px;
  --radius-full: 999px;
}
```

---

# 16. Agent Prompt Guide

Use this prompt when asking AI/Agent to refactor frontend.

```md
You are a Senior Frontend Engineer and UI Designer.

Refactor the frontend UI of this photography booking platform using the following design direction:

Style:
- Customer pages: Airbnb structure + Apple visual language.
- Studio/Admin pages: clean modern SaaS dashboard.
- Overall feeling: premium, clean, image-first, spacious, trustworthy.

Important rules:
- Keep all existing API logic, route logic, auth logic, role guard, and business logic.
- Do not replace real API data with mock data.
- Do not change backend endpoint contracts.
- Do not hard-code userId, studioId, adminId.
- Do not break CUSTOMER/STUDIO/ADMIN role-based access.
- Customer-facing pages must prioritize large images, search, filter, rating, price, and booking CTA.
- Studio/Admin pages must prioritize sidebar, statistic cards, tables, filters, modals, and clear actions.

Apply the design system from docs/DESIGN.md:
- Background: #f5f5f7
- Card: #ffffff
- Main text: #1d1d1f
- Secondary text: #6b7280
- Primary CTA: #0071e3
- Border: #e5e7eb
- Card radius: 24px-28px
- Pill button radius: 999px
- Use subtle shadow only when necessary.

Pages to refactor:
- Home page
- Service listing page
- Service detail page
- Studio profile page
- Portfolio gallery
- Studio dashboard
- Manage services
- Manage packages
- Manage portfolio
- Admin dashboard
- Admin users
- Admin studios
- Admin services
- Admin payments
- Admin revenue/commission

Expected output:
- Modern UI
- Responsive layout
- Loading state
- Empty state
- Error state
- Success feedback
- Confirmation dialog for dangerous actions
- No mock data if API exists
```

---

# 17. Final Design Summary

The frontend should not look like a generic school project.

It should look like:

> A premium photography service marketplace where customers can easily find, compare, and book trusted studios, while studios and admins manage their data through a clean SaaS dashboard.

Customer side:

```txt
Airbnb layout + Apple visual + Portfolio gallery
```

Studio/Admin side:

```txt
Clean SaaS dashboard + simple management UI
```
