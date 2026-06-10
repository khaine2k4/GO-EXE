IF COL_LENGTH('dbo.bookings', 'dispute_created_by') IS NULL
BEGIN
    ALTER TABLE dbo.bookings
    ADD dispute_created_by BIGINT NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'dispute_created_by_role') IS NULL
BEGIN
    ALTER TABLE dbo.bookings
    ADD dispute_created_by_role NVARCHAR(50) NULL;
END
GO

IF COL_LENGTH('dbo.bookings', 'dispute_created_by') IS NOT NULL
   AND OBJECT_ID('dbo.users', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = 'FK_bookings_dispute_created_by'
         AND parent_object_id = OBJECT_ID('dbo.bookings')
   )
BEGIN
    ALTER TABLE dbo.bookings
    ADD CONSTRAINT FK_bookings_dispute_created_by
    FOREIGN KEY (dispute_created_by) REFERENCES dbo.users(user_id);
END
GO

