using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IBookingWorkflowService
    {
        Task<List<WorkingScheduleResponse>> GetMySchedulesAsync(long ownerId);
        Task<WorkingScheduleResponse?> UpsertScheduleAsync(long ownerId, UpsertWorkingScheduleRequest request);
        Task<bool> UpdateSlotDurationAsync(long ownerId, int slotDurationMinutes);
        Task<List<WorkingDayResponse>> GetStudioDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed);
        Task<WorkingDayResponse?> UpsertWorkingDayAsync(long ownerId, UpsertWorkingDayRequest request);
        Task<TimeSlotResponse?> CreateSlotAsync(long ownerId, CreateTimeSlotRequest request);
        Task<bool> UpdateSlotStatusAsync(long ownerId, long slotId, string status);
        Task<List<TimeSlotResponse>> GetStudioSlotsByDateAsync(long studioId, DateOnly date);

        Task<BookingResponse?> CreateBookingAsync(long customerId, CreateBookingRequest request);
        Task<List<BookingResponse>> GetBookingsForUserAsync(long userId, string role, string? status);
        Task<BookingResponse?> GetBookingForUserAsync(long userId, string role, long bookingId);
        Task<BookingResponse?> ConfirmBookingAsync(long ownerId, long bookingId);
        Task<BookingResponse?> RejectBookingAsync(long ownerId, long bookingId, string? reason);
        Task<BookingResponse?> MarkInProgressAsync(long ownerId, long bookingId);
        Task<BookingResponse?> UploadDemoPhotosAsync(long ownerId, long bookingId, PhotoDeliveryRequest request);
        Task<BookingResponse?> SubmitPhotoFeedbackAsync(long customerId, long bookingId, CustomerPhotoFeedbackRequest request);
        Task<BookingResponse?> UploadFinalPhotosAsync(long ownerId, long bookingId, PhotoDeliveryRequest request);
        Task<BookingResponse?> CompleteBookingAsync(long ownerId, long bookingId);
        Task<BookingResponse?> ConfirmCompletionAsync(long customerId, long bookingId);
        Task<BookingReviewResponse?> CreateReviewAsync(long customerId, long bookingId, CreateBookingReviewRequest request);
        Task<BookingResponse?> CancelBookingAsync(long userId, string role, long bookingId, string? reason);
        Task<BookingResponse?> DisputeBookingAsync(long customerId, long bookingId, string reason);

        Task<List<PaymentResponse>> GetPaymentsForUserAsync(long userId, string role);
        Task<PaymentResponse?> PayBookingAsync(long customerId, PayBookingRequest request);
        Task<int> ExpirePendingBookingsAsync();
        Task<string?> CreateVnPayPaymentUrlAsync(long customerId, long bookingId, string ipAddress);
        Task<bool> ProcessVnPayReturnAsync(Dictionary<string, string> vnpayParams);

        // payOS
        Task<string?> CreatePayOsPaymentUrlAsync(long customerId, long bookingId);
        Task<bool> ProcessPayOsWebhookAsync(string webhookBodyJson);
        Task<bool> ProcessPayOsReturnAsync(long bookingId, string status);
    }
}
