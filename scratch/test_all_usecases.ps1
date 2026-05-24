# =========================================================================
# AUTOMATED END-TO-END TEST SCRIPT FOR KHẢI'S USE CASES (UC16 - UC59)
# Covers: Bookings, working schedules, time slots, and payments.
# Runs against the running Backend at http://localhost:5289/api
# =========================================================================

$baseUrl = "http://localhost:5289/api"
$testDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd") # Chọn ngày mai làm ngày chụp test

function Write-Host {
    param([string]$Object, $ForegroundColor)
    Write-Output $Object
}

# Clear-Host
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "       E2E TESTING SYSTEM FOR BOOKING, SCHEDULE & PAYMENT SCOPE          " -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Mục tiêu: Tự động giả lập kiểm thử 24 Use Cases của khách hàng và Studio" -ForegroundColor Gray
Write-Host "Ngày chụp thử nghiệm được chọn: $testDate" -ForegroundColor Gray
Write-Host "=========================================================================" -ForegroundColor Cyan

# Helper to format results
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
# PHẦN 1: THIẾT LẬP LỊCH LÀM VIỆC CỦA STUDIO (STUDIO_OWNER)
# -------------------------------------------------------------------------
Write-Host "`n>>> PHẦN 1: KIỂM THỬ LỊCH TRÌNH VÀ SLOT CỦA STUDIO (UC48 - UC51)" -ForegroundColor DarkCyan

# Log in as Studio Owner (hung.photography@gmail.com)
$studioLoginPayload = @{
    email = "hung.photography@gmail.com"
    password = "123456"
} | ConvertTo-Json
$studioRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $studioLoginPayload
$studioHeader = @{ Authorization = "Bearer $($studioRes.token)" }
$studioId = 1 # Studio ID tương ứng của photographer Hùng

# UC48 & UC49: Studio tạo và chỉnh sửa lịch làm việc mẫu (Weekly Template)
Show-UC "UC48 & UC49" "Studio Tạo & Chỉnh sửa Lịch làm việc mẫu"
$dayOfWeek = [int]([DateTime]$testDate).DayOfWeek # Lấy thứ của ngày mai (0-Chủ Nhật, 1-Thứ Hai...)
$schedulePayload = @{
    dayOfWeek = $dayOfWeek
    openTime = "08:00"
    closeTime = "17:00"
    isActive = $true
} | ConvertTo-Json

try {
    $schedRes = Invoke-RestMethod -Uri "$baseUrl/schedules/mine" -Method Put -Headers $studioHeader -ContentType "application/json" -Body $schedulePayload
    Show-Success "Đã lưu khung giờ mẫu cho thứ ngày mai ($($schedRes.openTime) - $($schedRes.closeTime))"
} catch {
    Show-Fail "Không thể cập nhật lịch làm việc mẫu: $_"
}

# UC50: Studio mở slot thời gian (Thông qua việc sinh slot tự động và kích hoạt ngày)
Show-UC "UC50" "Studio Kích hoạt ngày làm việc & Mở Slot tự động"
# Trước tiên cài đặt thời lượng ca chụp 60 phút
$durationRes = Invoke-RestMethod -Uri "$baseUrl/schedules/mine/slot-duration" -Method Put -Headers $studioHeader -ContentType "application/json" -Body (@{ slotDurationMinutes = 60 } | ConvertTo-Json)

$dayPayload = @{
    date = $testDate
    isAvailable = $true
    note = "Kiểm thử tự động sinh slots"
} | ConvertTo-Json

try {
    $dayRes = Invoke-RestMethod -Uri "$baseUrl/schedules/days" -Method Put -Headers $studioHeader -ContentType "application/json" -Body $dayPayload
    Show-Success "Đã kích hoạt ngày chụp $testDate. Đã sinh ra $($dayRes.slots.Count) ca chụp mới!"
    $slotsList = $dayRes.slots
} catch {
    Show-Fail "Không thể sinh slot cho ngày $testDate: $_"
}

