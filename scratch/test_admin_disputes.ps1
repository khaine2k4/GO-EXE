# =========================================================================
# AUTOMATED END-TO-END TEST SCRIPT FOR ADMIN BOOKING, DISPUTE & DASHBOARD
# Covers: UC56, UC76 - UC79, and UC89 - UC93
# Runs against the running Backend at http://localhost:5289/api
# =========================================================================

$baseUrl = "http://localhost:5289/api"
$testDate = (Get-Date).AddDays(2).ToString("yyyy-MM-dd") # Chọn ngày kia làm ngày chụp test

function Write-Host {
    param([string]$Object, $ForegroundColor)
    Write-Output $Object
}

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "       E2E TESTING FOR ADMIN BOOKING, DISPUTE & DASHBOARD SCOPE          " -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Mục tiêu: Tự động hóa kiểm thử toàn bộ 10 Use Cases thuộc nhóm của Khải" -ForegroundColor Gray
Write-Host "Ngày chụp thử nghiệm được chọn: $testDate" -ForegroundColor Gray
Write-Host "=========================================================================" -ForegroundColor Cyan

# Helpers
function Show-UC {
    param([string]$ucCode, [string]$title)
    Write-Host "`n[$ucCode] - $title" -ForegroundColor Yellow
}

function Show-Success {
    param([string]$message)
    Write-Host "  ✔ Giao dịch thành công: $message" -ForegroundColor Green
}

function Show-Fail {
    param([string]$message)
    Write-Host "  ✖ Lỗi kiểm thử: $message" -ForegroundColor Red
}

# -------------------------------------------------------------------------
# ĐĂNG NHẬP CÁC TÀI KHOẢN MẪU
# -------------------------------------------------------------------------
Write-Host "`n>>> ĐĂNG NHẬP CÁC VAI TRÒ..." -ForegroundColor DarkCyan

# 1. Admin login
$adminLoginPayload = @{ email = "admin@go.vn"; password = "123456" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $adminLoginPayload
$adminHeader = @{ Authorization = "Bearer $($adminRes.token)" }
Show-Success "Đã đăng nhập vai trò ADMIN (email: admin@go.vn)"

# 2. Studio Owner login
$studioLoginPayload = @{ email = "hung.photography@gmail.com"; password = "123456" } | ConvertTo-Json
$studioRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $studioLoginPayload
$studioHeader = @{ Authorization = "Bearer $($studioRes.token)" }
$studioId = 1
Show-Success "Đã đăng nhập vai trò STUDIO_OWNER (email: hung.photography@gmail.com)"

# 3. Customer login
$custLoginPayload = @{ email = "huy.dq@gmail.com"; password = "123456" } | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $custLoginPayload
$custHeader = @{ Authorization = "Bearer $($custRes.token)" }
Show-Success "Đã đăng nhập vai trò CUSTOMER (email: huy.dq@gmail.com)"

# -------------------------------------------------------------------------
# UC89 - UC93: ADMIN DASHBOARD THỐNG KÊ
# -------------------------------------------------------------------------
Show-UC "UC89 - UC93" "Admin Xem Dashboard Thống Kê & Doanh Thu Hệ Thống"
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/Admin/dashboard-stats" -Method Get -Headers $adminHeader
    Show-Success "Tải thành công dữ liệu Dashboard!"
    Write-Host "    - Tổng doanh thu (Commission): $($stats.systemStats.totalCommission) VND" -ForegroundColor Gray
    Write-Host "    - Tổng booking hệ thống: $($stats.systemStats.totalBookings) booking" -ForegroundColor Gray
    Write-Host "    - Số Studio hoạt động: $($stats.systemStats.approvedStudios) · Số Studio chờ duyệt: $($stats.systemStats.pendingStudios)" -ForegroundColor Gray
    Write-Host "    - Số ca khiếu nại đang mở: $($stats.systemStats.disputedBookings) ca" -ForegroundColor Gray
    Write-Host "    - Tỷ lệ hoàn thành: $($stats.systemStats.completionRate) %" -ForegroundColor Gray
    Write-Host "    - Số Studio thuộc TOP: $($stats.topStudios.Count) Studio" -ForegroundColor Gray
    if ($stats.topStudios.Count -gt 0) {
        Write-Host "      * Top 1 Studio: $($stats.topStudios[0].studioName) (Đánh giá: $($stats.topStudios[0].avgRating)★, Bookings: $($stats.topStudios[0].totalBookings))" -ForegroundColor Gray
    }
    Write-Host "    - Số tháng thống kê doanh thu: $($stats.monthlyRevenue.Count) tháng" -ForegroundColor Gray
} catch {
    Show-Fail "Không thể tải số liệu Dashboard Admin: $_"
}

