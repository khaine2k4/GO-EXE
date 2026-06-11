-- ================================================================
-- PHOTO STUDIO BOOKING SYSTEM — DATABASE SCHEMA v3.0
-- Platform  : SQL Server 2019+ (T-SQL)
-- Changelog :
--   v3.0 — Production hardening
--     [FIX-01] studio_portfolios moved AFTER services (FK ordering)
--     [FIX-02] Soft-delete (deleted_at / deleted_by) on users,
--              studios, packages
--     [FIX-03] notifications table
--     [FIX-04] favorite_studios + favorite_services tables
--     [FIX-05] currency_code on payments
--     [FIX-06] Recursive trigger guard via TRIGGER_NESTLEVEL()
--     [FIX-07] Double-booking prevention (slot lock in SP +
--              UNIQUE constraint on bookings.slot_id)
--     [FIX-08] booking_code uses SEQUENCE — no race condition
--     [FIX-09] created_by / updated_by on key tables
--     [FIX-10] messages table (customer ↔ studio)
--     [FIX-11] reviews: CHECK only when booking = COMPLETED
--     [FIX-12] booking flow includes DEMO_UPLOADED, EDITING, FINAL_DELIVERED before COMPLETED
--              (enforced via trigger)
--     [FIX-12] Note: media_files table skipped per scope decision
-- ================================================================

CREATE DATABASE PhotoStudioBooking
    COLLATE Vietnamese_CI_AS;   -- supports Vietnamese characters natively
GO

USE PhotoStudioBooking;
GO

-- ================================================================
-- SEQUENCE for booking_code — race-condition-safe  [FIX-08]
-- ================================================================
CREATE SEQUENCE seq_booking_code
    START WITH 1
    INCREMENT BY 1
    NO CYCLE
    CACHE 50;
GO

-- ================================================================
-- 1. ROLES
-- ================================================================
CREATE TABLE roles (
    role_id     BIGINT       PRIMARY KEY IDENTITY(1,1),
    role_name   VARCHAR(50)  NOT NULL UNIQUE,
    description NVARCHAR(255)
);
GO

