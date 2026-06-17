-- ============================================================
-- Migration: Add page_views table for web analytics tracking
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'page_views')
BEGIN
    CREATE TABLE [dbo].[page_views] (
        [view_id]     BIGINT IDENTITY(1,1) NOT NULL,
        [page_path]   NVARCHAR(500)        NOT NULL,
        [user_id]     BIGINT               NULL,
        [session_id]  VARCHAR(100)         NOT NULL,
        [user_agent]  NVARCHAR(500)        NULL,
        [referrer]    NVARCHAR(500)        NULL,
        [created_at]  DATETIME2            NOT NULL DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT [PK_page_views] PRIMARY KEY CLUSTERED ([view_id] ASC),
        CONSTRAINT [FK_page_views_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([user_id])
    );

    CREATE NONCLUSTERED INDEX [IX_page_views_created_at]
        ON [dbo].[page_views] ([created_at] DESC);

    CREATE NONCLUSTERED INDEX [IX_page_views_page_path]
        ON [dbo].[page_views] ([page_path]);

    CREATE NONCLUSTERED INDEX [IX_page_views_session]
        ON [dbo].[page_views] ([session_id]);

    PRINT 'Created table page_views with indexes.';
END
ELSE
BEGIN
    PRINT 'Table page_views already exists. Skipping.';
END
GO
