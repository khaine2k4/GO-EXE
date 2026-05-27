-- ================================================================
-- ADD WALLET AND WALLET TRANSACTIONS TABLES FOR WALLET SYSTEM
-- Platform: SQL Server 2019+ (T-SQL)
-- ================================================================

USE PhotoStudioBooking;
GO

-- ================================================================
-- 1. Create WALLETS table
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[wallets]') AND type in (N'U'))
BEGIN
    CREATE TABLE wallets (
        wallet_id    BIGINT        PRIMARY KEY IDENTITY(1,1),
        owner_type   VARCHAR(10)   NOT NULL, -- 'CUSTOMER' | 'STUDIO'
        owner_id     BIGINT        NOT NULL, -- user_id if CUSTOMER, studio_id if STUDIO
        balance      DECIMAL(18,0) NOT NULL DEFAULT 0, -- current balance (VND)
        total_in     DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash credited
        total_out    DECIMAL(18,0) NOT NULL DEFAULT 0, -- total cash debited/withdrawn
        created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- Unique constraint to prevent duplicate wallets for the same owner
    ALTER TABLE wallets ADD CONSTRAINT UQ_wallet_owner UNIQUE (owner_type, owner_id);

    -- Check constraint for valid owner_type
    ALTER TABLE wallets ADD CONSTRAINT CK_wallet_owner_type CHECK (owner_type IN ('CUSTOMER', 'STUDIO'));
END
GO

-- ================================================================
-- 2. Create WALLET_TRANSACTIONS table
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[wallet_transactions]') AND type in (N'U'))
BEGIN
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

    CREATE INDEX IX_wallet_transactions_wallet ON wallet_transactions(wallet_id);
END
GO