-- ================================================================
-- 2. USERS                                          [FIX-02,09]
-- ================================================================
CREATE TABLE users (
    user_id        BIGINT        PRIMARY KEY IDENTITY(1,1),
    role_id        BIGINT        NOT NULL,
    full_name      NVARCHAR(255) NOT NULL,
    email          VARCHAR(255)  NOT NULL UNIQUE,
    phone          VARCHAR(20),
    password_hash  VARCHAR(255)  NOT NULL,
    avatar_url     VARCHAR(500),
    gender         VARCHAR(10),
    dob            DATE,

    -- 'ACTIVE' | 'LOCKED' | 'UNVERIFIED'
    status         VARCHAR(20)   NOT NULL DEFAULT 'UNVERIFIED',
    email_verified BIT           NOT NULL DEFAULT 0,
    last_login_at  DATETIME2,

    -- Soft delete                                  [FIX-02]
    deleted_at     DATETIME2,
    deleted_by     BIGINT,

    -- Audit                                        [FIX-09]
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     BIGINT,
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by     BIGINT,

    CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
GO
CREATE INDEX IX_users_email  ON users(email)   WHERE deleted_at IS NULL;
CREATE INDEX IX_users_role   ON users(role_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_users_status ON users(status)  WHERE deleted_at IS NULL;
GO

-- ================================================================
-- 3. USER ADDRESSES
-- ================================================================
CREATE TABLE user_addresses (
    address_id   BIGINT        PRIMARY KEY IDENTITY(1,1),
    user_id      BIGINT        NOT NULL,
    city         NVARCHAR(100),
    district     NVARCHAR(100),
    ward         NVARCHAR(100),
    address_line NVARCHAR(500),
    is_default   BIT           NOT NULL DEFAULT 0,
    created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_user_addresses_users FOREIGN KEY (user_id) REFERENCES users(user_id)
);
GO

-- ================================================================
-- 4. CATEGORIES
-- ================================================================
CREATE TABLE categories (
    category_id   BIGINT        PRIMARY KEY IDENTITY(1,1),
    category_name NVARCHAR(255) NOT NULL,
    description   NVARCHAR(MAX),
    icon_url      VARCHAR(500),
    is_active     BIT           NOT NULL DEFAULT 1,
    sort_order    INT           NOT NULL DEFAULT 0,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    BIGINT,                                         -- [FIX-09]
    updated_by    BIGINT
);
GO

-- ================================================================
-- 5. STUDIOS                                        [FIX-02,09]
-- ================================================================
CREATE TABLE studios (
    studio_id          BIGINT        PRIMARY KEY IDENTITY(1,1),
    owner_id           BIGINT        NOT NULL,
    studio_name        NVARCHAR(255) NOT NULL,
    description        NVARCHAR(MAX),
    logo_url           VARCHAR(500),
    cover_url          VARCHAR(500),
    phone              VARCHAR(20),
    email              VARCHAR(255),
    city               NVARCHAR(100),
    district           NVARCHAR(100),
    address_line       NVARCHAR(500),
    lat                DECIMAL(10,7),
    lng                DECIMAL(10,7),
    commission_percent DECIMAL(5,2)  NOT NULL DEFAULT 10,
    slot_duration_minutes INT        NOT NULL DEFAULT 60 CONSTRAINT CK_studios_slot_duration CHECK (slot_duration_minutes IN (30, 60, 90, 120, 180, 240)),

    -- Denormalized counters
    avg_rating         DECIMAL(3,2)  NOT NULL DEFAULT 0,
    total_reviews      INT           NOT NULL DEFAULT 0,
    total_bookings     INT           NOT NULL DEFAULT 0,

    -- 'PENDING'|'APPROVED'|'REJECTED'|'BANNED'|'INACTIVE'
    status             VARCHAR(20)   NOT NULL DEFAULT 'PENDING',

    -- Approval / rejection audit
    rejection_reason   NVARCHAR(MAX),
    rejected_by        BIGINT,
    rejected_at        DATETIME2,
    approved_by        BIGINT,
    approved_at        DATETIME2,

    -- Ban audit
    banned_by          BIGINT,
    banned_at          DATETIME2,
    ban_reason         NVARCHAR(MAX),

    -- Soft delete                                  [FIX-02]
    deleted_at         DATETIME2,
    deleted_by         BIGINT,

    -- Audit                                        [FIX-09]
    created_at         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         BIGINT,
    updated_at         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         BIGINT,

    CONSTRAINT FK_studios_owner    FOREIGN KEY (owner_id)    REFERENCES users(user_id),
    CONSTRAINT FK_studios_rejected FOREIGN KEY (rejected_by) REFERENCES users(user_id),
    CONSTRAINT FK_studios_approved FOREIGN KEY (approved_by) REFERENCES users(user_id),
    CONSTRAINT FK_studios_banned   FOREIGN KEY (banned_by)   REFERENCES users(user_id),
    CONSTRAINT FK_studios_deleted  FOREIGN KEY (deleted_by)  REFERENCES users(user_id)
);
GO
CREATE INDEX IX_studios_owner  ON studios(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_studios_status ON studios(status)   WHERE deleted_at IS NULL;
CREATE INDEX IX_studios_city   ON studios(city)     WHERE deleted_at IS NULL;
CREATE INDEX IX_studios_rating ON studios(avg_rating DESC) WHERE deleted_at IS NULL AND status = 'APPROVED';
GO

-- ================================================================
-- 6. SERVICES                                       [FIX-09]
-- ================================================================
CREATE TABLE services (
    service_id    BIGINT        PRIMARY KEY IDENTITY(1,1),
    studio_id     BIGINT        NOT NULL,
    category_id   BIGINT        NOT NULL,
    service_name  NVARCHAR(255) NOT NULL,
    description   NVARCHAR(MAX),
    thumbnail_url VARCHAR(500),
    city          NVARCHAR(100),
    is_active     BIT           NOT NULL DEFAULT 1,
    is_hidden     BIT           NOT NULL DEFAULT 0,   -- admin ẩn vi phạm (UC73)
    hidden_by     BIGINT,
    hidden_at     DATETIME2,
    sort_order    INT           NOT NULL DEFAULT 0,

    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    BIGINT,                                         -- [FIX-09]
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by    BIGINT,

    CONSTRAINT FK_services_studios    FOREIGN KEY (studio_id)   REFERENCES studios(studio_id),
    CONSTRAINT FK_services_categories FOREIGN KEY (category_id) REFERENCES categories(category_id),
    CONSTRAINT FK_services_hidden_by  FOREIGN KEY (hidden_by)   REFERENCES users(user_id)
);
GO
CREATE INDEX IX_services_studio   ON services(studio_id)   WHERE is_hidden = 0;
CREATE INDEX IX_services_category ON services(category_id) WHERE is_hidden = 0;
CREATE INDEX IX_services_city     ON services(city)        WHERE is_hidden = 0;
GO

-- ================================================================
-- 7. STUDIO PORTFOLIOS                              [FIX-01]
--    *** Moved AFTER services to satisfy FK dependency ***
-- ================================================================
CREATE TABLE studio_portfolios (
    portfolio_id BIGINT       PRIMARY KEY IDENTITY(1,1),
    studio_id    BIGINT       NOT NULL,
    service_id   BIGINT       NULL,           -- NULL = ảnh chung của studio
    image_url    VARCHAR(500) NOT NULL,
    caption      NVARCHAR(255),
    sort_order   INT          NOT NULL DEFAULT 0,
    uploaded_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    uploaded_by  BIGINT,

    CONSTRAINT FK_portfolios_studios  FOREIGN KEY (studio_id)  REFERENCES studios(studio_id),
    CONSTRAINT FK_portfolios_services FOREIGN KEY (service_id) REFERENCES services(service_id),
    CONSTRAINT FK_portfolios_uploader FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);
GO
CREATE INDEX IX_portfolios_studio  ON studio_portfolios(studio_id, sort_order);
CREATE INDEX IX_portfolios_service ON studio_portfolios(service_id) WHERE service_id IS NOT NULL;
GO

-- ================================================================
-- 8. SERVICE IMAGES
-- ================================================================
CREATE TABLE service_images (
    image_id   BIGINT       PRIMARY KEY IDENTITY(1,1),
    service_id BIGINT       NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,

    CONSTRAINT FK_service_images_services FOREIGN KEY (service_id) REFERENCES services(service_id)
);
GO

-- ================================================================
-- 9. PACKAGES                                       [FIX-02,09]
-- ================================================================
CREATE TABLE packages (
    package_id    BIGINT         PRIMARY KEY IDENTITY(1,1),
    service_id    BIGINT         NOT NULL,
    package_name  NVARCHAR(255)  NOT NULL,
    description   NVARCHAR(MAX),
    price         DECIMAL(12,0)  NOT NULL,
    duration_hours INT,
    max_photos    INT,
    inclusions    NVARCHAR(MAX),              -- JSON array of strings

    is_active     BIT            NOT NULL DEFAULT 1,
    sort_order    INT            NOT NULL DEFAULT 0,

    -- Soft delete                            [FIX-02]
    deleted_at    DATETIME2,
    deleted_by    BIGINT,

    -- Audit                                  [FIX-09]
    created_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    BIGINT,
    updated_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by    BIGINT,

    CONSTRAINT FK_packages_services   FOREIGN KEY (service_id) REFERENCES services(service_id),
    CONSTRAINT FK_packages_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id)
);
GO
CREATE INDEX IX_packages_service ON packages(service_id) WHERE deleted_at IS NULL;
CREATE INDEX IX_packages_price   ON packages(price)      WHERE deleted_at IS NULL AND is_active = 1;
GO

-- ================================================================
-- 10. WORKING SCHEDULES (recurring weekly template)
-- ================================================================
CREATE TABLE working_schedules (
    schedule_id BIGINT    PRIMARY KEY IDENTITY(1,1),
    studio_id   BIGINT    NOT NULL,
    -- 0=Sunday … 6=Saturday
    day_of_week TINYINT   NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time   TIME(0)   NOT NULL,
    close_time  TIME(0)   NOT NULL,
    is_active   BIT       NOT NULL DEFAULT 1,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_schedules_studios FOREIGN KEY (studio_id) REFERENCES studios(studio_id),
    CONSTRAINT UQ_schedule_studio_day UNIQUE (studio_id, day_of_week)
);
GO

-- ================================================================
-- 11. WORKING DAYS (specific date overrides)
-- ================================================================
CREATE TABLE working_days (
    working_day_id BIGINT    PRIMARY KEY IDENTITY(1,1),
    studio_id      BIGINT    NOT NULL,
    working_date   DATE      NOT NULL,
    is_available   BIT       NOT NULL DEFAULT 1,
    note           NVARCHAR(255),
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_working_days_studios FOREIGN KEY (studio_id) REFERENCES studios(studio_id),
    CONSTRAINT UQ_working_day UNIQUE (studio_id, working_date)
);
GO
CREATE INDEX IX_working_days_studio_date ON working_days(studio_id, working_date);
GO

-- ================================================================
-- 12. TIME SLOTS
-- ================================================================
CREATE TABLE time_slots (
    slot_id        BIGINT    PRIMARY KEY IDENTITY(1,1),
    working_day_id BIGINT    NOT NULL,
    start_time     TIME(0)   NOT NULL,
    end_time       TIME(0)   NOT NULL,
    -- 'OPEN' | 'HOLDING' | 'BOOKED' | 'CLOSED'
    status         VARCHAR(10) NOT NULL DEFAULT 'OPEN',

    CONSTRAINT FK_time_slots_working_days FOREIGN KEY (working_day_id) REFERENCES working_days(working_day_id),
    CONSTRAINT UQ_slot UNIQUE (working_day_id, start_time)
);
GO
CREATE INDEX IX_slots_day_status ON time_slots(working_day_id, status);
GO

-- ================================================================
-- 13. BOOKING STATUSES (lookup)
-- ================================================================
CREATE TABLE booking_statuses (
    status_id   BIGINT      PRIMARY KEY IDENTITY(1,1),
    status_name VARCHAR(20) NOT NULL UNIQUE
    -- PENDING_PAYMENT | PENDING_CONFIRMATION | CONFIRMED | IN_PROGRESS
    -- DEMO_UPLOADED | EDITING | FINAL_DELIVERED | COMPLETED | CANCELLED | REJECTED
);
GO

-- ================================================================
-- 14. BOOKINGS                                      [FIX-07,08,09]
-- ================================================================
CREATE TABLE bookings (
    booking_id         BIGINT         PRIMARY KEY IDENTITY(1,1),
    customer_id        BIGINT         NOT NULL,
    studio_id          BIGINT         NOT NULL,
    package_id         BIGINT         NOT NULL,    -- service resolved via package
    slot_id            BIGINT         NOT NULL,
    status_id          BIGINT         NOT NULL,

    -- Human-readable code, generated via SEQUENCE    [FIX-08]
    -- Format: BK-YYYYMMDD-{8-digit seq}
    -- e.g.  : BK-20260518-00000042
    booking_code       VARCHAR(25)    NOT NULL UNIQUE,

    shooting_date      DATE           NOT NULL,
    shooting_location  NVARCHAR(500),
    shooting_lat       DECIMAL(10,7),
    shooting_lng       DECIMAL(10,7),
    note               NVARCHAR(MAX),

    -- Financials
    total_price        DECIMAL(12,0)  NOT NULL,
    commission_percent DECIMAL(5,2)   NOT NULL DEFAULT 10,
    commission_amount  DECIMAL(12,0)  NOT NULL DEFAULT 0,
    studio_revenue     DECIMAL(12,0)  NOT NULL DEFAULT 0,
    payment_expires_at DATETIME2,

    -- Lifecycle timestamps
    confirmed_at       DATETIME2,
    rejected_at        DATETIME2,
    reject_reason      NVARCHAR(MAX),
    completed_at       DATETIME2,
    cancelled_at       DATETIME2,
    cancelled_by       BIGINT,
    cancel_reason      NVARCHAR(MAX),

    -- Dispute                                         (UC79)
    disputed_at           DATETIME2,
    dispute_note          NVARCHAR(MAX),
    dispute_resolved_at   DATETIME2,
    dispute_resolved_by   BIGINT,

    -- Audit                                           [FIX-09]
    created_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         BIGINT,
    updated_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         BIGINT,

    CONSTRAINT FK_bookings_customer    FOREIGN KEY (customer_id)        REFERENCES users(user_id),
    CONSTRAINT FK_bookings_studio      FOREIGN KEY (studio_id)          REFERENCES studios(studio_id),
    CONSTRAINT FK_bookings_package     FOREIGN KEY (package_id)         REFERENCES packages(package_id),
    CONSTRAINT FK_bookings_slot        FOREIGN KEY (slot_id)            REFERENCES time_slots(slot_id),
    CONSTRAINT FK_bookings_status      FOREIGN KEY (status_id)          REFERENCES booking_statuses(status_id),
    CONSTRAINT FK_bookings_cancel_by   FOREIGN KEY (cancelled_by)       REFERENCES users(user_id),
    CONSTRAINT FK_bookings_dispute_by  FOREIGN KEY (dispute_resolved_by) REFERENCES users(user_id)
    -- [FIX-07] Unique constraint removed — replaced by filtered index below
    --          to allow slot reuse after CANCELLED / REJECTED bookings.
);
GO
CREATE INDEX IX_bookings_customer ON bookings(customer_id);
CREATE INDEX IX_bookings_studio   ON bookings(studio_id);
CREATE INDEX IX_bookings_status   ON bookings(status_id);
CREATE INDEX IX_bookings_status_expiry
    ON bookings(status_id, payment_expires_at)
    WHERE payment_expires_at IS NOT NULL;
CREATE INDEX IX_bookings_date     ON bookings(shooting_date);
CREATE INDEX IX_bookings_code     ON bookings(booking_code);

-- [FIX-07] Filtered unique index: chỉ enforce 1 booking/slot với trạng thái ACTIVE
-- CANCELLED(6) and REJECTED(7) are not counted, so the slot can be booked again.
-- (status_id: PENDING_PAYMENT=1, PENDING_CONFIRMATION=2, CONFIRMED=3, IN_PROGRESS=4, COMPLETED=5, CANCELLED=6, REJECTED=7, AWAITING_CUSTOMER=8, DEMO_UPLOADED=9, EDITING=10, FINAL_DELIVERED=11)
-- Note: SQL Server filtered index KHÔNG hỗ trợ NOT IN → dùng <> AND <>
CREATE UNIQUE INDEX UX_bookings_slot_active
    ON bookings(slot_id)
    WHERE status_id <> 6 AND status_id <> 7;  -- ignore CANCELLED(6) and REJECTED(7)
GO

-- ================================================================
-- 15. BOOKING LOGS (full audit trail)
-- ================================================================
CREATE TABLE booking_logs (
    log_id      BIGINT        PRIMARY KEY IDENTITY(1,1),
    booking_id  BIGINT        NOT NULL,
    old_status  VARCHAR(20),
    new_status  VARCHAR(20),
    changed_by  BIGINT,
    note        NVARCHAR(MAX),
    changed_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_booking_logs_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT FK_booking_logs_user     FOREIGN KEY (changed_by) REFERENCES users(user_id)
);
GO
CREATE INDEX IX_booking_logs_booking ON booking_logs(booking_id);
GO

-- ================================================================
-- 16. PAYMENT METHODS (lookup)
-- ================================================================
CREATE TABLE payment_methods (
    method_id   BIGINT      PRIMARY KEY IDENTITY(1,1),
    method_name VARCHAR(50) NOT NULL UNIQUE
);
GO

-- ================================================================
-- 17. PAYMENT STATUSES (lookup)
-- ================================================================
CREATE TABLE payment_statuses (
    payment_status_id BIGINT      PRIMARY KEY IDENTITY(1,1),
    status_name       VARCHAR(20) NOT NULL UNIQUE
);
GO

-- ================================================================
-- 18. PAYMENTS                                       [FIX-05]
-- ================================================================
CREATE TABLE payments (
    payment_id        BIGINT         PRIMARY KEY IDENTITY(1,1),
    booking_id        BIGINT         NOT NULL,
    method_id         BIGINT         NOT NULL,
    payment_status_id BIGINT         NOT NULL,
    payment_code      VARCHAR(30)    NOT NULL UNIQUE,
    amount            DECIMAL(12,0)  NOT NULL,
    currency_code     VARCHAR(10)    NOT NULL DEFAULT 'VND',  -- [FIX-05]
    payment_provider  VARCHAR(50)    NOT NULL DEFAULT 'VNPAY_SANDBOX',
    transaction_code  VARCHAR(255),
    provider_ref      VARCHAR(255),
    failure_reason    NVARCHAR(MAX),
    paid_at           DATETIME2,
    refunded_at       DATETIME2,
    refund_reason     NVARCHAR(MAX),
    refund_method     VARCHAR(20)    NULL,
    refund_pending_reason NVARCHAR(255) NULL,
    created_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_payments_bookings FOREIGN KEY (booking_id)        REFERENCES bookings(booking_id),
    CONSTRAINT FK_payments_method   FOREIGN KEY (method_id)         REFERENCES payment_methods(method_id),
    CONSTRAINT FK_payments_status   FOREIGN KEY (payment_status_id) REFERENCES payment_statuses(payment_status_id)
);
GO
CREATE INDEX IX_payments_booking ON payments(booking_id);
CREATE INDEX IX_payments_status  ON payments(payment_status_id);
CREATE INDEX IX_payments_paid    ON payments(paid_at DESC) WHERE paid_at IS NOT NULL;
GO

-- ================================================================
-- 18b. SETTLEMENTS
-- ================================================================
CREATE TABLE settlements (
    settlement_id        BIGINT         PRIMARY KEY IDENTITY(1,1),
    booking_id           BIGINT         NOT NULL,
    studio_id            BIGINT         NOT NULL,
    gross_amount         DECIMAL(12,0)  NOT NULL,
    platform_fee_percent DECIMAL(5,2)   NOT NULL DEFAULT 10,
    platform_fee_amount  DECIMAL(12,0)  NOT NULL DEFAULT 0,
    studio_amount        DECIMAL(12,0)  NOT NULL DEFAULT 0,
    
    -- 'PENDING' | 'READY' | 'PAID' | 'FAILED' | 'CANCELLED'
    status               VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    
    -- 'MANUAL' | 'PAYOS_PAYOUT' | 'BANK_TRANSFER'
    payout_method        VARCHAR(50)    NOT NULL DEFAULT 'MANUAL',
    
    paid_at              DATETIME2      NULL,
    created_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at           DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_settlements_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT FK_settlements_studios FOREIGN KEY (studio_id) REFERENCES studios(studio_id)
);
GO
CREATE INDEX IX_settlements_studio_status ON settlements(studio_id, status);
CREATE UNIQUE INDEX UX_settlements_booking ON settlements(booking_id);
GO

-- ================================================================
-- 18d. WALLETS
-- ================================================================
CREATE TABLE wallets (
    wallet_id    BIGINT        PRIMARY KEY IDENTITY(1,1),
    owner_type   VARCHAR(10)   NOT NULL, -- 'CUSTOMER' | 'STUDIO'
    owner_id     BIGINT        NOT NULL, -- user_id if CUSTOMER, studio_id if STUDIO
    balance      DECIMAL(18,0) NOT NULL DEFAULT 0, -- current balance (VND)
    total_in     DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash credited
    total_out    DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash debited/withdrawn
    created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_wallet_owner UNIQUE (owner_type, owner_id),
    CONSTRAINT CK_wallet_owner_type CHECK (owner_type IN ('CUSTOMER', 'STUDIO'))
);
GO

-- ================================================================
-- 18e. WALLET TRANSACTIONS
-- ================================================================
CREATE TABLE wallet_transactions (
    tx_id         BIGINT        PRIMARY KEY IDENTITY(1,1),
    wallet_id     BIGINT        NOT NULL,
    tx_type       VARCHAR(20)   NOT NULL, -- 'CREDIT_REFUND' | 'CREDIT_EARNING' | 'DEBIT_WITHDRAW'
    amount        DECIMAL(18,0) NOT NULL,
    balance_after DECIMAL(18,0) NOT NULL,
    booking_id    BIGINT        NULL,
    payment_id    BIGINT        NULL,
    description   NVARCHAR(500) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_wallet_transactions_wallets FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    CONSTRAINT FK_wallet_transactions_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT FK_wallet_transactions_payments FOREIGN KEY (payment_id) REFERENCES payments(payment_id),
    CONSTRAINT CK_wallet_tx_type CHECK (tx_type IN ('CREDIT_REFUND', 'CREDIT_EARNING', 'DEBIT_WITHDRAW'))
);
GO
CREATE INDEX IX_wallet_transactions_wallet ON wallet_transactions(wallet_id);
GO

-- ================================================================
-- 18c. PAYOUT REQUESTS
-- ================================================================
CREATE TABLE payout_requests (
    payout_id        BIGINT         PRIMARY KEY IDENTITY(1,1),
    wallet_id        BIGINT         NOT NULL,
    amount           DECIMAL(18,0)  NOT NULL,
    -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED'
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    bank_code        VARCHAR(50)    NOT NULL,
    account_number   VARCHAR(50)    NOT NULL,
    account_name     VARCHAR(100)   NOT NULL,
    description      NVARCHAR(255)  NULL,
    reference_id     VARCHAR(100)   NOT NULL UNIQUE,
    transaction_code VARCHAR(100)   NULL,
    failure_reason   NVARCHAR(500)  NULL,
    created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_payout_requests_wallets FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    CONSTRAINT CK_payout_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FAILED'))
);
GO
CREATE INDEX IX_payout_requests_wallet ON payout_requests(wallet_id);
CREATE INDEX IX_payout_requests_status ON payout_requests(status);
GO

-- ================================================================
-- 19. REVIEWS                                        [FIX-09,11]
--     Only allowed when booking.status = COMPLETED
--     Enforced by trigger trg_reviews_check_completed (see below)
-- ================================================================
CREATE TABLE reviews (
    review_id   BIGINT        PRIMARY KEY IDENTITY(1,1),
    booking_id  BIGINT        NOT NULL UNIQUE,   -- 1 booking = 1 review
    customer_id BIGINT        NOT NULL,
    studio_id   BIGINT        NOT NULL,
    rating      TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     NVARCHAR(MAX),
    is_hidden   BIT           NOT NULL DEFAULT 0,
    hidden_by   BIGINT,
    hidden_at   DATETIME2,
    hidden_note NVARCHAR(500),
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  BIGINT,

    CONSTRAINT FK_reviews_booking   FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id),
    CONSTRAINT FK_reviews_customer  FOREIGN KEY (customer_id) REFERENCES users(user_id),
    CONSTRAINT FK_reviews_studio    FOREIGN KEY (studio_id)   REFERENCES studios(studio_id),
    CONSTRAINT FK_reviews_hidden_by FOREIGN KEY (hidden_by)   REFERENCES users(user_id)
);
GO
CREATE INDEX IX_reviews_studio   ON reviews(studio_id, rating) WHERE is_hidden = 0;
CREATE INDEX IX_reviews_customer ON reviews(customer_id);
GO

-- ================================================================
-- 20. REPORT TYPES (lookup)
-- ================================================================
CREATE TABLE report_types (
    report_type_id BIGINT       PRIMARY KEY IDENTITY(1,1),
    type_name      VARCHAR(50)  NOT NULL UNIQUE
);
GO

-- ================================================================
-- 21. REPORTS
-- ================================================================
CREATE TABLE reports (
    report_id      BIGINT        PRIMARY KEY IDENTITY(1,1),
    report_type_id BIGINT        NOT NULL,
    reporter_id    BIGINT        NOT NULL,
    target_type    VARCHAR(20)   NOT NULL,   -- 'STUDIO'|'BOOKING'|'REVIEW'|'SERVICE'
    target_id      BIGINT        NOT NULL,
    description    NVARCHAR(MAX),
    -- 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    handled_by     BIGINT,
    handler_note   NVARCHAR(MAX),
    resolved_at    DATETIME2,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_reports_type     FOREIGN KEY (report_type_id) REFERENCES report_types(report_type_id),
    CONSTRAINT FK_reports_reporter FOREIGN KEY (reporter_id)    REFERENCES users(user_id),
    CONSTRAINT FK_reports_admin    FOREIGN KEY (handled_by)     REFERENCES users(user_id)
);
GO
CREATE INDEX IX_reports_target ON reports(target_type, target_id);
CREATE INDEX IX_reports_status ON reports(status);
GO

-- ================================================================
-- 22. NOTIFICATIONS                                  [FIX-03]
-- ================================================================
CREATE TABLE notifications (
    notification_id BIGINT        PRIMARY KEY IDENTITY(1,1),
    user_id         BIGINT        NOT NULL,
    -- 'BOOKING_CONFIRMED'|'BOOKING_REJECTED'|'BOOKING_CANCELLED'
    -- 'PAYMENT_SUCCESS'|'PAYMENT_FAILED'|'REVIEW_RECEIVED'
    -- 'REPORT_RESOLVED'|'STUDIO_APPROVED'|'STUDIO_BANNED'|'SYSTEM'
    type            VARCHAR(50)   NOT NULL,
    title           NVARCHAR(255) NOT NULL,
    content         NVARCHAR(MAX),
    -- Optional deep-link reference
    ref_type        VARCHAR(20),     -- 'BOOKING'|'PAYMENT'|'REVIEW'|'STUDIO'
    ref_id          BIGINT,
    is_read         BIT           NOT NULL DEFAULT 0,
    read_at         DATETIME2,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_notifications_users FOREIGN KEY (user_id) REFERENCES users(user_id)
);
GO
CREATE INDEX IX_notifications_user_unread
    ON notifications(user_id, created_at DESC)
    WHERE is_read = 0;
GO

-- ================================================================
-- 23. FAVORITE STUDIOS                               [FIX-04]
-- ================================================================
CREATE TABLE favorite_studios (
    favorite_id BIGINT    PRIMARY KEY IDENTITY(1,1),
    user_id     BIGINT    NOT NULL,
    studio_id   BIGINT    NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_fav_studios_user   FOREIGN KEY (user_id)   REFERENCES users(user_id),
    CONSTRAINT FK_fav_studios_studio FOREIGN KEY (studio_id) REFERENCES studios(studio_id),
    CONSTRAINT UQ_fav_studio         UNIQUE (user_id, studio_id)
);
GO

-- ================================================================
-- 24. FAVORITE SERVICES                              [FIX-04]
-- ================================================================
CREATE TABLE favorite_services (
    favorite_id BIGINT    PRIMARY KEY IDENTITY(1,1),
    user_id     BIGINT    NOT NULL,
    service_id  BIGINT    NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_fav_services_user    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    CONSTRAINT FK_fav_services_service FOREIGN KEY (service_id) REFERENCES services(service_id),
    CONSTRAINT UQ_fav_service          UNIQUE (user_id, service_id)
);
GO

-- ================================================================
-- 25. MESSAGES (customer ↔ studio owner)             [FIX-10]
-- ================================================================
CREATE TABLE conversations (
    conversation_id BIGINT    PRIMARY KEY IDENTITY(1,1),
    customer_id     BIGINT    NOT NULL,
    studio_id       BIGINT    NOT NULL,
    booking_id      BIGINT,              -- optional: linked booking
    last_message_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_conv_customer FOREIGN KEY (customer_id) REFERENCES users(user_id),
    CONSTRAINT FK_conv_studio   FOREIGN KEY (studio_id)   REFERENCES studios(studio_id),
    CONSTRAINT FK_conv_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id)
    -- UQ_conversation đã bỏ để hỗ trợ nhiều thread giữa cùng 1 cặp customer-studio
);
GO
-- Index thường thay thế cho UQ_conversation (vẫn query nhanh)
CREATE INDEX IX_conversations_customer_studio
    ON conversations(customer_id, studio_id);

