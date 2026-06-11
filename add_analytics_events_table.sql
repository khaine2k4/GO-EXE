-- ================================================================
-- ADD ANALYTICS EVENTS TABLE FOR TRACKING INTERACTION EVENTS
-- Platform: SQL Server 2019+ (T-SQL)
-- ================================================================

USE PhotoStudioBooking;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[analytics_events]') AND type in (N'U'))
BEGIN
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

    CREATE INDEX IX_analytics_events_studio_event ON analytics_events(studio_id, event_name);
    CREATE INDEX IX_analytics_events_created_at ON analytics_events(created_at);
END
GO
