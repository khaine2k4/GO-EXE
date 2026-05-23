-- =========================================================================
-- SCRIPT INSERT DỮ LIỆU MẪU (10 DÒNG MỖI BẢNG) CHO HỆ THỐNG PHOTO STUDIO BOOKING
-- Dành cho: Microsoft SQL Server
-- Hướng dẫn sử dụng: Mở SSMS hoặc Azure Data Studio, kết nối đến DB của bạn và chạy toàn bộ file này.
-- Mật khẩu đăng nhập mặc định cho mọi tài khoản trong script này là: 123456
-- =========================================================================

USE [PhotoStudioBooking] -- Hãy đổi tên Database cho đúng với DB của bạn nếu cần
GO

-- Giải phóng tất cả trạng thái IDENTITY_INSERT có thể bị treo từ phiên lỗi trước đó
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.reviews OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.roles OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.booking_statuses', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.booking_statuses OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.payment_methods', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.payment_methods OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.payment_statuses', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.payment_statuses OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.report_types', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.report_types OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.categories OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.users OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.user_addresses', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.user_addresses OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.studios', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.studios OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.services', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.services OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.packages', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.packages OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.working_days', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.working_days OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.time_slots', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.time_slots OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.bookings', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.bookings OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.payments OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.settlements', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.settlements OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.booking_logs', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.booking_logs OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.studio_portfolios', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.studio_portfolios OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.service_images', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.service_images OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.reports', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.reports OFF; END TRY BEGIN CATCH END CATCH;
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL BEGIN TRY SET IDENTITY_INSERT dbo.notifications OFF; END TRY BEGIN CATCH END CATCH;
GO

-- Xóa dữ liệu cũ để tránh trùng lặp khi chạy lại script (Tùy chọn, chạy theo thứ tự ngược lại)
DELETE FROM [notifications];
DELETE FROM [reports];
DELETE FROM [booking_logs];
DELETE FROM [reviews];
DELETE FROM [payments];
IF OBJECT_ID('dbo.settlements', 'U') IS NOT NULL DELETE FROM [settlements];
DELETE FROM [bookings];
DELETE FROM [time_slots];
DELETE FROM [working_days];
DELETE FROM [working_schedules];
DELETE FROM [service_images];
DELETE FROM [studio_portfolios];
DELETE FROM [packages];
DELETE FROM [services];
DELETE FROM [categories];
DELETE FROM [studios];
DELETE FROM [user_addresses];
DELETE FROM [users];
DELETE FROM [report_types];
DELETE FROM [payment_statuses];
DELETE FROM [payment_methods];
DELETE FROM [booking_statuses];
DELETE FROM [roles];
GO