CREATE TABLE messages (
    message_id      BIGINT        PRIMARY KEY IDENTITY(1,1),
    conversation_id BIGINT        NOT NULL,
    sender_id       BIGINT        NOT NULL,   -- user_id of sender
    content         NVARCHAR(MAX) NOT NULL,
    is_read         BIT           NOT NULL DEFAULT 0,
    read_at         DATETIME2,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_messages_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    CONSTRAINT FK_messages_sender FOREIGN KEY (sender_id)       REFERENCES users(user_id)
);
GO
CREATE INDEX IX_messages_conv ON messages(conversation_id, created_at DESC);
GO

-- ================================================================
-- 26. ANALYTICS EVENTS (tracking interaction events)
-- ================================================================
CREATE TABLE analytics_events (
    event_id     BIGINT        PRIMARY KEY IDENTITY(1,1),
    event_name   VARCHAR(50)   NOT NULL, -- 'VIEW_STUDIO' | 'CLICK_BOOKING' | 'SELECT_PACKAGE'
    page_url     NVARCHAR(255) NOT NULL,
    studio_id    BIGINT        NULL,
    package_id   BIGINT        NULL,
    user_id      BIGINT        NULL,
    created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_analytics_events_studios FOREIGN KEY (studio_id) REFERENCES studios(studio_id),
    CONSTRAINT FK_analytics_events_packages FOREIGN KEY (package_id) REFERENCES packages(package_id),
    CONSTRAINT FK_analytics_events_users FOREIGN KEY (user_id) REFERENCES users(user_id)
);
GO
CREATE INDEX IX_analytics_events_studio_event ON analytics_events(studio_id, event_name);
CREATE INDEX IX_analytics_events_created_at ON analytics_events(created_at);
GO

