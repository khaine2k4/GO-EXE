namespace EXE201.Server.Repositories
{
    public interface IBookingRepository
    {
        Task<int> GetTotalBookingsCountAsync();
    }
}
