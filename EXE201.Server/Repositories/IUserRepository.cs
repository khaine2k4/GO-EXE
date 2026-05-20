using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserByEmailAndPasswordAsync(string email, string password);
        Task<User?> GetUserByIdAsync(long id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<Role?> GetRoleByNameAsync(string roleName);
        Task<List<User>> GetAllUsersAsync();
    }
}
