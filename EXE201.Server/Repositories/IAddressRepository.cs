using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IAddressRepository
    {
        Task<List<UserAddress>> GetAddressesByUserIdAsync(long userId);
        Task<UserAddress?> GetAddressByIdAsync(long addressId);
        Task<UserAddress> CreateAddressAsync(UserAddress address);
        Task<UserAddress> UpdateAddressAsync(UserAddress address);
        Task<bool> DeleteAddressAsync(long addressId);
        Task ClearDefaultAddressesAsync(long userId);
    }
}
