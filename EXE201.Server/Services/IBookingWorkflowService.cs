using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IBookingWorkflowService
    {
        Task<List<WorkingScheduleResponse>> GetMySchedulesAsync(long ownerId);
        Task<WorkingScheduleResponse?> UpsertScheduleAsync(long ownerId, UpsertWorkingScheduleRequest request);
        Task<List<WorkingDayResponse>> GetStudioDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed);
        Task<WorkingDayResponse?> UpsertWorkingDayAsync(long ownerId, UpsertWorkingDayRequest request);
        Task<TimeSlotResponse?> CreateSlotAsync(long ownerId, CreateTimeSlotRequest request);
        Task<bool> UpdateSlotStatusAsync(long ownerId, long slotId, string status);

        Task<BookingResponse?> CreateBookingAsync(long customerId, CreateBookingRequest request);
        Task<List<BookingResponse>> GetBookingsForUserAsync(long userId, string role, string? status);
        Task<BookingResponse?> GetBookingForUserAsync(long userId, string role, long bookingId);
        Task<BookingResponse?> ConfirmBookingAsync(long ownerId, long bookingId);
        Task<BookingResponse?> RejectBookingAsync(long ownerId, long bookingId, string? reason);
        Task<BookingResponse?> MarkInProgressAsync(long ownerId, long bookingId);
        Task<BookingResponse?> CompleteBookingAsync(long ownerId, long bookingId);
        Task<BookingResponse?> CancelBookingAsync(long userId, string role, long bookingId, string? reason);

        Task<List<PaymentResponse>> GetPaymentsForUserAsync(long userId, string role);
        Task<PaymentResponse?> PayBookingAsync(long customerId, PayBookingRequest request);
    }
}