-- Vô hiệu hóa Trigger tạm thời để tránh xung đột dữ liệu mẫu
ALTER TABLE [bookings] DISABLE TRIGGER ALL;
ALTER TABLE [reviews] DISABLE TRIGGER ALL;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 1. BẢNG roles (Vai trò người dùng)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [roles] ON;
INSERT INTO [roles] ([role_id], [role_name], [description]) VALUES
(1, 'ADMIN', N'Quản trị viên hệ thống có toàn quyền'),
(2, 'STUDIO_OWNER', N'Nhiếp ảnh gia / Chủ Studio chụp ảnh chuyên nghiệp'),
(3, 'CUSTOMER', N'Khách hàng đặt dịch vụ chụp ảnh');
SET IDENTITY_INSERT [roles] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 2. BẢNG booking_statuses (Trạng thái đặt lịch)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [booking_statuses] ON;
INSERT INTO [booking_statuses] ([status_id], [status_name]) VALUES
(1, 'PENDING_PAYMENT'),
(2, 'PENDING_CONFIRMATION'),
(3, 'CONFIRMED'),
(4, 'IN_PROGRESS'),
(5, 'COMPLETED'),
(6, 'CANCELLED'),
(7, 'REJECTED');
SET IDENTITY_INSERT [booking_statuses] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 3. BẢNG payment_methods (Phương thức thanh toán)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [payment_methods] ON;
INSERT INTO [payment_methods] ([method_id], [method_name]) VALUES
(1, 'CASH'),
(2, 'VNPAY'),
(3, 'BANK_TRANSFER');
SET IDENTITY_INSERT [payment_methods] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 4. BẢNG payment_statuses (Trạng thái thanh toán)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [payment_statuses] ON;
INSERT INTO [payment_statuses] ([payment_status_id], [status_name]) VALUES
(1, 'PENDING'),
(2, 'PAID'),
(3, 'FAILED'),
(4, 'REFUND_PENDING'),
(5, 'REFUNDED'),
(6, 'DISPUTED');
SET IDENTITY_INSERT [payment_statuses] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 5. BẢNG report_types (Loại báo cáo vi phạm/hỗ trợ)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [report_types] ON;
INSERT INTO [report_types] ([report_type_id], [type_name]) VALUES
(1, 'STUDIO_VIOLATION'),
(2, 'CUSTOMER_COMPLAINT'),
(3, 'SYSTEM_BUG');
SET IDENTITY_INSERT [report_types] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 6. BẢNG categories (Danh mục dịch vụ)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [categories] ON;
INSERT INTO [categories] ([category_id], [category_name], [description], [icon_url], [is_active], [sort_order], [created_at], [updated_at]) VALUES
(1, N'Ảnh Cưới & Ngoại Cảnh', N'Chụp ảnh cưới hỏi, phóng sự cưới, ảnh pre-wedding ngoại cảnh nghệ thuật.', 'wedding-icon.png', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'Chân Dung & Nghệ Thuật', N'Chụp chân dung studio cá nhân, chụp lookbook thời trang nghệ thuật.', 'portrait-icon.png', 1, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'Ảnh Gia Đình & Cho Bé', N'Lưu giữ khoảnh khắc ấm áp của gia đình nhỏ và nét đáng yêu của bé yêu.', 'family-icon.png', 1, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'Sự Kiện & Hội Nghị', N'Chụp ảnh hội nghị, tiệc sinh nhật, sự kiện doanh nghiệp chuyên nghiệp.', 'event-icon.png', 1, 4, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'Sản Phẩm & Quảng Cáo', N'Chụp ảnh sản phẩm, món ăn thương mại phục vụ kinh doanh bán hàng.', 'product-icon.png', 1, 5, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [categories] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 7. BẢNG users (Tài khoản người dùng)
-- Mật khẩu mã hóa BCrypt của tất cả tài khoản dưới đây đều là: 123456
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [users] ON;
INSERT INTO [users] ([user_id], [role_id], [full_name], [email], [phone], [password_hash], [avatar_url], [gender], [dob], [status], [email_verified], [created_at], [updated_at]) VALUES
-- 1 Admin
(1, 1, N'Admin Hệ Thống', 'admin@go.vn', '0901234567', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', 'Male', '1995-10-15', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 4 Nhiếp ảnh gia / Chủ studio
(2, 2, N'Nguyễn Văn Hùng', 'hung.photography@gmail.com', '0911223344', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hung', 'Male', '1988-05-20', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 2, N'Trần Thị Mai', 'mai.wedding@gmail.com', '0922334455', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mai', 'Female', '1992-09-12', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 2, N'Lê Hoàng Nam', 'nam.studio@gmail.com', '0933445566', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', 'Male', '1990-01-30', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 2, N'Phạm Minh Tuấn', 'tuan.art@gmail.com', '0944556677', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tuan', 'Male', '1994-07-08', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 5 Khách hàng đặt lịch
(6, 3, N'Đỗ Quốc Huy', 'huy.dq@gmail.com', '0955667788', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/lorelei/svg?seed=huy', 'Male', '1998-04-18', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 3, N'Hoàng Thanh Trúc', 'truc.ht@gmail.com', '0966778899', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/lorelei/svg?seed=truc', 'Female', '2000-11-22', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 3, N'Vũ Anh Tuấn', 'tuan.va@gmail.com', '0977889900', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/lorelei/svg?seed=vuanhtuan', 'Male', '1997-08-05', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 3, N'Lê Mỹ Linh', 'linh.lm@gmail.com', '0988990011', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/lorelei/svg?seed=mylinh', 'Female', '1999-03-14', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, 3, N'Ngô Gia Bảo', 'bao.ng@gmail.com', '0999001122', '$2a$11$QD8X8ym9raSrZ1NNOEqGjuG4qdGIi/FAhh1u5hnrjzZYILSlPzjES', 'https://api.dicebear.com/7.x/lorelei/svg?seed=giabao', 'Male', '2001-09-09', 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [users] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 8. BẢNG user_addresses (Địa chỉ khách hàng)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [user_addresses] ON;
INSERT INTO [user_addresses] ([address_id], [user_id], [city], [district], [ward], [address_line], [is_default], [created_at]) VALUES
(1, 6, N'Hồ Chí Minh', N'Quận 1', N'Bến Nghé', N'12 Lê Lợi', 1, SYSUTCDATETIME()),
(2, 6, N'Vũng Tàu', N'Thành phố Vũng Tàu', N'Phường 2', N'84 Thùy Vân', 0, SYSUTCDATETIME()),
(3, 7, N'Hồ Chí Minh', N'Quận Bình Thạnh', N'Phường 25', N'150 Điện Biên Phủ', 1, SYSUTCDATETIME()),
(4, 8, N'Đà Nẵng', N'Hải Châu', N'Hòa Cường Bắc', N'33 Núi Thành', 1, SYSUTCDATETIME()),
(5, 9, N'Hà Nội', N'Hoàn Kiếm', N'Hàng Trống', N'5 Cầu Gỗ', 1, SYSUTCDATETIME()),
(6, 10, N'Hồ Chí Minh', N'Quận 7', N'Tân Phong', N'45 Nguyễn Văn Linh', 1, SYSUTCDATETIME()),
(7, 2, N'Hồ Chí Minh', N'Tân Bình', N'Phường 2', N'120 Trường Sơn', 1, SYSUTCDATETIME()),
(8, 3, N'Hồ Chí Minh', N'Quận 3', N'Võ Thị Sáu', N'200 Nguyễn Đình Chiểu', 1, SYSUTCDATETIME()),
(9, 4, N'Hà Nội', N'Cầu Giấy', N'Dịch Vọng', N'15 Duy Tân', 1, SYSUTCDATETIME()),
(10, 5, N'Đà Nẵng', N'Thanh Khê', N'Chính Gián', N'90 Điện Biên Phủ', 1, SYSUTCDATETIME());
SET IDENTITY_INSERT [user_addresses] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 9. BẢNG studios (Thông tin Studio chụp ảnh)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [studios] ON;
INSERT INTO [studios] ([studio_id], [owner_id], [studio_name], [description], [logo_url], [cover_url], [phone], [email], [city], [district], [address_line], [lat], [lng], [commission_percent], [avg_rating], [total_reviews], [total_bookings], [status], [created_at], [updated_at]) VALUES
-- 4 Studio đã hoạt động
(1, 2, N'Hùng Camera & Studio', N'Studio chuyên nghiệp hàng đầu Tân Bình với trang thiết bị tối tân nhập khẩu.', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600', '0911223344', 'hung.photography@gmail.com', N'Hồ Chí Minh', N'Tân Bình', N'120 Trường Sơn', 10.812345, 106.661234, 10.00, 4.80, 5, 25, 'APPROVED', SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 3, N'Mai Wedding House', N'Điểm đến mơ ước của mọi cô dâu chú rể. Chuyên trọn gói album cưới lung linh.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600', '0922334455', 'mai.wedding@gmail.com', N'Hồ Chí Minh', N'Quận 3', N'200 Nguyễn Đình Chiểu', 10.778899, 106.689911, 10.00, 4.90, 4, 18, 'APPROVED', SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 4, N'Nam Studio & Media', N'Chuyên nghiệp, trẻ trung, lưu trọn từng khoảnh khắc cảm xúc tự nhiên nhất.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600', '0933445566', 'nam.studio@gmail.com', N'Hà Nội', N'Cầu Giấy', N'15 Duy Tân', 21.028511, 105.782345, 10.00, 4.70, 3, 15, 'APPROVED', SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 5, N'Tuấn Art Fine Portrait', N'Nghệ thuật chụp chân dung đen trắng và lookbook nghệ thuật cổ điển.', 'https://images.unsplash.com/photo-1453060113865-968ce1ad0e57?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600', '0944556677', 'tuan.art@gmail.com', N'Đà Nẵng', N'Thanh Khê', N'90 Điện Biên Phủ', 16.061234, 108.213456, 12.00, 4.95, 2, 10, 'APPROVED', SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 3 Studio đang chờ duyệt
(5, 6, N'Sunny Photo Agency', N'Đội ngũ nhiếp ảnh trẻ đầy sáng tạo với phong cách chụp màu nắng vintage cực hot.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=600', '0812345678', 'sunny.agency@gmail.com', N'Hồ Chí Minh', N'Quận 1', N'77 Nguyễn Huệ', 10.771234, 106.702345, 10.00, 0.00, 0, 0, 'PENDING', SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, 7, N'Memory Film Studio', N'Chuyên chụp ảnh cưới chuẩn màu film analog cổ điển sang trọng và giàu cảm xúc.', 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&q=80&w=600', '0823456789', 'memory.film@gmail.com', N'Đà Nẵng', N'Sơn Trà', N'12 Võ Nguyên Giáp', 16.071234, 108.243456, 10.00, 0.00, 0, 0, 'PENDING', SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 8, N'Dream Wedding Decor & Photo', N'Cung cấp trọn gói từ khâu concept thiết kế đám cưới đến chụp hình phóng sự.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600', '0834567890', 'dream.wedding@gmail.com', N'Hà Nội', N'Tây Hồ', N'34 Xuân Diệu', 21.061234, 105.823456, 10.00, 0.00, 0, 0, 'PENDING', SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 2 Studio bị từ chối
(8, 9, N'Fake Studio Group', N'Nội dung hình ảnh có dấu hiệu vi phạm bản quyền từ studio lớn khác.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600', '0845678901', 'fake.studio@gmail.com', N'Hải Phòng', N'Lê Chân', N'22 Lạch Tray', 20.851234, 106.683456, 10.00, 0.00, 0, 0, 'REJECTED', SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 10, N'Bad Photo Service', N'Studio không cung cấp đầy đủ chứng chỉ hoạt động nghề nghiệp pháp lý.', 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1472214222541-d510753a4907?auto=format&fit=crop&q=80&w=600', '0856789012', 'bad.photo@gmail.com', N'Cần Thơ', N'Ninh Kiều', N'15 Hai Bà Trưng', 10.031234, 105.783456, 10.00, 0.00, 0, 0, 'REJECTED', SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 1 Studio tạm ngưng hoạt động
(10, 2, N'Legacy Capture Studio', N'Chi nhánh cũ của Hùng Camera nay chuyển giao dừng nhận lịch chụp lẻ.', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=150', 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600', '0911223344', 'legacy@gmail.com', N'Bình Dương', N'Thủ Dầu Một', N'200 Đại Lộ Bình Dương', 10.981234, 106.653456, 10.00, 4.00, 1, 5, 'INACTIVE', SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [studios] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 10. BẢNG services (Các dịch vụ cung cấp)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [services] ON;
INSERT INTO [services] ([service_id], [studio_id], [category_id], [service_name], [description], [thumbnail_url], [city], [is_active], [is_hidden], [sort_order], [created_at], [updated_at]) VALUES
(1, 1, 1, N'Trọn Gói Phóng Sự Cưới Premium', N'Ghi lại những khoảnh khắc chân thực, xúc động nhất trong ngày trọng đại.', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 1, 2, N'Chụp Chân Dung Nghệ Thuật High-end', N'Trải nghiệm buổi photoshoot chuẩn bìa tạp chí thời trang cá nhân sang xịn.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 2, 1, N'Pre-Wedding Album Đà Lạt Mộng Mơ', N'Tour chụp ngoại cảnh trọn gói Đà Lạt 2 ngày 1 đêm cho cô dâu chú rể.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 2, 3, N'Kỷ Niệm Ngày Cưới Gia Đình Ấm Áp', N'Ghi hình đại gia đình kỷ niệm 10/20 năm ngày cưới ngập tràn niềm vui.', 'https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 3, 4, N'Phóng Sự Sự Kiện Doanh Nghiệp', N'Chụp hình hội thảo, ra mắt sản phẩm mới chuyên nghiệp bàn giao file nhanh.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=300', N'Hà Nội', 1, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, 3, 3, N'Concept Thôi Nôi & Mừng Tuổi Bé', N'Set chụp ngộ nghĩnh, dụng cụ an toàn cho bé yêu lung linh đầy tiếng cười.', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=300', N'Hà Nội', 1, 0, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 4, 2, N'Lookbook Nghệ Thuật Nude/Boudoir', N'Khai thác vẻ đẹp hình thể nghệ thuật kín đáo, tinh tế và cực kỳ riêng tư.', 'https://images.unsplash.com/photo-1453060113865-968ce1ad0e57?auto=format&fit=crop&q=80&w=300', N'Đà Nẵng', 1, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 4, 5, N'Chụp Ảnh Món Ăn & Decor Nhà Hàng', N'Gói chụp thương mại giúp nâng tầm ẩm thực, phục vụ thiết kế menu app.', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=300', N'Đà Nẵng', 1, 0, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 1, 5, N'Chụp Lookbook Quần Áo Ngoài Trời', N'Dành cho các local brand thời trang trẻ năng động, trẻ trung cá tính.', 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 3, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, 2, 2, N'Chân Dung Profile Doanh Nhân', N'Kiến tạo hình ảnh đại diện thương hiệu cá nhân đẳng cấp chuyên nghiệp.', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=300', N'Hồ Chí Minh', 1, 0, 3, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [services] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 11. BẢNG packages (Các gói dịch vụ cụ thể)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [packages] ON;
INSERT INTO [packages] ([package_id], [service_id], [package_name], [description], [price], [duration_hours], [max_photos], [inclusions], [is_active], [sort_order], [created_at], [updated_at]) VALUES
(1, 1, N'Gói Bạc (Silver)', N'1 Nhiếp ảnh gia, 4 tiếng làm việc, nhận 150 file chỉnh sửa cơ bản.', 3500000, 4, 150, N'Chỉnh sửa ánh sáng màu sắc, bàn giao USB', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 1, N'Gói Vàng (Gold)', N'2 Nhiếp ảnh gia, 8 tiếng, phóng lớn 1 ảnh cưới, album 30 trang.', 7500000, 8, 300, N'Album gỗ cao cấp, slide trình chiếu đám cưới', 1, 2, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 2, N'Gói Personal Standard', N'Chụp 1 concept cá nhân, hỗ trợ trang điểm & 2 bộ trang phục.', 1800000, 2, 20, N'Make up, trang phục, 10 ảnh photoshop chuyên sâu', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 3, N'Gói Trọn Gói Đà Lạt VIP', N'Bao chi phí di chuyển khách sạn, 3 váy cưới cao cấp, chụp 3 địa điểm.', 15000000, 16, 500, N'Xe đưa đón, make up đi kèm suốt hành trình, album 40 trang', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 4, N'Gói Gia Đình Nhỏ Cozi', N'Tối đa 5 thành viên chụp tại studio ấm cúng với 2 concept.', 2500000, 3, 50, N'5 ảnh ép gỗ để bàn, chỉnh sửa 30 ảnh đẹp nhất', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, 5, N'Gói Sự Kiện Cơ Bản', N'Nhiếp ảnh gia tác nghiệp trọn sự kiện dưới 3 tiếng, bàn giao trong 24h.', 2000000, 3, 200, N'Bàn giao link Drive nhanh chóng trong ngày', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 6, N'Gói Baby Joy', N'Hỗ trợ toàn bộ phông nền đồ chơi, chụp 3 phong cách đáng yêu.', 1500000, 2, 30, N'Tặng 1 khung ảnh lưu niệm cao cấp cho bé', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 7, N'Gói Muse Art Noir', N'Buổi chụp nghệ thuật độc bản, cam kết bảo mật hình ảnh tuyệt đối.', 5000000, 3, 15, N'Chụp bởi studio owner, bàn giao album in tay độc bản', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 8, N'Gói Food Combo 10 Món', N'Chụp ảnh chuyên sâu 10 món ăn thiết kế decor bắt mắt, ánh sáng studio.', 3000000, 4, 40, N'Chỉnh sửa nét cắt phông chuyên nghiệp cho website', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, 10, N'Gói Executive Profile', N'Trang điểm công sở, chụp 2 concept phông nền xám & xanh cao cấp.', 2500000, 2, 10, N'2 ảnh in gỗ cao cấp phục vụ đặt tại văn phòng làm việc', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [packages] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 12. BẢNG working_days (Ngày làm việc khả dụng)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [working_days] ON;
INSERT INTO [working_days] ([working_day_id], [studio_id], [working_date], [is_available], [note], [created_at]) VALUES
(1, 1, CAST(GETDATE() AS DATE), 1, N'Ngày thường mở cửa đón khách', SYSUTCDATETIME()),
(2, 1, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 1, N'Ngày thường mở cửa đón khách', SYSUTCDATETIME()),
(3, 2, CAST(GETDATE() AS DATE), 1, N'Lịch cưới cô dâu chú rể kín', SYSUTCDATETIME()),
(4, 2, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 1, N'Nhận lịch pre-wedding ngoại cảnh', SYSUTCDATETIME()),
(5, 3, CAST(GETDATE() AS DATE), 1, N'Lịch chụp sự kiện văn phòng Hà Nội', SYSUTCDATETIME()),
(6, 3, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 1, N'Lịch chụp thôi nôi các bé', SYSUTCDATETIME()),
(7, 4, CAST(GETDATE() AS DATE), 1, N'Studio Đà Nẵng mở cửa đón khách', SYSUTCDATETIME()),
(8, 4, CAST(DATEADD(day, 1, GETDATE()) AS DATE), 1, N'Lịch chụp lookbook thời trang', SYSUTCDATETIME()),
(9, 1, CAST(DATEADD(day, 2, GETDATE()) AS DATE), 1, N'Cuối tuần đông khách cần đặt trước', SYSUTCDATETIME()),
(10, 2, CAST(DATEADD(day, 2, GETDATE()) AS DATE), 1, N'Tour ngoại cảnh Đà Lạt khởi hành', SYSUTCDATETIME());
SET IDENTITY_INSERT [working_days] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 13. BẢNG time_slots (Khung giờ làm việc)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [time_slots] ON;
INSERT INTO [time_slots] ([slot_id], [working_day_id], [start_time], [end_time], [status]) VALUES
(1, 1, '08:00:00', '12:00:00', 'OPEN'),
(2, 1, '13:30:00', '17:30:00', 'OPEN'),
(3, 2, '08:00:00', '12:00:00', 'OPEN'),
(4, 3, '07:30:00', '15:30:00', 'OPEN'),
(5, 4, '08:00:00', '12:00:00', 'OPEN'),
(6, 5, '09:00:00', '12:00:00', 'OPEN'),
(7, 6, '14:00:00', '16:00:00', 'OPEN'),
(8, 7, '08:30:00', '11:30:00', 'OPEN'),
(9, 8, '13:00:00', '17:00:00', 'OPEN'),
(10, 9, '08:00:00', '12:00:00', 'OPEN'),
(11, 10, '08:00:00', '12:00:00', 'OPEN');
SET IDENTITY_INSERT [time_slots] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 14. BẢNG bookings (Hồ sơ đặt lịch chi tiết)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [bookings] ON;
INSERT INTO [bookings] ([booking_id], [customer_id], [studio_id], [package_id], [slot_id], [status_id], [booking_code], [shooting_date], [shooting_location], [note], [total_price], [commission_percent], [commission_amount], [studio_revenue], [confirmed_at], [completed_at], [created_at], [updated_at]) VALUES
-- 3 Lịch đã hoàn thành
(1, 6, 1, 1, 1, 5, 'BK20260520-001', CAST(GETDATE() AS DATE), N'Phim trường Lamour, Tân Bình', N'Chụp phóng sự cưới cho cô dâu Huy & chú rể Vy', 3500000, 10.00, 350000, 3150000, DATEADD(hour, -24, SYSUTCDATETIME()), SYSUTCDATETIME(), DATEADD(day, -5, SYSUTCDATETIME()), SYSUTCDATETIME()),
(2, 7, 2, 4, 4, 5, 'BK20260520-002', CAST(GETDATE() AS DATE), N'Hồ Xuân Hương, Đà Lạt', N'Gói VIP Đà Lạt trọn gói 2 ngày chụp', 15000000, 10.00, 1500000, 13500000, DATEADD(hour, -48, SYSUTCDATETIME()), SYSUTCDATETIME(), DATEADD(day, -7, SYSUTCDATETIME()), SYSUTCDATETIME()),
(3, 8, 3, 6, 6, 5, 'BK20260520-003', CAST(GETDATE() AS DATE), N'Khách sạn Lotte Cầu Giấy', N'Hội thảo doanh nghiệp quy mô 100 khách', 2000000, 10.00, 200000, 1800000, DATEADD(hour, -12, SYSUTCDATETIME()), SYSUTCDATETIME(), DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME()),
-- 2 Lịch đã xác nhận chuẩn bị chụp
(4, 9, 4, 8, 8, 3, 'BK20260520-004', CAST(DATEADD(day, 1, GETDATE()) AS DATE), N'Studio Nam Art Đà Nẵng', N'Chụp ảnh lookbook độc quyền cá nhân bảo mật', 5000000, 12.00, 600000, 4400000, SYSUTCDATETIME(), NULL, DATEADD(day, -1, SYSUTCDATETIME()), SYSUTCDATETIME()),
(5, 10, 1, 3, 3, 3, 'BK20260520-005', CAST(DATEADD(day, 1, GETDATE()) AS DATE), N'Công viên Vinhomes Central Park', N'Chụp chân dung thời trang màu nắng vintage', 1800000, 10.00, 180000, 1620000, SYSUTCDATETIME(), NULL, DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME()),
-- 2 Lịch đang chờ studio phản hồi phê duyệt
(6, 6, 2, 5, 5, 1, 'BK20260520-006', CAST(DATEADD(day, 2, GETDATE()) AS DATE), N'Căn hộ chung cư Landmark 81', N'Lưu niệm gia đình nhỏ nhân ngày thôi nôi bé', 2500000, 10.00, 250000, 2250000, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 7, 3, 7, 7, 1, 'BK20260520-007', CAST(DATEADD(day, 2, GETDATE()) AS DATE), N'Studio Nam Cầu Giấy', N'Hình lưu niệm sinh nhật tròn 1 tuổi bé yêu', 1500000, 10.00, 150000, 1350000, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()),
-- 2 Lịch đã bị hủy/từ chối
(8, 8, 4, 9, 9, 6, 'BK20260520-008', CAST(GETDATE() AS DATE), N'Nhà hàng Seafood King Đà Nẵng', N'Khách hàng báo hủy do thay đổi lịch khai trương nhà hàng', 3000000, 12.00, 360000, 2640000, NULL, NULL, DATEADD(day, -3, SYSUTCDATETIME()), SYSUTCDATETIME()),
(9, 9, 1, 10, 10, 7, 'BK20260520-009', CAST(GETDATE() AS DATE), N'Legacy Studio Bình Dương', N'Studio từ chối do trùng lịch lớn đột xuất', 2500000, 10.00, 250000, 2250000, NULL, NULL, DATEADD(day, -4, SYSUTCDATETIME()), SYSUTCDATETIME()),
-- 1 Lịch đang có tranh chấp
(10, 10, 2, 5, 11, 3, 'BK20260520-010', CAST(DATEADD(day, -1, GETDATE()) AS DATE), N'Phòng chụp Mai Wedding Q3', N'Khách phàn nàn ảnh trả bị mờ out nét, đòi hoàn tiền', 2500000, 10.00, 250000, 2250000, DATEADD(day, -1, SYSUTCDATETIME()), NULL, DATEADD(day, -4, SYSUTCDATETIME()), SYSUTCDATETIME());
SET IDENTITY_INSERT [bookings] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 15. BẢNG payments (Lịch sử thanh toán chi tiết)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [payments] ON;
INSERT INTO [payments] ([payment_id], [booking_id], [method_id], [payment_status_id], [payment_code], [amount], [currency_code], [transaction_code], [provider_ref], [paid_at], [created_at], [updated_at]) VALUES
(1, 1, 2, 2, 'PAY-BK001-VN', 3500000, 'VND', 'TX1234567890', 'VNPAY-12345', SYSUTCDATETIME(), DATEADD(day, -5, SYSUTCDATETIME()), SYSUTCDATETIME()),
(2, 2, 3, 2, 'PAY-BK002-BT', 15000000, 'VND', 'TX9876543210', 'BANK-998877', SYSUTCDATETIME(), DATEADD(day, -7, SYSUTCDATETIME()), SYSUTCDATETIME()),
(3, 3, 2, 2, 'PAY-BK003-VN', 2000000, 'VND', 'TX1122334455', 'VNPAY-22334', SYSUTCDATETIME(), DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME()),
(4, 4, 3, 2, 'PAY-BK004-BT', 5000000, 'VND', 'TX5566778899', 'BANK-112233', SYSUTCDATETIME(), DATEADD(day, -1, SYSUTCDATETIME()), SYSUTCDATETIME()),
(5, 5, 1, 1, 'PAY-BK005-CS', 1800000, 'VND', NULL, NULL, NULL, DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME()),
(6, 6, 2, 1, 'PAY-BK006-VN', 2500000, 'VND', NULL, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 7, 2, 1, 'PAY-BK007-VN', 1500000, 'VND', NULL, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 8, 3, 5, 'PAY-BK008-BT', 3000000, 'VND', 'TX9900112233', 'BANK-887766', SYSUTCDATETIME(), DATEADD(day, -3, SYSUTCDATETIME()), SYSUTCDATETIME()),
(9, 9, 2, 3, 'PAY-BK009-VN', 2500000, 'VND', NULL, NULL, NULL, DATEADD(day, -4, SYSUTCDATETIME()), SYSUTCDATETIME()),
(10, 10, 3, 6, 'PAY-BK010-BT', 2500000, 'VND', 'TX7788990011', 'BANK-554433', SYSUTCDATETIME(), DATEADD(day, -4, SYSUTCDATETIME()), SYSUTCDATETIME());
SET IDENTITY_INSERT [payments] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 16. BẢNG reviews (Đánh giá từ khách hàng)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [reviews] ON;
INSERT INTO [reviews] ([review_id], [booking_id], [customer_id], [studio_id], [rating], [comment], [is_hidden], [created_at], [updated_at]) VALUES
(1, 1, 6, 1, 5, N'Hùng Camera chụp phóng sự cưới siêu đỉnh, nước ảnh ấm áp lung linh, bắt trọn từng khoảnh khắc khóc cười của hai vợ chồng. Nhiệt tình 10/10!', 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 2, 7, 2, 5, N'Mai Wedding hỗ trợ nhiệt tình hết cỡ, váy cưới chuẩn VIP ôm dáng rất đẹp. Make-up đi theo chỉnh chu, bộ ảnh Đà Lạt ai cũng khen nức nở.', 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 3, 8, 3, 4, N'Ảnh bàn giao nhanh chóng chất lượng cao sắc nét, bố cục ảnh hội thảo rất chỉnh chu sang trọng. Sẽ tiếp tục hợp tác ở các sự kiện sau của công ty.', 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 5, 10, 1, 5, N'Một buổi photoshoot vô cùng tuyệt vời. Bạn nhiếp ảnh vui vẻ tạo không khí giúp mình không bị đơ trước camera. Ảnh mộc đã rất đẹp rồi!', 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 4, 9, 4, 4, N'Sản phẩm hoàn thiện đẹp, giao hàng đúng hẹn. Điểm trừ nhỏ là phim trường hơi đông nên chụp bị vội 1 chút.', 0, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT [reviews] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 17. BẢNG booking_logs (Nhật ký hành trình đặt lịch)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [booking_logs] ON;
INSERT INTO [booking_logs] ([log_id], [booking_id], [old_status], [new_status], [note], [changed_by], [changed_at]) VALUES
(1, 1, 'PENDING_PAYMENT', 'CONFIRMED', N'Studio Hùng xác nhận nhận lịch chụp phóng sự', 2, DATEADD(day, -4, SYSUTCDATETIME())),
(2, 1, 'CONFIRMED', 'COMPLETED', N'Bàn giao toàn bộ album ảnh hoàn thiện cho khách hàng', 2, SYSUTCDATETIME()),
(3, 2, 'PENDING_PAYMENT', 'CONFIRMED', N'Studio Mai nhận tour VIP Đà Lạt, chuẩn bị trang phục váy cưới', 3, DATEADD(day, -6, SYSUTCDATETIME())),
(4, 2, 'CONFIRMED', 'COMPLETED', N'Bàn giao album gỗ cao cấp tận tay khách hàng', 3, SYSUTCDATETIME()),
(5, 3, 'PENDING_PAYMENT', 'CONFIRMED', N'Nam Studio nhận chụp sự kiện Lotte Cầu Giấy', 4, DATEADD(day, -1, SYSUTCDATETIME())),
(6, 3, 'CONFIRMED', 'COMPLETED', N'Bàn giao file qua link Google Drive nhanh trong ngày', 4, SYSUTCDATETIME()),
(7, 4, 'PENDING_PAYMENT', 'CONFIRMED', N'Studio Tuấn Art xác nhận xếp lịch buổi chụp boudoir riêng tư', 5, SYSUTCDATETIME()),
(8, 5, 'PENDING_PAYMENT', 'CONFIRMED', N'Hùng Studio xếp lịch slot chụp ngoại cảnh Landmark 81', 2, SYSUTCDATETIME()),
(9, 8, 'PENDING_PAYMENT', 'CANCELLED', N'Khách hàng hủy lịch do nhà hàng dời lịch khai trương', 8, SYSUTCDATETIME()),
(10, 10, 'PENDING_PAYMENT', 'CONFIRMED', N'Khách hàng gửi báo cáo tranh chấp chất lượng ảnh bị out nét', 10, SYSUTCDATETIME());
SET IDENTITY_INSERT [booking_logs] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 18. BẢNG studio_portfolios (Bộ sưu tập ảnh tiêu biểu của Studio)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [studio_portfolios] ON;
INSERT INTO [studio_portfolios] ([portfolio_id], [studio_id], [service_id], [image_url], [caption], [sort_order], [uploaded_at], [uploaded_by]) VALUES
(1, 1, 1, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=500', N'Phóng sự cưới ngọt ngào tại Lamour', 1, SYSUTCDATETIME(), 2),
(2, 1, 2, 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=500', N'Chân dung nghệ thuật đơn sắc sang trọng', 2, SYSUTCDATETIME(), 2),
(3, 2, 3, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=500', N'Khoảnh khắc Pre-wedding tại Thung Lũng Tình Yêu', 1, SYSUTCDATETIME(), 3),
(4, 2, 4, 'https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&fit=crop&q=80&w=500', N'Đại gia đình hạnh phúc rạng ngời ngày kỷ niệm', 2, SYSUTCDATETIME(), 3),
(5, 3, 5, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=500', N'Sự kiện công ty đa quốc gia đẳng cấp chuyên nghiệp', 1, SYSUTCDATETIME(), 4),
(6, 3, 6, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=500', N'Nụ cười rạng ngời đáng yêu ngày thôi nôi bé', 2, SYSUTCDATETIME(), 4),
(7, 4, 7, 'https://images.unsplash.com/photo-1453060113865-968ce1ad0e57?auto=format&fit=crop&q=80&w=500', N'Nghệ thuật đường nét hình thể tinh tế sang trọng', 1, SYSUTCDATETIME(), 5),
(8, 4, 8, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=500', N'Nhiếp ảnh ẩm thực commercial nâng tầm ẩm thực Việt', 2, SYSUTCDATETIME(), 5),
(9, 1, 9, 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=500', N'Lookbook hè phong cách năng động độc đáo', 3, SYSUTCDATETIME(), 2),
(10, 2, 10, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=500', N'Doanh nhân thành đạt nâng tầm thương hiệu uy tín', 3, SYSUTCDATETIME(), 3);
SET IDENTITY_INSERT [studio_portfolios] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 19. BẢNG service_images (Ảnh chi tiết dịch vụ)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [service_images] ON;
INSERT INTO [service_images] ([image_id], [service_id], [image_url], [sort_order]) VALUES
(1, 1, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400', 1),
(2, 2, 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400', 1),
(3, 3, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400', 1),
(4, 4, 'https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&fit=crop&q=80&w=400', 1),
(5, 5, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400', 1),
(6, 6, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=400', 1),
(7, 7, 'https://images.unsplash.com/photo-1453060113865-968ce1ad0e57?auto=format&fit=crop&q=80&w=400', 1),
(8, 8, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400', 1),
(9, 9, 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=400', 1),
(10, 10, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400', 1);
SET IDENTITY_INSERT [service_images] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 20. BẢNG reports (Báo cáo vi phạm & Hỗ trợ kỹ thuật)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [reports] ON;
INSERT INTO [reports] ([report_id], [reporter_id], [report_type_id], [target_type], [target_id], [description], [status], [handled_by], [handler_note], [created_at], [resolved_at]) VALUES
(1, 6, 2, 'BOOKING', 10, N'Studio chậm trễ bàn giao ảnh out nét, yêu cầu hoàn tiền đền bù hợp đồng.', 'PENDING', NULL, NULL, SYSUTCDATETIME(), NULL),
(2, 7, 1, 'STUDIO', 8, N'Studio Fake đăng tải toàn ảnh của studio khác để lừa dối khách hàng.', 'PENDING', NULL, NULL, SYSUTCDATETIME(), NULL),
(3, 8, 3, 'SYSTEM', 0, N'Gặp lỗi hiển thị trắng trang khi thanh toán qua cổng VNPAY trên app điện thoại.', 'PENDING', NULL, NULL, SYSUTCDATETIME(), NULL),
(4, 9, 2, 'BOOKING', 9, N'Yêu cầu hoàn cọc do bên studio tự ý đơn phương từ chối lịch chụp.', 'RESOLVED', 1, N'Đã hoàn tiền thành công về ví VNPay khách hàng.', DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME()),
(5, 10, 1, 'STUDIO', 9, N'Không liên lạc được số điện thoại của Studio Bad Photo.', 'RESOLVED', 1, N'Đã gửi cảnh báo nhắc nhở cập nhật thông tin liên hệ mới nhất.', DATEADD(day, -4, SYSUTCDATETIME()), SYSUTCDATETIME()),
(6, 6, 3, 'SYSTEM', 0, N'Lỗi không cập nhật được ảnh đại diện mới trong phần cài đặt profile.', 'PENDING', NULL, NULL, SYSUTCDATETIME(), NULL),
(7, 7, 2, 'BOOKING', 2, N'Khách hỏi cách tải ảnh dung lượng cao gốc từ link album Drive.', 'RESOLVED', 1, N'Đã gửi hướng dẫn chi tiết qua email cá nhân khách hàng.', DATEADD(day, -5, SYSUTCDATETIME()), SYSUTCDATETIME()),
(8, 8, 1, 'STUDIO', 10, N'Báo cáo studio Legacy đã ngưng hoạt động nhưng vẫn hiện trên bản đồ.', 'RESOLVED', 1, N'Đã chuyển trạng thái studio sang INACTIVE thành công.', DATEADD(day, -6, SYSUTCDATETIME()), SYSUTCDATETIME()),
(9, 9, 3, 'SYSTEM', 0, N'Hệ thống thông báo đẩy bị chậm 10 phút sau khi thanh toán thành công.', 'PENDING', NULL, NULL, SYSUTCDATETIME(), NULL),
(10, 10, 2, 'BOOKING', 6, N'Khách muốn đổi giờ sang buổi chiều do trùng lịch đám cưới bạn thân.', 'RESOLVED', 1, N'Đã hỗ trợ thỏa thuận đổi slot thành công cùng chủ studio.', DATEADD(day, -1, SYSUTCDATETIME()), SYSUTCDATETIME());
SET IDENTITY_INSERT [reports] OFF;
GO

-- ────────────────────────────────────────────────────────────────────────
-- 21. BẢNG notifications (Thông báo hệ thống)
-- ────────────────────────────────────────────────────────────────────────
SET IDENTITY_INSERT [notifications] ON;
INSERT INTO [notifications] ([notification_id], [user_id], [title], [content], [type], [ref_type], [ref_id], [is_read], [created_at], [read_at]) VALUES
(1, 6, N'Đặt lịch thành công!', N'Mã lịch chụp BK20260520-001 đã được gửi tới studio phê duyệt.', 'BOOKING', 'BOOKING', 1, 1, DATEADD(day, -5, SYSUTCDATETIME()), SYSUTCDATETIME()),
(2, 2, N'Lịch đặt mới chờ duyệt', N'Khách hàng Quốc Huy đã đặt lịch phóng sự cưới Premium vào cuối tuần này.', 'BOOKING', 'BOOKING', 1, 0, DATEADD(day, -5, SYSUTCDATETIME()), NULL),
(3, 7, N'Lịch chụp đã hoàn thành!', N'Hồ sơ Pre-wedding BK20260520-002 đã hoàn thành. Hãy gửi đánh giá nhé!', 'REVIEW', 'BOOKING', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 3, N'Nhận thanh toán thành công!', N'Tiền thanh toán lịch BK20260520-002 đã được cộng vào số dư holding ví.', 'PAYMENT', 'BOOKING', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 8, N'Lịch chụp đã sẵn sàng', N'Nam Studio đã nhận lịch BK20260520-003 ngày mai của bạn.', 'BOOKING', 'BOOKING', 3, 1, DATEADD(day, -1, SYSUTCDATETIME()), SYSUTCDATETIME()),
(6, 9, N'Cảnh báo tranh chấp mới', N'Có khiếu nại tranh chấp phát sinh tại lịch chụp cưới VIP BK20260520-010.', 'DISPUTE', 'BOOKING', 10, 0, SYSUTCDATETIME(), NULL),
(7, 10, N'Hủy lịch thành công', N'Yêu cầu hủy lịch chụp BK20260520-008 đã được chấp thuận.', 'CANCEL', 'BOOKING', 8, 1, DATEADD(day, -3, SYSUTCDATETIME()), SYSUTCDATETIME()),
(8, 2, N'Yêu cầu Studio phê duyệt', N'Hồ sơ của Hùng Studio đã được quản trị viên duyệt đưa lên hệ thống.', 'SYSTEM', 'STUDIO', 1, 1, DATEADD(day, -10, SYSUTCDATETIME()), SYSUTCDATETIME()),
(9, 3, N'Ví tiền được cập nhật', N'Đã cộng 13,500,000 VND từ lịch hoàn thành BK20260520-002.', 'PAYMENT', 'BOOKING', 2, 0, SYSUTCDATETIME(), NULL),
(10, 6, N'Mã giảm giá hot cuối tuần!', N'Nhập ngay GO-PHOTO để nhận ưu đãi giảm 10% cho mọi dịch vụ chụp ảnh cưới.', 'PROMOTION', 'SYSTEM', 0, 0, SYSUTCDATETIME(), NULL);
SET IDENTITY_INSERT [notifications] OFF;
GO

-- Kích hoạt lại các Trigger sau khi đã insert xong dữ liệu mẫu
ALTER TABLE [bookings] ENABLE TRIGGER ALL;
ALTER TABLE [reviews] ENABLE TRIGGER ALL;
GO

PRINT '========================================================================'
PRINT ' ĐÃ INSERT THÀNH CÔNG 10 DÒNG DỮ LIỆU MẪU CAO CẤP VÀO TẤT CẢ CÁC BẢNG!'
PRINT ' MẬT KHẨU ĐĂNG NHẬP MẶC ĐỊNH CHO MỌI ACCOUNT LÀ: 123456'
PRINT '========================================================================'
GO
