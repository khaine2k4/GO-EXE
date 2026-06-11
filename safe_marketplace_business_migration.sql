/*
   Safe additive migration for marketplace business hardening.
   - Does not drop tables.
   - Does not delete existing data.
   - Stops before creating unique indexes if duplicate wallet transactions already exist.
*/

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

IF COL_LENGTH('dbo.wallet_transactions', 'is_idempotency_exempt') IS NULL
BEGIN
    ALTER TABLE dbo.wallet_transactions
    ADD is_idempotency_exempt BIT NOT NULL
        CONSTRAINT DF_wallet_transactions_idempotency_exempt DEFAULT (0);
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_wallet_tx_type'
      AND parent_object_id = OBJECT_ID('dbo.wallet_transactions')
      AND definition NOT LIKE '%DEBIT_CORRECTION%'
)
BEGIN
    ALTER TABLE dbo.wallet_transactions DROP CONSTRAINT CK_wallet_tx_type;
    ALTER TABLE dbo.wallet_transactions WITH CHECK
    ADD CONSTRAINT CK_wallet_tx_type
    CHECK (tx_type IN ('CREDIT_REFUND','CREDIT_EARNING','DEBIT_WITHDRAW','DEBIT_CORRECTION'));
END
GO

IF EXISTS (
    SELECT 1
    FROM dbo.wallet_transactions
    WHERE booking_id IS NOT NULL
      AND is_idempotency_exempt = 0
    GROUP BY wallet_id, tx_type, booking_id
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 51001, 'Duplicate booking wallet transactions exist. Resolve duplicates before creating idempotency index.', 1;
END
GO

IF EXISTS (
    SELECT 1
    FROM dbo.wallet_transactions
    WHERE payment_id IS NOT NULL
      AND is_idempotency_exempt = 0
    GROUP BY wallet_id, tx_type, payment_id
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 51002, 'Duplicate payment wallet transactions exist. Resolve duplicates before creating idempotency index.', 1;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_wallet_transactions_idempotency_booking'
      AND object_id = OBJECT_ID('dbo.wallet_transactions')
)
BEGIN
    CREATE UNIQUE INDEX UX_wallet_transactions_idempotency_booking
    ON dbo.wallet_transactions(wallet_id, tx_type, booking_id)
    WHERE booking_id IS NOT NULL
      AND is_idempotency_exempt = 0;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_wallet_transactions_idempotency_payment'
      AND object_id = OBJECT_ID('dbo.wallet_transactions')
)
BEGIN
    CREATE UNIQUE INDEX UX_wallet_transactions_idempotency_payment
    ON dbo.wallet_transactions(wallet_id, tx_type, payment_id)
    WHERE payment_id IS NOT NULL
      AND is_idempotency_exempt = 0;
END
GO

IF COL_LENGTH('dbo.bookings', 'package_name_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD package_name_snapshot NVARCHAR(255) NULL;
END
ELSE IF COL_LENGTH('dbo.bookings', 'package_name_snapshot') < 510
BEGIN
    ALTER TABLE dbo.bookings ALTER COLUMN package_name_snapshot NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'service_name_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD service_name_snapshot NVARCHAR(255) NULL;
END
ELSE IF COL_LENGTH('dbo.bookings', 'service_name_snapshot') < 510
BEGIN
    ALTER TABLE dbo.bookings ALTER COLUMN service_name_snapshot NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'package_description_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD package_description_snapshot NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'package_duration_hours_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD package_duration_hours_snapshot INT NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'package_max_photos_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD package_max_photos_snapshot INT NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'package_inclusions_snapshot') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD package_inclusions_snapshot NVARCHAR(MAX) NULL;
END
GO

UPDATE b
SET
    package_name_snapshot = COALESCE(b.package_name_snapshot, p.package_name),
    service_name_snapshot = COALESCE(b.service_name_snapshot, s.service_name),
    package_description_snapshot = COALESCE(b.package_description_snapshot, p.description),
    package_duration_hours_snapshot = COALESCE(b.package_duration_hours_snapshot, p.duration_hours),
    package_max_photos_snapshot = COALESCE(b.package_max_photos_snapshot, p.max_photos),
    package_inclusions_snapshot = COALESCE(b.package_inclusions_snapshot, p.inclusions)
FROM dbo.bookings b
JOIN dbo.packages p ON p.package_id = b.package_id
JOIN dbo.services s ON s.service_id = p.service_id
WHERE b.package_name_snapshot IS NULL
   OR b.service_name_snapshot IS NULL
   OR b.package_description_snapshot IS NULL
   OR b.package_duration_hours_snapshot IS NULL
   OR b.package_max_photos_snapshot IS NULL
   OR b.package_inclusions_snapshot IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.payment_statuses WHERE status_name = 'PARTIALLY_REFUNDED')
BEGIN
    INSERT INTO dbo.payment_statuses(status_name) VALUES ('PARTIALLY_REFUNDED');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.payment_statuses WHERE status_name = 'FORFEITED')
BEGIN
    INSERT INTO dbo.payment_statuses(status_name) VALUES ('FORFEITED');
END
GO

IF COL_LENGTH('dbo.payments', 'refund_amount') IS NULL
BEGIN
    ALTER TABLE dbo.payments ADD refund_amount DECIMAL(12, 0) NULL;
END
GO

IF COL_LENGTH('dbo.payments', 'retained_amount') IS NULL
BEGIN
    ALTER TABLE dbo.payments ADD retained_amount DECIMAL(12, 0) NULL;
END
GO

IF COL_LENGTH('dbo.payments', 'studio_compensation_amount') IS NULL
BEGIN
    ALTER TABLE dbo.payments ADD studio_compensation_amount DECIMAL(12, 0) NULL;
END
GO

IF COL_LENGTH('dbo.payments', 'policy_code') IS NULL
BEGIN
    ALTER TABLE dbo.payments ADD policy_code VARCHAR(80) NULL;
END
GO

IF COL_LENGTH('dbo.payments', 'policy_note') IS NULL
BEGIN
    ALTER TABLE dbo.payments ADD policy_note NVARCHAR(MAX) NULL;
END
GO