-- ================================================================
-- VIEWS
-- ================================================================

-- Monthly platform revenue (UC81, UC90)
GO
CREATE VIEW v_monthly_platform_revenue AS
SELECT
    FORMAT(b.completed_at, 'yyyy-MM')  AS month,
    COUNT(b.booking_id)                 AS total_bookings,
    SUM(b.total_price)                  AS gross_revenue,
    SUM(b.commission_amount)            AS platform_commission,
    SUM(b.studio_revenue)               AS studio_payout
FROM bookings b
INNER JOIN booking_statuses bs ON b.status_id = bs.status_id
WHERE bs.status_name = 'COMPLETED'
GROUP BY FORMAT(b.completed_at, 'yyyy-MM');
GO

-- Studio revenue summary (UC60, UC61, UC62)
CREATE VIEW v_studio_revenue AS
SELECT
    s.studio_id,
    s.studio_name,
    s.city,
    s.avg_rating,
    s.total_reviews,
    s.total_bookings,
    COUNT(b.booking_id)      AS completed_bookings,
    SUM(b.total_price)       AS gross_revenue,
    SUM(b.commission_amount) AS commission_deducted,
    SUM(b.studio_revenue)    AS net_revenue
FROM studios s
LEFT JOIN bookings b         ON b.studio_id = s.studio_id
LEFT JOIN booking_statuses bs ON b.status_id = bs.status_id
    AND bs.status_name = 'COMPLETED'