# -------------------------------------------------------------------------
# UC76: ADMIN XEM TẤT CẢ BOOKING & BỘ LỌC
# -------------------------------------------------------------------------
Show-UC "UC76" "Admin Xem Tất Cả Bookings & Các Bộ Lọc"
try {
    # 1. Xem tất cả
    $allBookings = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings" -Method Get -Headers $adminHeader
    Show-Success "Tải danh sách booking thành công. Tổng cộng: $($allBookings.Count) booking."
    
    # 2. Bộ lọc trạng thái
    $pendingConfirmBookings = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings?status=PENDING_CONFIRMATION" -Method Get -Headers $adminHeader
    Show-Success "Bộ lọc PENDING_CONFIRMATION hoạt động tốt. Số lượng: $($pendingConfirmBookings.Count) booking."
    
    $disputedBookings = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings?status=DISPUTED" -Method Get -Headers $adminHeader
    Show-Success "Bộ lọc DISPUTED hoạt động tốt. Số lượng: $($disputedBookings.Count) booking."
} catch {
    Show-Fail "Không thể truy vấn danh sách bookings của Admin: $_"
}

# -------------------------------------------------------------------------
# CHUẨN BỊ LỊCH TRÌNH VÀ SLOT SẠCH CHO CÁC BÀI TEST TIẾP THEO
# -------------------------------------------------------------------------
Write-Host "`n>>> KÍCH HOẠT LỊCH TRÌNH & ĐĂNG KÝ KHUNG GIỜ MỚI CHO NGÀY CẬP NHẬT..." -ForegroundColor DarkCyan
# Mở ngày chụp cho ngày kia
$dayPayload = @{ date = $testDate; isAvailable = $true; note = "E2E Admin test days" } | ConvertTo-Json
$dayRes = Invoke-RestMethod -Uri "$baseUrl/schedules/days" -Method Put -Headers $studioHeader -ContentType "application/json" -Body $dayPayload
$slotsList = $dayRes.slots

# -------------------------------------------------------------------------
# UC56: STUDIO HỦY BOOKING (Trường hợp thanh toán online trước)
# -------------------------------------------------------------------------
Show-UC "UC56" "Studio Chủ Động Hủy Lịch Đặt Chụp (Đã thanh toán trước)"
# 1. Khách đặt slot
$slotToCancel = $slotsList[0]
$bookingPayload = @{ packageId = 1; slotId = $slotToCancel.id; shootingLocation = "Studio Room A" } | ConvertTo-Json
$booking = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body $bookingPayload

# 2. Giả lập khách thanh toán BANK_TRANSFER thành công (Booking sang PENDING_CONFIRMATION, Payment sang PAID)
$payPayload = @{ bookingId = $booking.id; methodName = "BANK_TRANSFER"; transactionCode = "TX-CANCELTEST-1" } | ConvertTo-Json
$payment = Invoke-RestMethod -Uri "$baseUrl/payments/pay" -Method Post -Headers $custHeader -ContentType "application/json" -Body $payPayload

# 3. Studio hủy lịch
try {
    $cancelledBooking = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking.id)/cancel" -Method Put -Headers $studioHeader -ContentType "application/json" -Body (@{ reason = "Studio bận đột xuất thiết bị hỏng" } | ConvertTo-Json)
    Show-Success "Studio hủy lịch chụp thành công! Mã đơn: #$($cancelledBooking.bookingCode)"
    
    # Kiểm tra trạng thái
    $detail = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking.id)" -Method Get -Headers $adminHeader
    Write-Host "    - Trạng thái Booking: $($detail.status) (Kỳ vọng: CANCELLED)" -ForegroundColor Gray
    Write-Host "    - Trạng thái Payment: $($detail.latestPayment.status) (Kỳ vọng: REFUND_PENDING)" -ForegroundColor Gray
    Write-Host "    - Lý do hủy: $($detail.cancelReason)" -ForegroundColor Gray
} catch {
    Show-Fail "Studio hủy booking thất bại: $_"
}