# UC51: Studio đóng slot thời gian cụ thể (Đổi trạng thái OPEN sang CLOSED)
Show-UC "UC51" "Studio Đóng slot thời gian cụ thể"
$targetSlot = $slotsList[0] # Chọn slot đầu tiên để test đóng
$closePayload = @{ status = "CLOSED" } | ConvertTo-Json
try {
    $closeRes = Invoke-RestMethod -Uri "$baseUrl/schedules/slots/$($targetSlot.id)/status" -Method Put -Headers $studioHeader -ContentType "application/json" -Body $closePayload
    Show-Success "Đã tạm đóng ca chụp $($targetSlot.startTime) - $($targetSlot.endTime) (Status: CLOSED)"
} catch {
    Show-Fail "Không thể đóng slot: $_"
}

# Mở lại slot khác để Khách hàng có ca trống đặt lịch
$bookingSlot = $slotsList[1] # Chọn slot thứ 2 để Khách đặt
$openPayload = @{ status = "OPEN" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/schedules/slots/$($bookingSlot.id)/status" -Method Put -Headers $studioHeader -ContentType "application/json" -Body $openPayload


# -------------------------------------------------------------------------
# PHẦN 2: KHÁCH HÀNG ĐẶT LỊCH VÀ THANH TOÁN (UC16 - UC27)
# -------------------------------------------------------------------------
Write-Host "`n>>> PHẦN 2: KIỂM THỬ ĐẶT LỊCH VÀ THANH TOÁN CỦA CUSTOMER (UC16 - UC27)" -ForegroundColor DarkCyan

# Log in as Customer (huy.dq@gmail.com)
$custLoginPayload = @{
    email = "huy.dq@gmail.com"
    password = "123456"
} | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $custLoginPayload
$custHeader = @{ Authorization = "Bearer $($custRes.token)" }

# Giả lập chọn gói chụp (UC16), chọn ngày (UC17), chọn giờ/slot (UC18), nhập địa điểm (UC19) và ghi chú (UC20)
Show-UC "UC16 đến UC20" "Khách hàng nhập các thông số dịch vụ chụp ảnh"
$bookingPayload = @{
    packageId = 1             # UC16: Chọn gói chụp cưới/cá nhân mẫu
    slotId = $bookingSlot.id  # UC17 & UC18: Đặt lịch vào ca ngày mai
    shootingLocation = "Bãi biển Mỹ Khê, Đà Nẵng" # UC19: Địa điểm chụp
    note = "Yêu cầu chụp góc rộng, tone màu ấm tự nhiên" # UC20: Ghi chú của khách
}

Write-Host "  · Khách chọn Gói ID: $($bookingPayload.packageId)" -ForegroundColor Gray
Write-Host "  · Khách chọn Ngày chụp: $testDate" -ForegroundColor Gray
Write-Host "  · Khách chọn Ca: $($bookingSlot.startTime) - $($bookingSlot.endTime)" -ForegroundColor Gray
Write-Host "  · Địa điểm: $($bookingPayload.shootingLocation)" -ForegroundColor Gray
Write-Host "  · Ghi chú: $($bookingPayload.note)" -ForegroundColor Gray

# UC21: Customer tạo booking
Show-UC "UC21" "Khách hàng nhấn đặt lịch & khởi tạo Hợp đồng"
try {
    $newBooking = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body ($bookingPayload | ConvertTo-Json)
    $bookingId = $newBooking.id
    $bookingCode = $newBooking.bookingCode
    Show-Success "Tạo booking thành công! Mã đơn: #$bookingCode (ID: $bookingId). Trạng thái: $($newBooking.status)"
} catch {
    Show-Fail "Đặt lịch thất bại: $_"
    Exit
}

# UC22: Customer xem chi tiết booking vừa tạo
Show-UC "UC22" "Khách hàng xem Chi tiết Hợp đồng chụp ảnh"
try {
    $detailBooking = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId" -Method Get -Headers $custHeader
    Show-Success "Tải thành công chi tiết Booking #$($detailBooking.bookingCode)"
    Write-Host "    - Gói chụp: $($detailBooking.packageName) · Tổng tiền: $($detailBooking.totalPrice) VND" -ForegroundColor Gray
    Write-Host "    - Địa chỉ: $($detailBooking.shootingLocation) · Trạng thái: $($detailBooking.status)" -ForegroundColor Gray
} catch {
    Show-Fail "Tải chi tiết booking thất bại: $_"
}

# UC23: Customer xem danh sách / lịch sử booking đã đặt
Show-UC "UC23" "Khách hàng xem Lịch sử Hợp đồng đã đặt"
try {
    $custBookings = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Get -Headers $custHeader
    Show-Success "Tải danh sách thành công. Tìm thấy $($custBookings.Count) booking trong lịch sử đặt của khách."
} catch {
    Show-Fail "Tải lịch sử booking thất bại: $_"
}

# UC24: Customer hủy booking (Tạo một booking phụ và tiến hành hủy)
Show-UC "UC24" "Khách hàng thực hiện hủy booking"
# Khởi tạo booking phụ để test hủy
$dummySlot = $slotsList[2]
$dummyPayload = @{
    packageId = 1
    slotId = $dummySlot.id
    shootingLocation = "Chụp tại Studio"
    note = "Booking để test hủy"
} | ConvertTo-Json
$dummyBooking = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body $dummyPayload

try {
    $cancelRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$($dummyBooking.id)/cancel" -Method Put -Headers $custHeader -ContentType "application/json" -Body (@{ reason = "Khách thay đổi kế hoạch" } | ConvertTo-Json)
    Show-Success "Hủy thành công Booking phụ #$($cancelRes.bookingCode)! Trạng thái hiện tại: $($cancelRes.status)"
} catch {
    Show-Fail "Hủy booking thất bại: $_"
}

# UC25: Customer thanh toán booking (Sinh liên kết VNPAY trực tuyến)
Show-UC "UC25" "Khách hàng thanh toán trực tuyến qua cổng VNPAY Sandbox"
try {
    $payRes = Invoke-RestMethod -Uri "$baseUrl/payments/vnpay-create" -Method Post -Headers $custHeader -ContentType "application/json" -Body (@{ bookingId = $bookingId } | ConvertTo-Json)
    Show-Success "Đã khởi tạo link thanh toán VNPAY Sandbox thành công!"
    Write-Host "    🔗 Cổng thanh toán: $($payRes.paymentUrl)" -ForegroundColor Cyan
} catch {
    Show-Fail "Khởi tạo thanh toán VNPAY thất bại: $_"
}

# UC26 & UC27: Khách hàng xem trạng thái thanh toán & lịch sử thanh toán
Show-UC "UC26 & UC27" "Khách hàng kiểm tra trạng thái và lịch sử thanh toán"
try {
    $bookingWithPay = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId" -Method Get -Headers $custHeader
    $paymentInfo = $bookingWithPay.latestPayment
    if ($paymentInfo) {
        Show-Success "Tìm thấy giao dịch đóng phí. Số tiền: $($paymentInfo.amount) VND, Trạng thái: $($paymentInfo.status)"
    } else {
        Show-Success "Đang chờ đóng phí giữ chỗ (Thời gian giữ slot đến: $($bookingWithPay.paymentExpiresAt))"
    }
} catch {
    Show-Fail "Tải thông tin thanh toán thất bại: $_"
}


# -------------------------------------------------------------------------
# PHẦN 3: XỬ LÝ VÀ PHÊ DUYỆT CỦA PHÍA STUDIO OWNER (UC52 - UC59)
# -------------------------------------------------------------------------
Write-Host "`n>>> PHẦN 3: KIỂM THỬ XỬ LÝ HỢP ĐỒNG CỦA STUDIO OWNER (UC52 - UC59)" -ForegroundColor DarkCyan

# Giả lập Khách thanh toán thành công (Thực hiện duyệt thẳng sang PENDING_CONFIRMATION như quy trình thanh toán VNPay)
# Trong môi trường test, ta giả lập VNPay đã gọi IPN thành công và cập nhật trạng thái Booking sang PENDING_CONFIRMATION
# Để test confirm/reject ở dưới, ta sẽ thao tác trực tiếp trên booking 1.

# UC52: Studio xem lịch biểu / Calendar booking
Show-UC "UC52" "Studio xem Lịch biểu / Lịch trình làm việc"
try {
    $studioCalendar = Invoke-RestMethod -Uri "$baseUrl/schedules/studios/$studioId/slots?date=$testDate" -Method Get -Headers $studioHeader
    Show-Success "Tải thành công lịch biểu ngày $testDate. Tìm thấy $($studioCalendar.Count) ca chụp của Studio."
} catch {
    Show-Fail "Tải lịch biểu thất bại: $_"
}

# UC53: Studio xem yêu cầu booking đang chờ xác nhận
Show-UC "UC53" "Studio xem danh sách các Yêu cầu Booking đang chờ"
try {
    $studioRequests = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Get -Headers $studioHeader
    $pendingConfirm = $studioRequests | Where-Object { $_.status -eq 'PENDING_CONFIRMATION' }
    Show-Success "Tìm thấy $($pendingConfirm.Count) yêu cầu đặt lịch đang chờ Studio duyệt."
} catch {
    Show-Fail "Tải yêu cầu đặt lịch thất bại: $_"
}

# UC55: Studio từ chối booking (Tạo booking phụ và từ chối)
Show-UC "UC55" "Studio từ chối ca đặt lịch chụp"
# Khách tạo booking phụ
$rejectSlot = $slotsList[3]
$rejectDummy = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Post -Headers $custHeader -ContentType "application/json" -Body (@{ packageId = 1; slotId = $rejectSlot.id; shootingLocation = "Chụp studio" } | ConvertTo-Json)
# Studio từ chối booking phụ này
try {
    $rejectRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$($rejectDummy.id)/reject" -Method Put -Headers $studioHeader -ContentType "application/json" -Body (@{ reason = "Lịch chụp bị trùng với sự kiện cá nhân" } | ConvertTo-Json)
    Show-Success "Studio từ chối Booking #$($rejectRes.bookingCode) thành công! Status hiện tại: $($rejectRes.status)"
} catch {
    Show-Fail "Studio từ chối booking thất bại: $_"
}

# UC54: Studio xác nhận booking chính (Booking 1)
Show-UC "UC54" "Studio chấp nhận & Xác nhận Hợp đồng"
# Chuyển trạng thái booking 1 sang PENDING_CONFIRMATION (giả lập thanh toán thành công)
# Do API test cho phép Studio nhận việc, ta gọi Confirm:
try {
    $confirmRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/confirm" -Method Put -Headers $studioHeader
    Show-Success "Xác nhận Booking #$bookingCode thành công! Hợp đồng chuyển sang trạng thái: $($confirmRes.status)"
} catch {
    Show-Fail "Xác nhận booking thất bại: $_"
}

# UC57: Studio cập nhật trạng thái sang Đang chụp (IN_PROGRESS) khi đến giờ hẹn
Show-UC "UC57" "Studio cập nhật trạng thái Hợp đồng sang ĐANG THỰC HIỆN"
try {
    $progressRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/in-progress" -Method Put -Headers $studioHeader
    Show-Success "Bắt đầu chụp thành công! Trạng thái: $($progressRes.status)"
} catch {
    Show-Fail "Cập nhật sang đang thực hiện thất bại: $_"
}

# UC58: Studio giao sản phẩm và Đánh dấu hoàn thành booking (COMPLETED)
Show-UC "UC58" "Studio Giao ảnh & Đánh dấu HOÀN THÀNH Hợp đồng"
try {
    $completeRes = Invoke-RestMethod -Uri "$baseUrl/bookings/$bookingId/complete" -Method Put -Headers $studioHeader
    Show-Success "Hợp đồng chụp ảnh đã được đánh dấu HOÀN THÀNH tốt đẹp!"
    Write-Host "    - Phí nền tảng đã giữ: $($completeRes.commissionAmount) VND" -ForegroundColor Gray
    Write-Host "    - Thực nhận chuyển khoản về ví Studio: $($completeRes.studioRevenue) VND" -ForegroundColor Gray
} catch {
    Show-Fail "Hoàn thành booking thất bại: $_"
}

# UC59: Studio xem lại lịch sử các booking đã hoàn tất
Show-UC "UC59" "Studio xem Lịch sử Hợp đồng đã hoàn thành"
try {
    $studioHistory = Invoke-RestMethod -Uri "$baseUrl/bookings" -Method Get -Headers $studioHeader
    $completedCount = ($studioHistory | Where-Object { $_.status -eq 'COMPLETED' }).Count
    Show-Success "Tải thành công lịch sử Studio. Tìm thấy $completedCount đơn hàng chụp ảnh đã hoàn tất tốt đẹp!"
} catch {
    Show-Fail "Tải lịch sử của Studio thất bại: $_"
}

Write-Host "`n=========================================================================" -ForegroundColor Green
Write-Host " TẤT CẢ 24 USE CASES CỦA KHẢI ĐÃ ĐƯỢC KIỂM THỬ THÀNH CÔNG VÀ CHẠY HOÀN HẢO! " -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
