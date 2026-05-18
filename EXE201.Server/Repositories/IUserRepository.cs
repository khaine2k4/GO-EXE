using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserByEmailAndPasswordAsync(string email, string password);
        Task<User?> GetUserByIdAsync(long id);
    }
}
