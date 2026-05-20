using exe201.Server.Models;
using EXE201.Server.Repositories;
using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _addressRepository;

        public AddressService(IAddressRepository addressRepository)
        {
            _addressRepository = addressRepository;
        }

        private AddressDto MapToAddressDto(UserAddress address)
        {
            return new AddressDto
            {
                AddressId = address.AddressId,
                UserId = address.UserId,
                City = address.City,
                District = address.District,
                Ward = address.Ward,
                AddressLine = address.AddressLine,
                IsDefault = address.IsDefault,
                CreatedAt = address.CreatedAt
            };
        }

        public async Task<List<AddressDto>> GetUserAddressesAsync(long userId)
        {
            var addresses = await _addressRepository.GetAddressesByUserIdAsync(userId);
            return addresses.Select(MapToAddressDto).ToList();
        }

        public async Task<AddressDto?> GetAddressByIdAsync(long userId, long addressId)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId);
            if (address == null || address.UserId != userId) return null;
            return MapToAddressDto(address);
        }

        public async Task<AddressDto> CreateAddressAsync(long userId, CreateAddressRequestDto request)
        {
            if (request.IsDefault)
            {
                await _addressRepository.ClearDefaultAddressesAsync(userId);
            }

            var address = new UserAddress
            {
                UserId = userId,
                City = request.City,
                District = request.District,
                Ward = request.Ward,
                AddressLine = request.AddressLine,
                IsDefault = request.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _addressRepository.CreateAddressAsync(address);
            return MapToAddressDto(created);
        }

        public async Task<AddressDto?> UpdateAddressAsync(long userId, long addressId, UpdateAddressRequestDto request)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId);
            if (address == null || address.UserId != userId) return null;

            if (request.IsDefault && !address.IsDefault)
            {
                await _addressRepository.ClearDefaultAddressesAsync(userId);
            }

            address.City = request.City;
            address.District = request.District;
            address.Ward = request.Ward;
            address.AddressLine = request.AddressLine;
            address.IsDefault = request.IsDefault;

            var updated = await _addressRepository.UpdateAddressAsync(address);
            return MapToAddressDto(updated);
        }

        public async Task<bool> DeleteAddressAsync(long userId, long addressId)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId);
            if (address == null || address.UserId != userId) return false;

            return await _addressRepository.DeleteAddressAsync(addressId);
        }
    }
}
