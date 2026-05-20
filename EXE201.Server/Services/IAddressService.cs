using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IAddressService
    {
        Task<List<AddressDto>> GetUserAddressesAsync(long userId);
        Task<AddressDto?> GetAddressByIdAsync(long userId, long addressId);
        Task<AddressDto> CreateAddressAsync(long userId, CreateAddressRequestDto request);
        Task<AddressDto?> UpdateAddressAsync(long userId, long addressId, UpdateAddressRequestDto request);
        Task<bool> DeleteAddressAsync(long userId, long addressId);
    }
}