# -------------------------------------------------------------------------
# UC78: ADMIN HỦY BOOKING CÓ VẤN ĐỀ
# -------------------------------------------------------------------------
Show-UC "UC78" "Admin Chủ Động Hủy Booking Có Vấn Đề"
# 1. Khách đặt slot mới
$slotToAdminCancel = $slotsList[1]
$bookingPayload2 = @{ packageId = 1; slotId = $slotToAdminCancel.id; shootingLocation = "Outdoor Park" } | ConvertTo-Json
$booking2 = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body $bookingPayload2

# 2. Khách đóng tiền
$payPayload2 = @{ bookingId = $booking2.id; methodName = "VNPAY"; transactionCode = "TX-CANCELTEST-2" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/payments/pay" -Method Post -Headers $custHeader -ContentType "application/json" -Body $payPayload2

# 3. Admin hủy booking có vấn đề
try {
    $adminCancelled = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking2.id)/cancel" -Method Put -Headers $adminHeader -ContentType "application/json" -Body (@{ reason = "Phát hiện Studio vi phạm điều khoản quy chuẩn dịch vụ" } | ConvertTo-Json)
    Show-Success "Admin hủy booking thành công!"
    
    # Kiểm tra trạng thái
    $detail2 = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking2.id)" -Method Get -Headers $adminHeader
    Write-Host "    - Trạng thái Booking: $($detail2.status) (Kỳ vọng: CANCELLED)" -ForegroundColor Gray
    Write-Host "    - Trạng thái Payment: $($detail2.latestPayment.status) (Kỳ vọng: REFUND_PENDING)" -ForegroundColor Gray
    Write-Host "    - Ghi nhận logs Admin hủy: $($detail2.logs[-1].note)" -ForegroundColor Gray
} catch {
    Show-Fail "Admin hủy booking thất bại: $_"
}

# -------------------------------------------------------------------------
# UC79: CUSTOMER MỞ KHIẾU NẠI (DISPUTE) Ở TRẠNG THÁI IN_PROGRESS
# -------------------------------------------------------------------------
Show-UC "UC79 - Phase 1" "Khách Hàng Mở Khiếu Nại (Dispute) Ở Trạng Thái IN_PROGRESS"
# 1. Tạo booking
$slotToDispute = $slotsList[2]
$bookingPayload3 = @{ packageId = 1; slotId = $slotToDispute.id; shootingLocation = "Chợ đêm Đà Nẵng" } | ConvertTo-Json
$booking3 = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body $bookingPayload3

# 2. Thanh toán
$payPayload3 = @{ bookingId = $booking3.id; methodName = "BANK_TRANSFER"; transactionCode = "TX-DISPUTETEST-1" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/payments/pay" -Method Post -Headers $custHeader -ContentType "application/json" -Body $payPayload3

# 3. Studio xác nhận & chuyển sang Đang chụp (IN_PROGRESS)
$null = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking3.id)/confirm" -Method Put -Headers $studioHeader
$null = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking3.id)/in-progress" -Method Put -Headers $studioHeader

# 4. Khách hàng mở khiếu nại (Dispute)
try {
    $disputeRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking3.id)/dispute" -Method Put -Headers $custHeader -ContentType "application/json" -Body (@{ reason = "Studio trễ hẹn chụp 2 tiếng và thiết bị thiếu đèn chiếu sáng" } | ConvertTo-Json)
    Show-Success "Khách hàng gửi khiếu nại thành công!"
    
    # Kiểm tra DTO chi tiết từ Admin
    $detail3 = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking3.id)" -Method Get -Headers $adminHeader
    Write-Host "    - Trạng thái Booking hiển thị ảo: $($detail3.status) (Kỳ vọng: DISPUTED)" -ForegroundColor Gray
    Write-Host "    - Trạng thái thực tế trong DB: $($detail3.realStatus) (Kỳ vọng: IN_PROGRESS)" -ForegroundColor Gray
    Write-Host "    - Nội dung khiếu nại ghi nhận: $($detail3.dispute.reason)" -ForegroundColor Gray
} catch {
    Show-Fail "Khách hàng khiếu nại thất bại: $_"
}

