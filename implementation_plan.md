# Kế Hoạch Triển Khai: Luồng Đặt Lịch, Thanh Toán & Quản Lý Slot Rút Gọn (MVP) - Phase 2 (Hoàn Thiện Tích Hợp VNPay & Nghiệp Vụ Admin/Studio)

Kế hoạch này tập trung vào việc hoàn thiện các phần còn thiếu của hệ thống MVP dựa trên các nghiệp vụ đã hoàn thành. Chúng tôi sẽ hiện thực hóa kết nối VNPay Sandbox thật, xây dựng giao diện hoàn tiền Admin (REFUND_PENDING -> REFUNDED), trang quản lý Booking đầy đủ của Studio kèm Calendar View (UC52) trực quan, và bổ sung cấu hình vào `appsettings.json`.

---

## 📋 Các Tính Năng Triển Khai (Phase 2)

### 1. Tích Hợp Cổng Thanh Toán VNPay Sandbox Thật
*   **VnPayLibrary.cs**: Xây dựng thư viện mã hóa chữ ký HMAC-SHA512, sắp xếp tham số Alphabetical theo đúng chuẩn kỹ thuật của VNPay.
*   **Tham số cấu hình**: Bổ sung `VnPay` cấu hình test Sandbox vào `appsettings.json`:
    *   `TmnCode`: `2QXUI4J4`
    *   `HashSecret`: `RA857345HPAZGRIEGKEXZ6295`
    *   `BaseUrl`: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
*   **API Endpoints (`PaymentsController.cs`)**:
    *   `POST /api/payments/vnpay-create`: Tạo đường link thanh toán (Payment URL) cho Booking đã tạo nháp, chuyển hướng người dùng đến VNPay Sandbox.
    *   `GET /api/payments/vnpay-return` (Webhook Return): VNPay chuyển hướng Client về. Hệ thống xác thực chữ ký bảo mật, cập nhật Booking sang `PENDING_CONFIRMATION`, Payment sang `PAID`, Slot sang `BOOKED` (trong Transaction an toàn). Sau đó Redirect trình duyệt về trang Frontend: `http://localhost:5173/customer/bookings/{bookingId}?paymentStatus=success`.
    *   `GET /api/payments/vnpay-ipn` (IPN Asynchronous Call): VNPay gọi ngầm. Xác thực chữ ký, số tiền, trạng thái hiện tại. Đảm bảo tính **Idempotent** (chống cập nhật trùng lặp), phản hồi JSON chuẩn cho VNPay:
        ```json
        { "RspCode": "00", "Message": "Confirm success" }
        ```

---

### 2. Giao Diện Admin Quản Lý Hoàn Tiền (Admin Refund Page)
*   **Đồng bộ API**: Cập nhật `AdminPaymentStatus` trong `adminPaymentApi.ts` để hỗ trợ trạng thái `REFUND_PENDING` (chờ hoàn tiền).
*   **Tích hợp UI (`AdminPaymentsPage.tsx`)**:
    *   Bổ sung lựa chọn bộ lọc trạng thái "Refund Pending" để Admin dễ dàng lọc ra danh sách các đơn yêu cầu hoàn tiền.
    *   Thêm badge hiển thị màu sắc trực quan riêng cho `REFUND_PENDING`.
    *   Khi bấm nút cập nhật trạng thái sang `REFUNDED` tại popup, Admin nhập mã giao dịch hoàn trả (Transaction Code) và lý do. Hệ thống sẽ gọi API `PATCH /api/Admin/payments/{id}/status` sẵn có để cập nhật trạng thái thanh toán sang `REFUNDED` và lưu trữ thời gian hoàn tiền thực tế.

---

### 3. Giao Diện Quản Lý Booking Của Studio (Studio Booking UI & Calendar View)
*   **Đường dẫn Route mới**:
    *   Tạo trang mới `PhotographerBookingsPage.tsx`.
    *   Đăng ký Route `/photographer/bookings` trong `App.tsx`.
    *   Thêm liên kết "Bookings" trực tiếp vào Sidebar Menu cho vai trò `PHOTOGRAPHER` trong `Layout.tsx`.
*   **Giao Diện Phân Loại 2 Tabs**:
    *   **Tab 1: Danh sách (List View)**: Hiển thị các booking yêu cầu của Studio, sắp xếp theo thời gian mới nhất. Cho phép chủ Studio thực hiện hành động nhanh ngay tại danh sách hoặc chuyển hướng đến trang Chi tiết:
        *   Confirm (Xác nhận nhận Job): `PENDING_CONFIRMATION` -> `CONFIRMED`
        *   Reject (Từ chối): `PENDING_CONFIRMATION` -> `REJECTED` (Hoàn tiền `REFUND_PENDING`)
        *   Start (Đang chụp): `CONFIRMED` -> `IN_PROGRESS`
        *   Complete (Hoàn thành): `IN_PROGRESS` -> `COMPLETED` (Tạo bản ghi Settlements 10%-90%)
    *   **Tab 2: Lịch chụp (Calendar View - UC52)**:
        *   Hiển thị lưới lịch tháng (Calendar Grid) trực quan.
        *   Những ngày có lịch chụp sẽ được hiển thị chấm màu hoặc số lượng booking.
        *   Khi bấm chọn ngày, danh sách các lịch chụp trong ngày đó sẽ hiện bên dưới kèm thông tin chi tiết (Giờ chụp, gói dịch vụ, khách hàng) giúp Studio quản lý lịch biểu dễ dàng.

