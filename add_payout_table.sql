-- ================================================================
-- ADD PAYOUT REQUESTS TABLE FOR PAYOS DIRECT PAYOUT SYSTEM
-- Platform: SQL Server 2019+ (T-SQL)
-- ================================================================

USE PhotoStudioBooking;
GO

-- ================================================================
-- 1. Create PAYOUT_REQUESTS table
-- ================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[payout_requests]') AND type in (N'U'))
BEGIN
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

    CREATE INDEX IX_payout_requests_wallet ON payout_requests(wallet_id);
    CREATE INDEX IX_payout_requests_status ON payout_requests(status);

    PRINT N'Table payout_requests created successfully.';
END
ELSE
BEGIN
    PRINT N'Table payout_requests already exists.';
END
GO