WHERE s.deleted_at IS NULL
GROUP BY s.studio_id, s.studio_name, s.city,
         s.avg_rating, s.total_reviews, s.total_bookings;
GO

-- Top studios (UC92)
-- v_top_studios: bỏ TOP 100 và ORDER BY khỏi View
-- Khi dùng: SELECT TOP 20 * FROM v_top_studios ORDER BY avg_rating DESC, total_bookings DESC
CREATE VIEW v_top_studios AS
SELECT
    s.studio_id,
    s.studio_name,
    s.city,
    s.avg_rating,
    s.total_reviews,
    s.total_bookings
FROM studios s
WHERE s.status = 'APPROVED'
  AND s.deleted_at IS NULL;
GO

-- System-wide stats (UC89, UC91, UC93)
CREATE VIEW v_system_stats AS
SELECT
    (SELECT COUNT(*) FROM users    WHERE status = 'ACTIVE' AND deleted_at IS NULL) AS active_users,
    (SELECT COUNT(*) FROM studios  WHERE status = 'APPROVED' AND deleted_at IS NULL) AS approved_studios,
    (SELECT COUNT(*) FROM studios  WHERE status = 'PENDING'  AND deleted_at IS NULL) AS pending_studios,
    (SELECT COUNT(*) FROM bookings)                                                   AS total_bookings,
    (SELECT ISNULL(SUM(b.commission_amount),0)
     FROM bookings b
     INNER JOIN booking_statuses bs ON b.status_id = bs.status_id
     WHERE bs.status_name = 'COMPLETED')                                              AS total_commission,
    (SELECT COUNT(*) FROM reports WHERE status = 'PENDING')                           AS pending_reports;
