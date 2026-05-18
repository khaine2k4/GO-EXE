# Photo Studio Booking System

A full-featured **Photo Studio Booking Platform** built with **SQL Server (T-SQL)** for managing photography studios, bookings, schedules, payments, reviews, and administration.

This project was designed for Software Engineering and Database System courses, focusing on scalable relational database architecture and real-world business workflows.

---

# Features

## Customer Features
- Register and login
- Browse photography studios
- Search/filter services
- View portfolios and reviews
- Book photography packages
- Make online payments
- Track booking history
- Rate and review studios
- Report issues or inappropriate content

---

## Studio Owner Features
- Register studio
- Manage studio profile
- Create/edit photography services
- Manage pricing packages
- Upload portfolio images
- Configure working schedules
- Open/close booking slots
- Confirm/reject bookings
- Track studio revenue

---

## Admin Features
- Manage users and roles
- Approve/reject studios
- Ban/unban studios
- Hide inappropriate services/reviews
- Handle reports and disputes
- Monitor system statistics
- Track platform revenue

---

# Technologies Used

- SQL Server
- T-SQL
- Stored Procedures
- Triggers
- Views
- Relational Database Design

---

# Database Components

| Component | Quantity |
|---|---|
| Tables | 21 |
| Views | 3 |
| Stored Procedures | 4 |
| Triggers | 3 |

---

# Main Database Modules

- Users & Roles
- Studios
- Services & Packages
- Working Schedules
- Time Slots
- Bookings
- Payments
- Reviews
- Reports
- Booking Logs

---

# Booking Workflow

The system supports a complete booking lifecycle:

- PENDING
- CONFIRMED
- REJECTED
- CANCELLED
- IN_PROGRESS
- COMPLETED
- DISPUTED

---

# Important Features

## Automatic Revenue Calculation
The database automatically calculates:
- Commission amount
- Studio revenue
- Platform revenue

using triggers and stored procedures.

---

## Audit Logging
The system stores:
- Booking status changes
- Cancellation history
- Dispute handling logs
- Admin moderation actions

---

## Revenue Dashboard
Built-in SQL views for:
- Monthly platform revenue
- Studio revenue statistics
- Overall system analytics

---

# Stored Procedures

| Procedure | Description |
|---|---|
| `sp_generate_booking_code` | Generate booking code |
| `sp_confirm_booking` | Confirm booking and reserve slot |
| `sp_cancel_booking` | Cancel booking and release slot |
| `sp_update_studio_rating` | Recalculate studio ratings |

---

# Views

| View | Purpose |
|---|---|
| `v_monthly_platform_revenue` | Monthly revenue summary |
| `v_studio_revenue` | Studio earnings statistics |
| `v_system_stats` | System-wide analytics |

---

# Suggested Project Structure

```plaintext
PhotoStudioBooking/
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── procedures.sql
│   ├── triggers.sql
│   └── views.sql
│
├── docs/
│   ├── ERD.png
│   ├── usecase-diagram.png
│   └── database-design.md
│
└── README.md