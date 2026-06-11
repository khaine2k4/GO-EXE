namespace EXE201.Server.DTOs
{
    public class TimeSlotResponse
    {
        public long Id { get; set; }
        public long WorkingDayId { get; set; }
        public string Date { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string Status { get; set; } = null!;
    }

    public class WorkingDayResponse
    {
        public long Id { get; set; }
        public long StudioId { get; set; }
        public string Date { get; set; } = null!;
        public bool IsAvailable { get; set; }
        public string? Note { get; set; }
        public List<TimeSlotResponse> Slots { get; set; } = new();
    }

    public class WorkingScheduleResponse
    {
        public long Id { get; set; }
        public long StudioId { get; set; }
        public byte DayOfWeek { get; set; }
        public string OpenTime { get; set; } = null!;
        public string CloseTime { get; set; } = null!;
        public bool IsActive { get; set; }
    }

    public class UpsertWorkingScheduleRequest
    {
        public byte DayOfWeek { get; set; }
        public string OpenTime { get; set; } = null!;
        public string CloseTime { get; set; } = null!;
        public bool IsActive { get; set; } = true;
    }

    public class UpdateSlotDurationRequest
    {
        public int SlotDurationMinutes { get; set; }
    }

    public class UpsertWorkingDayRequest
    {
        public string Date { get; set; } = null!;
        public bool IsAvailable { get; set; } = true;
        public string? Note { get; set; }
    }

    public class CreateTimeSlotRequest
    {
        public string Date { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
    }

    public class UpdateTimeSlotStatusRequest
    {
        public string Status { get; set; } = null!;
    }

    public class CreateBookingRequest
    {
        public long PackageId { get; set; }
        public long SlotId { get; set; }
        public string? ShootingLocation { get; set; }
        public decimal? ShootingLat { get; set; }
        public decimal? ShootingLng { get; set; }
        public string? Note { get; set; }
    }

    public class BookingResponse
    {
        public long Id { get; set; }
        public string BookingCode { get; set; } = null!;
        public long CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public long PackageId { get; set; }
        public string PackageName { get; set; } = null!;
        public string? ServiceName { get; set; }
        public string? PackageDescription { get; set; }
        public int? PackageDurationHours { get; set; }
        public int? PackageMaxPhotos { get; set; }
        public string? PackageInclusions { get; set; }
        public long SlotId { get; set; }
        public string ShootingDate { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string? ShootingLocation { get; set; }
        public decimal? ShootingLat { get; set; }
        public decimal? ShootingLng { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = null!;
        public decimal TotalPrice { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal StudioRevenue { get; set; }
        public string? PaymentExpiresAt { get; set; }
        public bool CanCancel { get; set; }
        public bool CanRequestReschedule { get; set; }
        public bool CanRespondReschedule { get; set; }
        public bool CanMarkNoShow { get; set; }
        public BookingCancellationPolicyResponse? CancellationPolicy { get; set; }
        public BookingRescheduleRequestResponse? PendingReschedule { get; set; }
        public List<string> DemoPhotoUrls { get; set; } = new();
        public List<string> FinalPhotoUrls { get; set; } = new();
        public string? CustomerFeedback { get; set; }
        public bool CanReview { get; set; }
        public BookingReviewResponse? Review { get; set; }
        public string CreatedAt { get; set; } = null!;
        public PaymentResponse? LatestPayment { get; set; }
    }

    public class BookingActionRequest
    {
        public string? Reason { get; set; }
        public string? Note { get; set; }
    }

    public class RescheduleBookingRequest
    {
        public long NewSlotId { get; set; }
        public string? Reason { get; set; }
    }

    public class BookingCancellationPolicyResponse
    {
        public decimal RefundAmount { get; set; }
        public decimal CustomerChargeAmount { get; set; }
        public decimal StudioCompensationAmount { get; set; }
        public string PolicyCode { get; set; } = null!;
        public string Message { get; set; } = null!;
    }

    public class BookingRescheduleRequestResponse
    {
        public long NewSlotId { get; set; }
        public string NewDate { get; set; } = null!;
        public string NewStartTime { get; set; } = null!;
        public string NewEndTime { get; set; } = null!;
        public long RequestedBy { get; set; }
        public string RequestedByRole { get; set; } = null!;
        public string? Reason { get; set; }
        public string RequestedAt { get; set; } = null!;
    }

    public class PhotoDeliveryRequest
    {
        public List<string> PhotoUrls { get; set; } = new();
        public string? Note { get; set; }
    }

    public class CustomerPhotoFeedbackRequest
    {
        public string Feedback { get; set; } = null!;
    }

    public class CreateBookingReviewRequest
    {
        public byte Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class BookingReviewResponse
    {
        public long Id { get; set; }
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public string CreatedAt { get; set; } = null!;
    }

    public class PaymentResponse
    {
        public long Id { get; set; }
        public long BookingId { get; set; }
        public string PaymentCode { get; set; } = null!;
        public string MethodName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string PaymentProvider { get; set; } = null!;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = null!;
        public string? TransactionCode { get; set; }
        public string? PaidAt { get; set; }
        public string? RefundedAt { get; set; }
        public string? RefundMethod { get; set; }
        public string? RefundPendingReason { get; set; }
        public string CreatedAt { get; set; } = null!;
    }

    public class PayBookingRequest
    {
        public long BookingId { get; set; }
        public string MethodName { get; set; } = "BANK_TRANSFER";
        public string? TransactionCode { get; set; }
    }
}