GO

-- ================================================================
-- STORED PROCEDURES
-- ================================================================

-- Update studio avg_rating & total_reviews
CREATE OR ALTER PROCEDURE sp_update_studio_rating
    @studio_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE studios
    SET
        avg_rating    = ISNULL(
            (SELECT AVG(CAST(rating AS DECIMAL(3,2)))
             FROM reviews WHERE studio_id = @studio_id AND is_hidden = 0), 0),
        total_reviews = (SELECT COUNT(*) FROM reviews
                         WHERE studio_id = @studio_id AND is_hidden = 0)
    WHERE studio_id = @studio_id;
END;
GO

-- ----------------------------------------------------------------
-- sp_create_booking                                  [FIX-07,08]
--   Uses SEQUENCE for race-condition-safe booking_code.
--   Locks the slot row (UPDLOCK) before checking availability
--   so concurrent requests cannot both see status = 'OPEN'.
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_create_booking
    @customer_id       BIGINT,
    @studio_id         BIGINT,
    @package_id        BIGINT,
    @slot_id           BIGINT,
    @shooting_date     DATE,
    @shooting_location NVARCHAR(500) = NULL,
    @shooting_lat      DECIMAL(10,7) = NULL,
    @shooting_lng      DECIMAL(10,7) = NULL,
    @note              NVARCHAR(MAX) = NULL,
    @total_price       DECIMAL(12,0),
    @commission_pct    DECIMAL(5,2),
    @new_booking_id    BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    -- Lock the slot row to prevent concurrent double-booking  [FIX-07]
    DECLARE @slot_status VARCHAR(10);
    SELECT @slot_status = status
    FROM time_slots WITH (UPDLOCK, ROWLOCK)
    WHERE slot_id = @slot_id;

    IF @slot_status <> 'OPEN'
    BEGIN
        ROLLBACK;
        RAISERROR(N'Slot is no longer available.', 16, 1);
        RETURN;
    END;

    -- Generate booking_code via SEQUENCE                      [FIX-08]
    DECLARE @seq_val    BIGINT = NEXT VALUE FOR seq_booking_code;
    DECLARE @date_part  VARCHAR(8) = CONVERT(VARCHAR(8), GETDATE(), 112);
    DECLARE @booking_code VARCHAR(25) = 'BK-' + @date_part + '-' + RIGHT('00000000' + CAST(@seq_val AS VARCHAR(8)), 8);
    DECLARE @status_pending BIGINT;
    SELECT @status_pending = status_id FROM booking_statuses WHERE status_name = 'PENDING_PAYMENT';

    DECLARE @commission_amount DECIMAL(12,0) = @total_price * @commission_pct / 100;
    DECLARE @studio_revenue    DECIMAL(12,0) = @total_price - @commission_amount;

    INSERT INTO bookings (
        customer_id, studio_id, package_id, slot_id, status_id,
        booking_code, shooting_date, shooting_location, shooting_lat, shooting_lng, note,
        total_price, commission_percent, commission_amount, studio_revenue, payment_expires_at,
        created_by
    )
    VALUES (
        @customer_id, @studio_id, @package_id, @slot_id, @status_pending,
        @booking_code, @shooting_date, @shooting_location, @shooting_lat, @shooting_lng, @note,
        @total_price, @commission_pct, @commission_amount, @studio_revenue, DATEADD(MINUTE, 15, SYSUTCDATETIME()),
        @customer_id
    );

    SET @new_booking_id = SCOPE_IDENTITY();

    -- Mark slot as HOLDING immediately (prevents any 2nd booking even before confirm)
    UPDATE time_slots SET status = 'HOLDING' WHERE slot_id = @slot_id;

    -- Audit log
    INSERT INTO booking_logs (booking_id, old_status, new_status, changed_by, note)
    VALUES (@new_booking_id, NULL, 'PENDING_PAYMENT', @customer_id, N'Booking created');

    COMMIT;