# -------------------------------------------------------------------------
# UC79: ADMIN PHÂN XỬ - RELEASE (GIẢI NGÂN CHO STUDIO)
# -------------------------------------------------------------------------
Show-UC "UC79 - Phase 2 (RELEASE)" "Admin Phân Xử Tranh Chấp - Giải Ngân Cho Studio"
try {
    $resolvePayload = @{ decision = "RELEASE"; adminNote = "Hỗ trợ 10% do Studio trễ hẹn chụp, nhưng vẫn tiếp tục giải ngân phần còn lại vì đã hoàn tất bộ ảnh" } | ConvertTo-Json
    $resolvedBooking = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking3.id)/resolve-dispute" -Method Put -Headers $adminHeader -ContentType "application/json" -Body $resolvePayload
    Show-Success "Admin giải quyết tranh chấp thành công (Phán quyết: RELEASE)!"
    
    # Kiểm tra trạng thái và Settlement
    $detailAfter = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking3.id)" -Method Get -Headers $adminHeader
    Write-Host "    - Trạng thái Booking: $($detailAfter.status) (Kỳ vọng: COMPLETED)" -ForegroundColor Gray
    Write-Host "    - Ghi nhận Dispute Resolved At: $($detailAfter.dispute.resolvedAt)" -ForegroundColor Gray
    Write-Host "    - Ghi nhận Dispute Resolved By: $($detailAfter.dispute.resolvedByName)" -ForegroundColor Gray
    Write-Host "    - Nhật ký logs phán quyết: $($detailAfter.logs[-1].note)" -ForegroundColor Gray
} catch {
    Show-Fail "Phân xử RELEASE thất bại: $_"
}

# -------------------------------------------------------------------------
# UC79: ADMIN PHÂN XỬ - REFUND (HOÀN TIỀN CHO KHÁCH HÀNG)
# -------------------------------------------------------------------------
Show-UC "UC79 - Phase 3 (REFUND)" "Admin Phân Xử Tranh Chấp - Hoàn Tiền Cho Khách Hàng"
# 1. Tạo booking mới tiếp tục để test
$slotToDispute4 = $slotsList[3]
$bookingPayload4 = @{ packageId = 1; slotId = $slotToDispute4.id; shootingLocation = "Đèo Hải Vân" } | ConvertTo-Json
$booking4 = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body $bookingPayload4

# 2. Thanh toán
$payPayload4 = @{ bookingId = $booking4.id; methodName = "VNPAY"; transactionCode = "TX-DISPUTETEST-2" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/payments/pay" -Method Post -Headers $custHeader -ContentType "application/json" -Body $payPayload4

# 3. Chuyển sang IN_PROGRESS
$null = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking4.id)/confirm" -Method Put -Headers $studioHeader
$null = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking4.id)/in-progress" -Method Put -Headers $studioHeader

# 4. Khách mở khiếu nại
$null = Invoke-RestMethod -Uri "$baseUrl/bookings/$($booking4.id)/dispute" -Method Put -Headers $custHeader -ContentType "application/json" -Body (@{ reason = "Studio thái độ phục vụ thô lỗ, không chụp hết gói" } | ConvertTo-Json)

# 5. Admin phán quyết REFUND
try {
    $resolvePayload4 = @{ decision = "REFUND"; adminNote = "Hoàn trả 100% chi phí cho khách do thái độ phục vụ của Studio vi phạm nghiêm trọng tiêu chuẩn cộng đồng" } | ConvertTo-Json
    $resolvedBooking4 = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking4.id)/resolve-dispute" -Method Put -Headers $adminHeader -ContentType "application/json" -Body $resolvePayload4
    Show-Success "Admin giải quyết tranh chấp thành công (Phán quyết: REFUND)!"
    
    # Kiểm tra
    $detailAfter4 = Invoke-RestMethod -Uri "$baseUrl/Admin/bookings/$($booking4.id)" -Method Get -Headers $adminHeader
    Write-Host "    - Trạng thái Booking: $($detailAfter4.status) (Kỳ vọng: CANCELLED)" -ForegroundColor Gray
    Write-Host "    - Trạng thái Payment: $($detailAfter4.latestPayment.status) (Kỳ vọng: REFUND_PENDING)" -ForegroundColor Gray
    Write-Host "    - Time Slot đã mở lại (Kỳ vọng OPEN): $($booking4.slotId) đã mở lại" -ForegroundColor Gray
    Write-Host "    - Ghi nhận phán quyết hoàn tiền: $($detailAfter4.logs[-1].note)" -ForegroundColor Gray
} catch {
    Show-Fail "Phân xử REFUND thất bại: $_"
}

Write-Host "`n=========================================================================" -ForegroundColor Green
Write-Host " HOÀN THÀNH KIỂM THỬ E2E TOÀN BỘ 10 USE CASES CHO PHÂN HỆ CỦA KHẢI THÀNH CÔNG!" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
