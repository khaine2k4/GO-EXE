using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Repositories
{
    public class AddressRepository : IAddressRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public AddressRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<List<UserAddress>> GetAddressesByUserIdAsync(long userId)
        {
            return await _context.UserAddresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserAddress?> GetAddressByIdAsync(long addressId)
        {
            return await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.AddressId == addressId);
        }

        public async Task<UserAddress> CreateAddressAsync(UserAddress address)
        {
            address.CreatedAt = DateTime.UtcNow;
            await _context.UserAddresses.AddAsync(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<UserAddress> UpdateAddressAsync(UserAddress address)
        {
            _context.UserAddresses.Update(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<bool> DeleteAddressAsync(long addressId)
        {
            var address = await _context.UserAddresses.FindAsync(addressId);
            if (address == null) return false;

            _context.UserAddresses.Remove(address);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ClearDefaultAddressesAsync(long userId)
        {
            var defaultAddresses = await _context.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();

            foreach (var addr in defaultAddresses)
            {
                addr.IsDefault = false;
            }

            if (defaultAddresses.Any())
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}
