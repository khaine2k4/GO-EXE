/*
   Repairs existing duplicate wallet credits without deleting audit history.
   - Adds an idempotency-exempt flag for old duplicate rows.
   - Marks duplicate rows after the first row in each idempotency group as exempt.
   - Adds DEBIT_CORRECTION transactions for extra CREDIT_EARNING/CREDIT_REFUND rows.
   - Creates filtered unique indexes for future protection.
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

IF OBJECT_ID('tempdb..#duplicate_wallet_tx') IS NOT NULL DROP TABLE #duplicate_wallet_tx;
GO

WITH duplicated_booking_tx AS (
    SELECT
        tx_id,
        wallet_id,
        tx_type,
        booking_id,
        payment_id,
        amount,
        ROW_NUMBER() OVER (
            PARTITION BY wallet_id, tx_type, booking_id
            ORDER BY created_at, tx_id
        ) AS rn
    FROM dbo.wallet_transactions
    WHERE booking_id IS NOT NULL
      AND is_idempotency_exempt = 0
),
duplicated_payment_tx AS (
    SELECT
        tx_id,
        wallet_id,
        tx_type,
        booking_id,
        payment_id,
        amount,
        ROW_NUMBER() OVER (
            PARTITION BY wallet_id, tx_type, payment_id
            ORDER BY created_at, tx_id
        ) AS rn
    FROM dbo.wallet_transactions
    WHERE payment_id IS NOT NULL
      AND is_idempotency_exempt = 0
)
SELECT DISTINCT tx_id, wallet_id, tx_type, booking_id, payment_id, amount
INTO #duplicate_wallet_tx
FROM (
    SELECT tx_id, wallet_id, tx_type, booking_id, payment_id, amount
    FROM duplicated_booking_tx
    WHERE rn > 1
    UNION ALL
    SELECT tx_id, wallet_id, tx_type, booking_id, payment_id, amount
    FROM duplicated_payment_tx
    WHERE rn > 1
) d;
GO

UPDATE wt
SET is_idempotency_exempt = 1
FROM dbo.wallet_transactions wt
JOIN #duplicate_wallet_tx d ON d.tx_id = wt.tx_id;
GO

DECLARE correction_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT tx_id, wallet_id, tx_type, booking_id, payment_id, amount
    FROM #duplicate_wallet_tx
    WHERE tx_type IN ('CREDIT_EARNING', 'CREDIT_REFUND')
    ORDER BY tx_id;

DECLARE
    @tx_id BIGINT,
    @wallet_id BIGINT,
    @tx_type NVARCHAR(50),
    @booking_id BIGINT,
    @payment_id BIGINT,
    @amount DECIMAL(18, 2),
    @balance_after DECIMAL(18, 2);

OPEN correction_cursor;
FETCH NEXT FROM correction_cursor INTO @tx_id, @wallet_id, @tx_type, @booking_id, @payment_id, @amount;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.wallet_transactions
        WHERE tx_type = 'DEBIT_CORRECTION'
          AND booking_id = @booking_id
          AND ISNULL(payment_id, -1) = ISNULL(@payment_id, -1)
          AND description LIKE '%duplicate tx_id ' + CAST(@tx_id AS NVARCHAR(30)) + '%'
    )
    BEGIN
        UPDATE dbo.wallets
        SET
            balance = balance - @amount,
            total_out = total_out + @amount,
            updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @wallet_id;

        SELECT @balance_after = balance
        FROM dbo.wallets
        WHERE wallet_id = @wallet_id;

        INSERT INTO dbo.wallet_transactions (
            wallet_id,
            tx_type,
            amount,
            balance_after,
            booking_id,
            payment_id,
            description,
            created_at,
            is_idempotency_exempt
        )
        VALUES (
            @wallet_id,
            'DEBIT_CORRECTION',
            @amount,
            @balance_after,
            @booking_id,
            @payment_id,
            'Correction for duplicate tx_id ' + CAST(@tx_id AS NVARCHAR(30)) + ' (' + @tx_type + ')',
            SYSUTCDATETIME(),
            1
        );
    END

    FETCH NEXT FROM correction_cursor INTO @tx_id, @wallet_id, @tx_type, @booking_id, @payment_id, @amount;
END

CLOSE correction_cursor;
DEALLOCATE correction_cursor;
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

IF OBJECT_ID('tempdb..#duplicate_wallet_tx') IS NOT NULL DROP TABLE #duplicate_wallet_tx;
GO
