using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace exe201.Server.Models;

public partial class PhotoStudioBookingContext : DbContext
{
    public PhotoStudioBookingContext()
    {
    }

    public PhotoStudioBookingContext(DbContextOptions<PhotoStudioBookingContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<BookingLog> BookingLogs { get; set; }

    public virtual DbSet<BookingStatus> BookingStatuses { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Conversation> Conversations { get; set; }

    public virtual DbSet<FavoriteService> FavoriteServices { get; set; }

    public virtual DbSet<FavoriteStudio> FavoriteStudios { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Package> Packages { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }

    public virtual DbSet<PaymentStatus> PaymentStatuses { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<ReportType> ReportTypes { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Service> Services { get; set; }

    public virtual DbSet<ServiceImage> ServiceImages { get; set; }

    public virtual DbSet<Settlement> Settlements { get; set; }

    public virtual DbSet<Studio> Studios { get; set; }

    public virtual DbSet<StudioPortfolio> StudioPortfolios { get; set; }

    public virtual DbSet<TimeSlot> TimeSlots { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserAddress> UserAddresses { get; set; }

    public virtual DbSet<Wallet> Wallets { get; set; }

    public virtual DbSet<WalletTransaction> WalletTransactions { get; set; }

    public virtual DbSet<PayoutRequest> PayoutRequests { get; set; }

    public virtual DbSet<VMonthlyPlatformRevenue> VMonthlyPlatformRevenues { get; set; }

    public virtual DbSet<VStudioRevenue> VStudioRevenues { get; set; }

    public virtual DbSet<VSystemStat> VSystemStats { get; set; }

    public virtual DbSet<VTopStudio> VTopStudios { get; set; }

    public virtual DbSet<WorkingDay> WorkingDays { get; set; }

    public virtual DbSet<WorkingSchedule> WorkingSchedules { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (optionsBuilder.IsConfigured)
        {
            return;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build();

        optionsBuilder.UseSqlServer(
            configuration.GetConnectionString("DefaultConnection"));
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseCollation("Vietnamese_CI_AS");

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId).HasName("PK__bookings__5DE3A5B170B5E511");

            entity.ToTable("bookings", tb =>
                {
                    tb.HasTrigger("trg_bookings_updated_at");
                    tb.HasTrigger("trg_update_studio_total_bookings");
                });

            entity.HasIndex(e => e.BookingCode, "IX_bookings_code");

            entity.HasIndex(e => e.CustomerId, "IX_bookings_customer");

            entity.HasIndex(e => e.ShootingDate, "IX_bookings_date");

            entity.HasIndex(e => e.StatusId, "IX_bookings_status");

            entity.HasIndex(e => new { e.StatusId, e.PaymentExpiresAt }, "IX_bookings_status_expiry")
                .HasFilter("([payment_expires_at] IS NOT NULL)");

            entity.HasIndex(e => e.StudioId, "IX_bookings_studio");

            entity.HasIndex(e => e.BookingCode, "UQ__bookings__FF29040F50FEF837").IsUnique();

            entity.HasIndex(e => e.SlotId, "UX_bookings_slot_active")
                .IsUnique()
                .HasFilter("([status_id]<>(6) AND [status_id]<>(7))");

            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.BookingCode)
                .HasMaxLength(25)
                .IsUnicode(false)
                .HasColumnName("booking_code");
            entity.Property(e => e.CancelReason).HasColumnName("cancel_reason");
            entity.Property(e => e.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(e => e.CancelledBy).HasColumnName("cancelled_by");
            entity.Property(e => e.CommissionAmount)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("commission_amount");
            entity.Property(e => e.CommissionPercent)
                .HasDefaultValue(10m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("commission_percent");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.DisputeCreatedBy).HasColumnName("dispute_created_by");
            entity.Property(e => e.DisputeCreatedByRole)
                .HasMaxLength(50)
                .HasColumnName("dispute_created_by_role");
            entity.Property(e => e.DisputeNote).HasColumnName("dispute_note");
            entity.Property(e => e.DisputeResolvedAt).HasColumnName("dispute_resolved_at");
            entity.Property(e => e.DisputeResolvedBy).HasColumnName("dispute_resolved_by");
            entity.Property(e => e.DisputedAt).HasColumnName("disputed_at");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.PackageId).HasColumnName("package_id");
            entity.Property(e => e.PackageDescriptionSnapshot).HasColumnName("package_description_snapshot");
            entity.Property(e => e.PackageDurationHoursSnapshot).HasColumnName("package_duration_hours_snapshot");
            entity.Property(e => e.PackageInclusionsSnapshot).HasColumnName("package_inclusions_snapshot");
            entity.Property(e => e.PackageMaxPhotosSnapshot).HasColumnName("package_max_photos_snapshot");
            entity.Property(e => e.PackageNameSnapshot)
                .HasMaxLength(255)
                .HasColumnName("package_name_snapshot");
            entity.Property(e => e.PaymentExpiresAt).HasColumnName("payment_expires_at");
            entity.Property(e => e.RejectReason).HasColumnName("reject_reason");
            entity.Property(e => e.RejectedAt).HasColumnName("rejected_at");
            entity.Property(e => e.ServiceNameSnapshot)
                .HasMaxLength(255)
                .HasColumnName("service_name_snapshot");
            entity.Property(e => e.ShootingDate).HasColumnName("shooting_date");
            entity.Property(e => e.ShootingLocation)
                .HasMaxLength(500)
                .HasColumnName("shooting_location");
            entity.Property(e => e.ShootingLat)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("shooting_lat");
            entity.Property(e => e.ShootingLng)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("shooting_lng");
            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.StatusId).HasColumnName("status_id");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.StudioRevenue)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("studio_revenue");
            entity.Property(e => e.TotalPrice)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("total_price");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CancelledByNavigation).WithMany(p => p.BookingCancelledByNavigations)
                .HasForeignKey(d => d.CancelledBy)
                .HasConstraintName("FK_bookings_cancel_by");

            entity.HasOne(d => d.Customer).WithMany(p => p.BookingCustomers)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_bookings_customer");

            entity.HasOne(d => d.DisputeCreatedByNavigation).WithMany(p => p.BookingDisputeCreatedByNavigations)
                .HasForeignKey(d => d.DisputeCreatedBy)
                .HasConstraintName("FK_bookings_dispute_created_by");

            entity.HasOne(d => d.DisputeResolvedByNavigation).WithMany(p => p.BookingDisputeResolvedByNavigations)
                .HasForeignKey(d => d.DisputeResolvedBy)
                .HasConstraintName("FK_bookings_dispute_by");

            entity.HasOne(d => d.Package).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.PackageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_bookings_package");

            entity.HasOne(d => d.Slot).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.SlotId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_bookings_slot");

            entity.HasOne(d => d.Status).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_bookings_status");

            entity.HasOne(d => d.Studio).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_bookings_studio");
        });

        modelBuilder.Entity<BookingLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__booking___9E2397E0237DBFD4");

            entity.ToTable("booking_logs");

            entity.HasIndex(e => e.BookingId, "IX_booking_logs_booking");

            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.ChangedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("changed_at");
            entity.Property(e => e.ChangedBy).HasColumnName("changed_by");
            entity.Property(e => e.NewStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("new_status");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.OldStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("old_status");

            entity.HasOne(d => d.Booking).WithMany(p => p.BookingLogs)
                .HasForeignKey(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_booking_logs_bookings");

            entity.HasOne(d => d.ChangedByNavigation).WithMany(p => p.BookingLogs)
                .HasForeignKey(d => d.ChangedBy)
                .HasConstraintName("FK_booking_logs_user");
        });

        modelBuilder.Entity<BookingStatus>(entity =>
        {
            entity.HasKey(e => e.StatusId).HasName("PK__booking___3683B531342CE843");

            entity.ToTable("booking_statuses");

            entity.HasIndex(e => e.StatusName, "UQ__booking___501B3753ACED2436").IsUnique();

            entity.Property(e => e.StatusId).HasColumnName("status_id");
            entity.Property(e => e.StatusName)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_name");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__categori__D54EE9B4BB93912B");

            entity.ToTable("categories");

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(255)
                .HasColumnName("category_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IconUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("icon_url");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.ConversationId).HasName("PK__conversa__311E7E9AC48A05D3");

            entity.ToTable("conversations");

            entity.HasIndex(e => new { e.CustomerId, e.StudioId }, "IX_conversations_customer_studio");

            entity.Property(e => e.ConversationId).HasColumnName("conversation_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.LastMessageAt).HasColumnName("last_message_at");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");

            entity.HasOne(d => d.Booking).WithMany(p => p.Conversations)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_conv_booking");

            entity.HasOne(d => d.Customer).WithMany(p => p.Conversations)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_conv_customer");

            entity.HasOne(d => d.Studio).WithMany(p => p.Conversations)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_conv_studio");
        });

        modelBuilder.Entity<FavoriteService>(entity =>
        {
            entity.HasKey(e => e.FavoriteId).HasName("PK__favorite__46ACF4CBF1EE7D81");

            entity.ToTable("favorite_services");

            entity.HasIndex(e => new { e.UserId, e.ServiceId }, "UQ_fav_service").IsUnique();

            entity.Property(e => e.FavoriteId).HasColumnName("favorite_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Service).WithMany(p => p.FavoriteServices)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fav_services_service");

            entity.HasOne(d => d.User).WithMany(p => p.FavoriteServices)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fav_services_user");
        });

        modelBuilder.Entity<FavoriteStudio>(entity =>
        {
            entity.HasKey(e => e.FavoriteId).HasName("PK__favorite__46ACF4CB0789CE8E");

            entity.ToTable("favorite_studios");

            entity.HasIndex(e => new { e.UserId, e.StudioId }, "UQ_fav_studio").IsUnique();

            entity.Property(e => e.FavoriteId).HasColumnName("favorite_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Studio).WithMany(p => p.FavoriteStudios)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fav_studios_studio");

            entity.HasOne(d => d.User).WithMany(p => p.FavoriteStudios)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_fav_studios_user");
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.MessageId).HasName("PK__messages__0BBF6EE6D9EBB137");

            entity.ToTable("messages");

            entity.HasIndex(e => new { e.ConversationId, e.CreatedAt }, "IX_messages_conv").IsDescending(false, true);

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.ConversationId).HasColumnName("conversation_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.ReadAt).HasColumnName("read_at");
            entity.Property(e => e.SenderId).HasColumnName("sender_id");

            entity.HasOne(d => d.Conversation).WithMany(p => p.Messages)
                .HasForeignKey(d => d.ConversationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_messages_conv");

            entity.HasOne(d => d.Sender).WithMany(p => p.Messages)
                .HasForeignKey(d => d.SenderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_messages_sender");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__notifica__E059842F31965043");

            entity.ToTable("notifications");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_notifications_user_unread")
                .IsDescending(false, true)
                .HasFilter("([is_read]=(0))");

            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.ReadAt).HasColumnName("read_at");
            entity.Property(e => e.RefId).HasColumnName("ref_id");
            entity.Property(e => e.RefType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("ref_type");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_notifications_users");
        });

        modelBuilder.Entity<Package>(entity =>
        {
            entity.HasKey(e => e.PackageId).HasName("PK__packages__63846AE8784F60A3");

            entity.ToTable("packages");

            entity.HasIndex(e => e.Price, "IX_packages_price").HasFilter("([deleted_at] IS NULL AND [is_active]=(1))");

            entity.HasIndex(e => e.ServiceId, "IX_packages_service").HasFilter("([deleted_at] IS NULL)");

            entity.Property(e => e.PackageId).HasColumnName("package_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DurationHours).HasColumnName("duration_hours");
            entity.Property(e => e.Inclusions).HasColumnName("inclusions");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MaxPhotos).HasColumnName("max_photos");
            entity.Property(e => e.PackageName)
                .HasMaxLength(255)
                .HasColumnName("package_name");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("price");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.Packages)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_packages_deleted_by");

            entity.HasOne(d => d.Service).WithMany(p => p.Packages)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_packages_services");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__payments__ED1FC9EA23EC3B3B");

            entity.ToTable("payments");

            entity.HasIndex(e => e.BookingId, "IX_payments_booking");

            entity.HasIndex(e => e.PaidAt, "IX_payments_paid")
                .IsDescending()
                .HasFilter("([paid_at] IS NOT NULL)");

            entity.HasIndex(e => e.PaymentStatusId, "IX_payments_status");

            entity.HasIndex(e => e.PaymentCode, "UQ__payments__7234C6E3BF28FD36").IsUnique();

            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("amount");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CurrencyCode)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("VND")
                .HasColumnName("currency_code");
            entity.Property(e => e.FailureReason).HasColumnName("failure_reason");
            entity.Property(e => e.MethodId).HasColumnName("method_id");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.PaymentCode)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("payment_code");
            entity.Property(e => e.PaymentProvider)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("VNPAY_SANDBOX")
                .HasColumnName("payment_provider");
            entity.Property(e => e.PaymentStatusId).HasColumnName("payment_status_id");
            entity.Property(e => e.ProviderRef)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("provider_ref");
            entity.Property(e => e.RefundReason).HasColumnName("refund_reason");
            entity.Property(e => e.RefundMethod)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("refund_method");
            entity.Property(e => e.RefundPendingReason)
                .HasMaxLength(255)
                .HasColumnName("refund_pending_reason");
            entity.Property(e => e.RefundedAt).HasColumnName("refunded_at");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("transaction_code");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Booking).WithMany(p => p.Payments)
                .HasForeignKey(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_payments_bookings");

            entity.HasOne(d => d.Method).WithMany(p => p.Payments)
                .HasForeignKey(d => d.MethodId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_payments_method");

            entity.HasOne(d => d.PaymentStatus).WithMany(p => p.Payments)
                .HasForeignKey(d => d.PaymentStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_payments_status");
        });

        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.HasKey(e => e.MethodId).HasName("PK__payment___747727B6429B2717");

            entity.ToTable("payment_methods");

            entity.HasIndex(e => e.MethodName, "UQ__payment___2DA2FAEE00C0481C").IsUnique();

            entity.Property(e => e.MethodId).HasColumnName("method_id");
            entity.Property(e => e.MethodName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("method_name");
        });

        modelBuilder.Entity<PaymentStatus>(entity =>
        {
            entity.HasKey(e => e.PaymentStatusId).HasName("PK__payment___E6BF5015EEFC3FE7");

            entity.ToTable("payment_statuses");

            entity.HasIndex(e => e.StatusName, "UQ__payment___501B375302EFD082").IsUnique();

            entity.Property(e => e.PaymentStatusId).HasColumnName("payment_status_id");
            entity.Property(e => e.StatusName)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("status_name");
        });

        modelBuilder.Entity<Settlement>(entity =>
        {
            entity.HasKey(e => e.SettlementId).HasName("PK__settleme__D1B1EF858E987B36");

            entity.ToTable("settlements");

            entity.HasIndex(e => e.BookingId, "UX_settlements_booking").IsUnique();

            entity.HasIndex(e => new { e.StudioId, e.Status }, "IX_settlements_studio_status");

            entity.Property(e => e.SettlementId).HasColumnName("settlement_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.GrossAmount)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("gross_amount");
            entity.Property(e => e.PlatformFeePercent)
                .HasDefaultValue(10m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("platform_fee_percent");
            entity.Property(e => e.PlatformFeeAmount)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("platform_fee_amount");
            entity.Property(e => e.StudioAmount)
                .HasColumnType("decimal(12, 0)")
                .HasColumnName("studio_amount");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.PayoutMethod)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("MANUAL")
                .HasColumnName("payout_method");
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Booking).WithOne(p => p.Settlement)
                .HasForeignKey<Settlement>(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_settlements_bookings");

            entity.HasOne(d => d.Studio).WithMany(p => p.Settlements)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_settlements_studios");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("PK__reports__779B7C587DA6731F");

            entity.ToTable("reports");

            entity.HasIndex(e => e.Status, "IX_reports_status");

            entity.HasIndex(e => new { e.TargetType, e.TargetId }, "IX_reports_target");

            entity.Property(e => e.ReportId).HasColumnName("report_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.HandledBy).HasColumnName("handled_by");
            entity.Property(e => e.HandlerNote).HasColumnName("handler_note");
            entity.Property(e => e.ReportTypeId).HasColumnName("report_type_id");
            entity.Property(e => e.ReporterId).HasColumnName("reporter_id");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.TargetId).HasColumnName("target_id");
            entity.Property(e => e.TargetType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("target_type");

            entity.HasOne(d => d.HandledByNavigation).WithMany(p => p.ReportHandledByNavigations)
                .HasForeignKey(d => d.HandledBy)
                .HasConstraintName("FK_reports_admin");

            entity.HasOne(d => d.ReportType).WithMany(p => p.Reports)
                .HasForeignKey(d => d.ReportTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reports_type");

            entity.HasOne(d => d.Reporter).WithMany(p => p.ReportReporters)
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reports_reporter");
        });

        modelBuilder.Entity<ReportType>(entity =>
        {
            entity.HasKey(e => e.ReportTypeId).HasName("PK__report_t__0C35D540CD5C7AED");

            entity.ToTable("report_types");

            entity.HasIndex(e => e.TypeName, "UQ__report_t__543C4FD951711A3C").IsUnique();

            entity.Property(e => e.ReportTypeId).HasColumnName("report_type_id");
            entity.Property(e => e.TypeName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("type_name");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("PK__reviews__60883D90AE617EF0");

            entity.ToTable("reviews", tb =>
                {
                    tb.HasTrigger("trg_reviews_check_completed");
                    tb.HasTrigger("trg_reviews_update_rating");
                });

            entity.HasIndex(e => e.CustomerId, "IX_reviews_customer");

            entity.HasIndex(e => new { e.StudioId, e.Rating }, "IX_reviews_studio").HasFilter("([is_hidden]=(0))");

            entity.HasIndex(e => e.BookingId, "UQ__reviews__5DE3A5B0E2EA20C6").IsUnique();

            entity.Property(e => e.ReviewId).HasColumnName("review_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.HiddenAt).HasColumnName("hidden_at");
            entity.Property(e => e.HiddenBy).HasColumnName("hidden_by");
            entity.Property(e => e.HiddenNote)
                .HasMaxLength(500)
                .HasColumnName("hidden_note");
            entity.Property(e => e.IsHidden).HasColumnName("is_hidden");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Booking).WithOne(p => p.Review)
                .HasForeignKey<Review>(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reviews_booking");

            entity.HasOne(d => d.Customer).WithMany(p => p.ReviewCustomers)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reviews_customer");

            entity.HasOne(d => d.HiddenByNavigation).WithMany(p => p.ReviewHiddenByNavigations)
                .HasForeignKey(d => d.HiddenBy)
                .HasConstraintName("FK_reviews_hidden_by");

            entity.HasOne(d => d.Studio).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reviews_studio");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__roles__760965CCC826E54B");

            entity.ToTable("roles");

            entity.HasIndex(e => e.RoleName, "UQ__roles__783254B1157F86F7").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.RoleName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("role_name");
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.ServiceId).HasName("PK__services__3E0DB8AF9D47758C");

            entity.ToTable("services");

            entity.HasIndex(e => e.CategoryId, "IX_services_category").HasFilter("([is_hidden]=(0))");

            entity.HasIndex(e => e.City, "IX_services_city").HasFilter("([is_hidden]=(0))");

            entity.HasIndex(e => e.StudioId, "IX_services_studio").HasFilter("([is_hidden]=(0))");

            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.HiddenAt).HasColumnName("hidden_at");
            entity.Property(e => e.HiddenBy).HasColumnName("hidden_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsHidden).HasColumnName("is_hidden");
            entity.Property(e => e.ServiceName)
                .HasMaxLength(255)
                .HasColumnName("service_name");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.ThumbnailUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("thumbnail_url");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Category).WithMany(p => p.Services)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_services_categories");

            entity.HasOne(d => d.HiddenByNavigation).WithMany(p => p.Services)
                .HasForeignKey(d => d.HiddenBy)
                .HasConstraintName("FK_services_hidden_by");

            entity.HasOne(d => d.Studio).WithMany(p => p.Services)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_services_studios");
        });

        modelBuilder.Entity<ServiceImage>(entity =>
        {
            entity.HasKey(e => e.ImageId).HasName("PK__service___DC9AC955A4C2C549");

            entity.ToTable("service_images");

            entity.Property(e => e.ImageId).HasColumnName("image_id");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("image_url");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");

            entity.HasOne(d => d.Service).WithMany(p => p.ServiceImages)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_service_images_services");
        });

        modelBuilder.Entity<Studio>(entity =>
        {
            entity.HasKey(e => e.StudioId).HasName("PK__studios__761C4277C7C6E5B0");

            entity.ToTable("studios");

            entity.HasIndex(e => e.City, "IX_studios_city").HasFilter("([deleted_at] IS NULL)");

            entity.HasIndex(e => e.OwnerId, "IX_studios_owner").HasFilter("([deleted_at] IS NULL)");

            entity.HasIndex(e => e.AvgRating, "IX_studios_rating")
                .IsDescending()
                .HasFilter("([deleted_at] IS NULL AND [status]='APPROVED')");

            entity.HasIndex(e => e.Status, "IX_studios_status").HasFilter("([deleted_at] IS NULL)");

            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.AddressLine)
                .HasMaxLength(500)
                .HasColumnName("address_line");
            entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
            entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
            entity.Property(e => e.AvgRating)
                .HasColumnType("decimal(3, 2)")
                .HasColumnName("avg_rating");
            entity.Property(e => e.BanReason).HasColumnName("ban_reason");
            entity.Property(e => e.BannedAt).HasColumnName("banned_at");
            entity.Property(e => e.BannedBy).HasColumnName("banned_by");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.CommissionPercent)
                .HasDefaultValue(10m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("commission_percent");
            entity.Property(e => e.CoverUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("cover_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.District)
                .HasMaxLength(100)
                .HasColumnName("district");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.Lat)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("lat");
            entity.Property(e => e.Lng)
                .HasColumnType("decimal(10, 7)")
                .HasColumnName("lng");
            entity.Property(e => e.LogoUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("logo_url");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.RejectedAt).HasColumnName("rejected_at");
            entity.Property(e => e.RejectedBy).HasColumnName("rejected_by");
            entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.SlotDurationMinutes)
                .HasDefaultValue(60)
                .HasColumnName("slot_duration_minutes");
            entity.Property(e => e.StudioName)
                .HasMaxLength(255)
                .HasColumnName("studio_name");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
            entity.Property(e => e.TotalReviews).HasColumnName("total_reviews");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.StudioApprovedByNavigations)
                .HasForeignKey(d => d.ApprovedBy)
                .HasConstraintName("FK_studios_approved");

            entity.HasOne(d => d.BannedByNavigation).WithMany(p => p.StudioBannedByNavigations)
                .HasForeignKey(d => d.BannedBy)
                .HasConstraintName("FK_studios_banned");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.StudioDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_studios_deleted");

            entity.HasOne(d => d.Owner).WithMany(p => p.StudioOwners)
                .HasForeignKey(d => d.OwnerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_studios_owner");

            entity.HasOne(d => d.RejectedByNavigation).WithMany(p => p.StudioRejectedByNavigations)
                .HasForeignKey(d => d.RejectedBy)
                .HasConstraintName("FK_studios_rejected");
        });

        modelBuilder.Entity<StudioPortfolio>(entity =>
        {
            entity.HasKey(e => e.PortfolioId).HasName("PK__studio_p__42EE526FA7176B12");

            entity.ToTable("studio_portfolios");

            entity.HasIndex(e => e.ServiceId, "IX_portfolios_service").HasFilter("([service_id] IS NOT NULL)");

            entity.HasIndex(e => new { e.StudioId, e.SortOrder }, "IX_portfolios_studio");

            entity.Property(e => e.PortfolioId).HasColumnName("portfolio_id");
            entity.Property(e => e.Caption)
                .HasMaxLength(255)
                .HasColumnName("caption");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("image_url");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");

            entity.HasOne(d => d.Service).WithMany(p => p.StudioPortfolios)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_portfolios_services");

            entity.HasOne(d => d.Studio).WithMany(p => p.StudioPortfolios)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_portfolios_studios");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.StudioPortfolios)
                .HasForeignKey(d => d.UploadedBy)
                .HasConstraintName("FK_portfolios_uploader");
        });

        modelBuilder.Entity<TimeSlot>(entity =>
        {
            entity.HasKey(e => e.SlotId).HasName("PK__time_slo__971A01BB1E364DDD");

            entity.ToTable("time_slots");

            entity.HasIndex(e => new { e.WorkingDayId, e.Status }, "IX_slots_day_status");

            entity.HasIndex(e => new { e.WorkingDayId, e.StartTime }, "UQ_slot").IsUnique();

            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.EndTime)
                .HasPrecision(0)
                .HasColumnName("end_time");
            entity.Property(e => e.StartTime)
                .HasPrecision(0)
                .HasColumnName("start_time");
            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("OPEN")
                .HasColumnName("status");
            entity.Property(e => e.WorkingDayId).HasColumnName("working_day_id");

            entity.HasOne(d => d.WorkingDay).WithMany(p => p.TimeSlots)
                .HasForeignKey(d => d.WorkingDayId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_time_slots_working_days");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__users__B9BE370FE4C2F265");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "IX_users_email").HasFilter("([deleted_at] IS NULL)");

            entity.HasIndex(e => e.RoleId, "IX_users_role").HasFilter("([deleted_at] IS NULL)");

            entity.HasIndex(e => e.Status, "IX_users_status").HasFilter("([deleted_at] IS NULL)");

            entity.HasIndex(e => e.Email, "UQ__users__AB6E61640EF57430").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.Dob).HasColumnName("dob");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.EmailVerified).HasColumnName("email_verified");
            entity.Property(e => e.FullName)
                .HasMaxLength(255)
                .HasColumnName("full_name");
            entity.Property(e => e.Gender)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("gender");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("UNVERIFIED")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.ResetToken)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("reset_token");
            entity.Property(e => e.ResetTokenExpiresAt).HasColumnName("reset_token_expires_at");
            entity.Property(e => e.VerificationToken)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("verification_token");
            entity.Property(e => e.VerificationTokenExpiresAt).HasColumnName("verification_token_expires_at");


            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_users_roles");
        });

        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__user_add__CAA247C8DD0C9B77");

            entity.ToTable("user_addresses");

            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.AddressLine)
                .HasMaxLength(500)
                .HasColumnName("address_line");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.District)
                .HasMaxLength(100)
                .HasColumnName("district");
            entity.Property(e => e.IsDefault).HasColumnName("is_default");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Ward)
                .HasMaxLength(100)
                .HasColumnName("ward");

            entity.HasOne(d => d.User).WithMany(p => p.UserAddresses)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_addresses_users");
        });

        modelBuilder.Entity<VMonthlyPlatformRevenue>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_monthly_platform_revenue");

            entity.Property(e => e.GrossRevenue)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("gross_revenue");
            entity.Property(e => e.Month)
                .HasMaxLength(4000)
                .HasColumnName("month");
            entity.Property(e => e.PlatformCommission)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("platform_commission");
            entity.Property(e => e.StudioPayout)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("studio_payout");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
        });

        modelBuilder.Entity<VStudioRevenue>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_studio_revenue");

            entity.Property(e => e.AvgRating)
                .HasColumnType("decimal(3, 2)")
                .HasColumnName("avg_rating");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.CommissionDeducted)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("commission_deducted");
            entity.Property(e => e.CompletedBookings).HasColumnName("completed_bookings");
            entity.Property(e => e.GrossRevenue)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("gross_revenue");
            entity.Property(e => e.NetRevenue)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("net_revenue");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.StudioName)
                .HasMaxLength(255)
                .HasColumnName("studio_name");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
            entity.Property(e => e.TotalReviews).HasColumnName("total_reviews");
        });

        modelBuilder.Entity<VSystemStat>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_system_stats");

            entity.Property(e => e.ActiveUsers).HasColumnName("active_users");
            entity.Property(e => e.ApprovedStudios).HasColumnName("approved_studios");
            entity.Property(e => e.PendingReports).HasColumnName("pending_reports");
            entity.Property(e => e.PendingStudios).HasColumnName("pending_studios");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
            entity.Property(e => e.TotalCommission)
                .HasColumnType("decimal(38, 0)")
                .HasColumnName("total_commission");
        });

        modelBuilder.Entity<VTopStudio>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_top_studios");

            entity.Property(e => e.AvgRating)
                .HasColumnType("decimal(3, 2)")
                .HasColumnName("avg_rating");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.StudioId)
                .ValueGeneratedOnAdd()
                .HasColumnName("studio_id");
            entity.Property(e => e.StudioName)
                .HasMaxLength(255)
                .HasColumnName("studio_name");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
            entity.Property(e => e.TotalReviews).HasColumnName("total_reviews");
        });

        modelBuilder.Entity<WorkingDay>(entity =>
        {
            entity.HasKey(e => e.WorkingDayId).HasName("PK__working___FE446ADF7C3C7F88");

            entity.ToTable("working_days");

            entity.HasIndex(e => new { e.StudioId, e.WorkingDate }, "IX_working_days_studio_date");

            entity.HasIndex(e => new { e.StudioId, e.WorkingDate }, "UQ_working_day").IsUnique();

            entity.Property(e => e.WorkingDayId).HasColumnName("working_day_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.IsAvailable)
                .HasDefaultValue(true)
                .HasColumnName("is_available");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.WorkingDate).HasColumnName("working_date");

            entity.HasOne(d => d.Studio).WithMany(p => p.WorkingDays)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_working_days_studios");
        });

        modelBuilder.Entity<WorkingSchedule>(entity =>
        {
            entity.HasKey(e => e.ScheduleId).HasName("PK__working___C46A8A6FB085FA21");

            entity.ToTable("working_schedules");

            entity.HasIndex(e => new { e.StudioId, e.DayOfWeek }, "UQ_schedule_studio_day").IsUnique();

            entity.Property(e => e.ScheduleId).HasColumnName("schedule_id");
            entity.Property(e => e.CloseTime)
                .HasPrecision(0)
                .HasColumnName("close_time");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.DayOfWeek).HasColumnName("day_of_week");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.OpenTime)
                .HasPrecision(0)
                .HasColumnName("open_time");
            entity.Property(e => e.StudioId).HasColumnName("studio_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Studio).WithMany(p => p.WorkingSchedules)
                .HasForeignKey(d => d.StudioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_schedules_studios");
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.WalletId);
            entity.ToTable("wallets");

            entity.HasIndex(e => new { e.OwnerType, e.OwnerId }, "UQ_wallet_owner").IsUnique();

            entity.Property(e => e.WalletId).HasColumnName("wallet_id");
            entity.Property(e => e.OwnerType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("owner_type");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.Balance)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("balance");
            entity.Property(e => e.TotalIn)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("total_in");
            entity.Property(e => e.TotalOut)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("total_out");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.TxId);
            entity.ToTable("wallet_transactions");

            entity.HasIndex(e => e.WalletId, "IX_wallet_transactions_wallet");

            entity.Property(e => e.TxId).HasColumnName("tx_id");
            entity.Property(e => e.WalletId).HasColumnName("wallet_id");
            entity.Property(e => e.TxType)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("tx_type");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("amount");
            entity.Property(e => e.BalanceAfter)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("balance_after");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Wallet).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.WalletId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_wallet_transactions_wallets");

            entity.HasOne(d => d.Booking).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK_wallet_transactions_bookings");

            entity.HasOne(d => d.Payment).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.PaymentId)
                .HasConstraintName("FK_wallet_transactions_payments");
        });

        modelBuilder.Entity<PayoutRequest>(entity =>
        {
            entity.HasKey(e => e.PayoutId);
            entity.ToTable("payout_requests");

            entity.HasIndex(e => e.WalletId, "IX_payout_requests_wallet");
            entity.HasIndex(e => e.Status, "IX_payout_requests_status");
            entity.HasIndex(e => e.ReferenceId).IsUnique();

            entity.Property(e => e.PayoutId).HasColumnName("payout_id");
            entity.Property(e => e.WalletId).HasColumnName("wallet_id");
            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("amount");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("PENDING")
                .HasColumnName("status");
            entity.Property(e => e.BankCode)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("bank_code");
            entity.Property(e => e.AccountNumber)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("account_number");
            entity.Property(e => e.AccountName)
                .HasMaxLength(100)
                .HasColumnName("account_name");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.ReferenceId)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("reference_id");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("transaction_code");
            entity.Property(e => e.FailureReason)
                .HasMaxLength(500)
                .HasColumnName("failure_reason");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(sysutcdatetime())")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Wallet).WithMany(p => p.PayoutRequests)
                .HasForeignKey(d => d.WalletId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_payout_requests_wallets");
        });

        modelBuilder.HasSequence("seq_booking_code");

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