---

### 4. Cấu Hình Hệ Thống & Kiểm Thử End-to-End
*   **appsettings.json**: Bổ sung các tham số MVP thiếu:
    *   `"BookingHoldMinutes": 15`
    *   `"ExpiryWorkerIntervalSeconds": 60`
*   **Kiểm thử tích hợp**:
    1.  Khách đặt lịch trực tiếp trên UI -> Chuyển hướng sang VNPay Sandbox -> Thanh toán thành công -> Tự động quay về và ghi nhận `PENDING_CONFIRMATION`.
    2.  Studio xem yêu cầu trên Dashboard/Calendar -> Bấm Xác nhận hoặc Từ chối -> Dòng tiền phản ánh chính xác.
    3.  Thực hiện hoàn thành đơn hàng -> Ghi nhận dòng tiền quyết toán Settlement -> Admin duyệt Payout.

---

## ⚡ Proposed Changes

### 1. Backend Core & Configuration

#### [MODIFY] [appsettings.json](file:///d:/hocdiiiii/exxe/GO-EXE/EXE201.Server/appsettings.json)
Bổ sung các tham số `"BookingHoldMinutes"`, `"ExpiryWorkerIntervalSeconds"`, và cấu hình `"VnPay"` Sandbox.

#### [NEW] [VnPayLibrary.cs](file:///d:/hocdiiiii/exxe/GO-EXE/EXE201.Server/Utils/VnPayLibrary.cs)
Xây dựng thư viện tạo URL thanh toán và xác thực chữ ký SHA512.

#### [MODIFY] [PaymentsController.cs](file:///d:/hocdiiiii/exxe/GO-EXE/EXE201.Server/Controllers/PaymentsController.cs)
*   Thêm endpoint `POST api/payments/vnpay-create` tạo link thanh toán.
*   Thêm endpoint `GET api/payments/vnpay-return` xác thực và cập nhật trạng thái khi thanh toán thành công, redirect về client.
*   Thêm endpoint `GET api/payments/vnpay-ipn` xác thực và phản hồi VnPay ngầm.

---

### 2. Frontend API & Routes

#### [MODIFY] [bookingApi.ts](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/services/bookingApi.ts)
*   Thêm API `confirmBooking`, `rejectBooking`, `markInProgress`, `completeBooking`.
*   Thêm API tạo link thanh toán VNPay: `vnpayCreatePaymentUrl`.

#### [MODIFY] [adminPaymentApi.ts](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/services/adminPaymentApi.ts)
Bổ sung trạng thái `'REFUND_PENDING'` vào TypeScript Type `AdminPaymentStatus`.

#### [MODIFY] [App.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/App.tsx)
Đăng ký route mới `/photographer/bookings`.

#### [MODIFY] [Layout.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/components/Layout.tsx)
Đưa đường dẫn `/photographer/bookings` vào Menu Navbar của Photographer.

---

### 3. Frontend Pages & UI Components

#### [MODIFY] [BookingModal.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/components/BookingModal.tsx)
*   Thêm tuỳ chọn phương thức thanh toán "VNPAY Online".
*   Nếu chọn VNPAY, sau khi tạo Booking nháp thành công, tự động chuyển hướng trình duyệt đến URL thanh toán VNPay Sandbox thực tế.

#### [MODIFY] [AdminPaymentsPage.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/pages/AdminPaymentsPage.tsx)
*   Thêm lựa chọn trạng thái bộ lọc `'REFUND_PENDING'` (Chờ hoàn tiền).
*   Cập nhật badge màu sắc và hỗ trợ nút chuyển đổi trạng thái sang `'REFUNDED'`.

#### [NEW] [PhotographerBookingsPage.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/pages/PhotographerBookingsPage.tsx)
*   Xây dựng giao diện danh sách booking (List View) và lịch chụp tháng (Calendar View - UC52).
*   Tích hợp các nút điều khiển trực tiếp trạng thái Job (Xác nhận, Từ chối, Bắt đầu chụp, Hoàn thành).

#### [MODIFY] [PhotographerBookingDetailPage.tsx](file:///d:/hocdiiiii/exxe/GO-EXE/exe201.client/src/pages/PhotographerBookingDetailPage.tsx)
Refactor để gọi API thật của backend thay vì dùng in-memory mock.