END;
GO

-- ----------------------------------------------------------------
-- sp_confirm_booking
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_confirm_booking
    @booking_id   BIGINT,
    @confirmed_by BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    DECLARE @status_id_confirmed BIGINT;
    DECLARE @old_status VARCHAR(20);

    SELECT @status_id_confirmed = status_id FROM booking_statuses WHERE status_name = 'CONFIRMED';
    SELECT @old_status = bs.status_name
    FROM bookings b
    INNER JOIN booking_statuses bs ON b.status_id = bs.status_id
    WHERE b.booking_id = @booking_id;

    UPDATE bookings
    SET status_id    = @status_id_confirmed,
        confirmed_at = SYSUTCDATETIME(),
        updated_at   = SYSUTCDATETIME(),
        updated_by   = @confirmed_by
    WHERE booking_id = @booking_id;

    INSERT INTO booking_logs (booking_id, old_status, new_status, changed_by, note)
    VALUES (@booking_id, @old_status, 'CONFIRMED', @confirmed_by, N'Studio confirmed');

    COMMIT;
END;
GO

-- ----------------------------------------------------------------
-- sp_cancel_booking  (used by customer / studio owner / admin)
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_cancel_booking
    @booking_id    BIGINT,
    @cancelled_by  BIGINT,
    @cancel_reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    DECLARE @status_id_cancelled BIGINT;
    DECLARE @slot_id BIGINT;
    DECLARE @old_status VARCHAR(20);

    SELECT @status_id_cancelled = status_id FROM booking_statuses WHERE status_name = 'CANCELLED';
    SELECT @slot_id = slot_id, @old_status = bs.status_name
    FROM bookings b
    INNER JOIN booking_statuses bs ON b.status_id = bs.status_id
    WHERE b.booking_id = @booking_id;

    UPDATE bookings
    SET status_id     = @status_id_cancelled,
        cancelled_at  = SYSUTCDATETIME(),
        cancelled_by  = @cancelled_by,
        cancel_reason = @cancel_reason,
        updated_at    = SYSUTCDATETIME(),
        updated_by    = @cancelled_by
    WHERE booking_id = @booking_id;

    -- Free the slot
    UPDATE time_slots SET status = 'OPEN' WHERE slot_id = @slot_id;

    INSERT INTO booking_logs (booking_id, old_status, new_status, changed_by, note)
    VALUES (@booking_id, @old_status, 'CANCELLED', @cancelled_by, @cancel_reason);

    COMMIT;
END;
GO

-- ================================================================
-- TRIGGERS
-- ================================================================

-- ----------------------------------------------------------------
-- trg_bookings_updated_at                           [FIX-06]
--   Guard against recursive trigger with TRIGGER_NESTLEVEL()
-- ----------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_bookings_updated_at
ON bookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;   -- [FIX-06] prevent recursion

    UPDATE bookings
    SET updated_at = SYSUTCDATETIME()
    WHERE booking_id IN (SELECT booking_id FROM inserted);
END;
GO

-- ----------------------------------------------------------------
-- trg_update_studio_total_bookings
-- ----------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_update_studio_total_bookings
ON bookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;   -- [FIX-06]

    DECLARE @status_completed BIGINT;
    SELECT @status_completed = status_id FROM booking_statuses WHERE status_name = 'COMPLETED';

    UPDATE s
    SET total_bookings = (
        SELECT COUNT(*) FROM bookings b2
        WHERE b2.studio_id = s.studio_id AND b2.status_id = @status_completed
    )
    FROM studios s
    WHERE s.studio_id IN (SELECT studio_id FROM inserted);
END;
GO

