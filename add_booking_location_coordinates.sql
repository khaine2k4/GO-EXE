IF COL_LENGTH('dbo.bookings', 'shooting_lat') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD shooting_lat DECIMAL(10,7) NULL;
END;
GO

IF COL_LENGTH('dbo.bookings', 'shooting_lng') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD shooting_lng DECIMAL(10,7) NULL;
END;
GO
