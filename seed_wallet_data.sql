-- ================================================================
-- SEED SAMPLE WALLET DATA FOR TESTING
-- ================================================================

USE PhotoStudioBooking;
GO

-- 1. Seed Wallet and Transactions for Studio Owner Hùng (User ID: 2, Studio ID: 1)
IF NOT EXISTS (SELECT 1 FROM wallets WHERE owner_type = 'STUDIO' AND owner_id = 1)
BEGIN
    INSERT INTO wallets (owner_type, owner_id, balance, total_in, total_out, created_at, updated_at)
    VALUES ('STUDIO', 1, 4500000, 4500000, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @studio_wallet_id BIGINT = SCOPE_IDENTITY();

    -- Insert sample transactions for Hùng
    INSERT INTO wallet_transactions (wallet_id, tx_type, amount, balance_after, booking_id, description, created_at)
    VALUES 
    (@studio_wallet_id, 'CREDIT_EARNING', 2500000, 2500000, NULL, N'Nhận tiền thanh toán hoàn tất cho Booking #BK-9382-A', DATEADD(DAY, -2, SYSUTCDATETIME())),
    (@studio_wallet_id, 'CREDIT_EARNING', 2000000, 4500000, NULL, N'Nhận tiền thanh toán hoàn tất cho Booking #BK-4829-B', DATEADD(DAY, -1, SYSUTCDATETIME()));
    
    PRINT N'Seeded Studio Owner Hung wallet data successfully.';
END
ELSE
BEGIN
    PRINT N'Wallet for Studio 1 already exists.';
END
GO

-- 2. Seed Wallet and Transactions for Customer Đỗ Quốc Huy (User ID: 6)
IF NOT EXISTS (SELECT 1 FROM wallets WHERE owner_type = 'CUSTOMER' AND owner_id = 6)
BEGIN
    INSERT INTO wallets (owner_type, owner_id, balance, total_in, total_out, created_at, updated_at)
    VALUES ('CUSTOMER', 6, 1500000, 1500000, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @cust_wallet_id BIGINT = SCOPE_IDENTITY();

    -- Insert sample transactions for Huy
    INSERT INTO wallet_transactions (wallet_id, tx_type, amount, balance_after, booking_id, description, created_at)
    VALUES 
    (@cust_wallet_id, 'CREDIT_REFUND', 1500000, 1500000, NULL, N'Hoàn tiền cọc thành công cho Booking bị từ chối #BK-1029-X', DATEADD(DAY, -1, SYSUTCDATETIME()));

    PRINT N'Seeded Customer Huy wallet data successfully.';
END
ELSE
BEGIN
    PRINT N'Wallet for User 6 already exists.';
END
GO