-- ----------------------------------------------------------------
-- trg_reviews_check_completed                       [FIX-11]
--   Prevent inserting a review unless the booking is COMPLETED
-- ----------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_reviews_check_completed
ON reviews
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN bookings b         ON i.booking_id = b.booking_id
        INNER JOIN booking_statuses bs ON b.status_id  = bs.status_id
        WHERE bs.status_name <> 'COMPLETED'
    )
    BEGIN
        RAISERROR(N'Reviews can only be submitted for COMPLETED bookings.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Auto-update studio rating
    DECLARE @studio_id BIGINT;
    SELECT @studio_id = studio_id FROM inserted;
    EXEC sp_update_studio_rating @studio_id;
END;
GO

-- ----------------------------------------------------------------
-- trg_reviews_update_rating
--   Fire sp_update_studio_rating on UPDATE / DELETE of reviews
-- ----------------------------------------------------------------
CREATE OR ALTER TRIGGER trg_reviews_update_rating
ON reviews
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;   -- [FIX-06]

    DECLARE @studio_id BIGINT;
    SELECT @studio_id = ISNULL(
        (SELECT TOP 1 studio_id FROM inserted),
        (SELECT TOP 1 studio_id FROM deleted)
    );
    IF @studio_id IS NOT NULL
        EXEC sp_update_studio_rating @studio_id;
END;
GO

-- ================================================================
-- 18a. WALLETS
-- ================================================================
CREATE TABLE wallets (
    wallet_id    BIGINT        PRIMARY KEY IDENTITY(1,1),
    owner_type   VARCHAR(10)   NOT NULL, -- 'CUSTOMER' | 'STUDIO'
    owner_id     BIGINT        NOT NULL, -- user_id if CUSTOMER, studio_id if STUDIO
    balance      DECIMAL(18,0) NOT NULL DEFAULT 0, -- current balance (VND)
    total_in     DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash credited
    total_out    DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash debited/withdrawn
    created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_wallet_owner UNIQUE (owner_type, owner_id),
    CONSTRAINT CK_wallet_owner_type CHECK (owner_type IN ('CUSTOMER', 'STUDIO'))
);
GO

-- ================================================================
-- 18b. WALLET TRANSACTIONS
-- ================================================================
CREATE TABLE wallet_transactions (
    tx_id         BIGINT        PRIMARY KEY IDENTITY(1,1),
    wallet_id     BIGINT        NOT NULL,
    tx_type       VARCHAR(20)   NOT NULL, -- 'CREDIT_REFUND' | 'CREDIT_EARNING' | 'DEBIT_WITHDRAW'
    amount        DECIMAL(18,0) NOT NULL,
    balance_after DECIMAL(18,0) NOT NULL,
    booking_id    BIGINT        NULL,
    payment_id    BIGINT        NULL,
    description   NVARCHAR(500) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_wallet_transactions_wallets FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    CONSTRAINT FK_wallet_transactions_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT FK_wallet_transactions_payments FOREIGN KEY (payment_id) REFERENCES payments(payment_id),
    CONSTRAINT CK_wallet_tx_type CHECK (tx_type IN ('CREDIT_REFUND', 'CREDIT_EARNING', 'DEBIT_WITHDRAW'))
);
GO

CREATE INDEX IX_wallet_transactions_wallet ON wallet_transactions(wallet_id);
GO

-- ================================================================
-- 18c. PAYOUT REQUESTS
-- ================================================================
CREATE TABLE payout_requests (
    payout_id        BIGINT         PRIMARY KEY IDENTITY(1,1),
    wallet_id        BIGINT         NOT NULL,
    amount           DECIMAL(18,0)  NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED'
    bank_code        VARCHAR(50)    NOT NULL, -- ví dụ: 'ICB', 'VCB', 'ACB'...
    account_number   VARCHAR(50)    NOT NULL,
    account_name     VARCHAR(100)   NOT NULL, -- Sẽ luôn là Tên của User được chuẩn hóa viết hoa không dấu
    description      NVARCHAR(255)  NULL,
    reference_id     VARCHAR(100)   NOT NULL UNIQUE, -- Mã tham chiếu duy nhất gửi lên PayOS
    transaction_code VARCHAR(100)   NULL, -- Mã giao dịch PayOS trả về
    failure_reason   NVARCHAR(500)  NULL,
    created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_payout_requests_wallets FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    CONSTRAINT CK_payout_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FAILED'))
);
GO

CREATE INDEX IX_payout_requests_wallet ON payout_requests(wallet_id);
CREATE INDEX IX_payout_requests_status ON payout_requests(status);
GO

-- ================================================================
-- SEED DATA
-- ================================================================

INSERT INTO roles (role_name, description) VALUES
('ADMIN',        N'Quản trị viên hệ thống'),
('CUSTOMER',     N'Khách hàng đặt lịch chụp ảnh'),
('STUDIO_OWNER', N'Chủ studio cung cấp dịch vụ');

SET IDENTITY_INSERT booking_statuses ON;
INSERT INTO booking_statuses (status_id, status_name) VALUES
(1, 'PENDING_PAYMENT'),
(2, 'PENDING_CONFIRMATION'),
(3, 'CONFIRMED'),
(4, 'IN_PROGRESS'),
(5, 'COMPLETED'),
(6, 'CANCELLED'),
(7, 'REJECTED'),
(8, 'AWAITING_CUSTOMER'),
(9, 'DEMO_UPLOADED'),
(10, 'EDITING'),
(11, 'FINAL_DELIVERED');
SET IDENTITY_INSERT booking_statuses OFF;

INSERT INTO payment_methods (method_name) VALUES
('VNPAY'), ('MOMO'), ('CASH'), ('BANK_TRANSFER'), ('PAYPAL');

INSERT INTO payment_statuses (status_name) VALUES
('PENDING'),
('PAID'),
('FAILED'),
('REFUND_PENDING'),
('REFUNDED'),
('DISPUTED');

INSERT INTO report_types (type_name) VALUES
('STUDIO_REPORT'), ('BOOKING_ISSUE'), ('SPAM'),
('FRAUD'), ('INAPPROPRIATE_CONTENT');

INSERT INTO categories (category_name, description, sort_order) VALUES
(N'Chụp ảnh cưới',       N'Wedding photography',     1),
(N'Chụp ảnh cặp đôi',    N'Couple photography',      2),
(N'Chụp ảnh gia đình',   N'Family photography',      3),
(N'Chụp ảnh sự kiện',    N'Event photography',       4),
(N'Chụp ảnh chân dung',  N'Portrait photography',    5),
(N'Chụp ảnh thời trang', N'Fashion photography',     6),
(N'Chụp ảnh trẻ em',     N'Children photography',    7),
(N'Chụp ảnh sản phẩm',   N'Product photography',     8),
(N'Chụp ảnh tốt nghiệp', N'Graduation photography',  9),
(N'Chụp ảnh ngoại cảnh', N'Outdoor photography',    10);

GO
PRINT N'================================================================';
PRINT N'PhotoStudioBooking v3.0 — created successfully';
PRINT N'28 tables | 4 views | 4 stored procedures | 4 triggers';
PRINT N'SEQUENCE seq_booking_code registered';
PRINT N'All 12 production fixes + Wallet & Payout systems applied';
PRINT N'================================================================';
GO
