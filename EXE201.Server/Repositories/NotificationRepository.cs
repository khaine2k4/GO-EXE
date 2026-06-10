using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public NotificationRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            notification.CreatedAt = DateTime.UtcNow;
            notification.IsRead = false;
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<List<Notification>> GetNotificationsByUserIdAsync(long userId, int take = 50)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && n.Type != "CHAT")
                .OrderByDescending(n => n.CreatedAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Notification?> GetNotificationByIdAsync(long notificationId)
        {
            return await _context.Notifications.FindAsync(notificationId);
        }

        public async Task MarkAsReadAsync(long notificationId)
        {
            var notif = await _context.Notifications.FindAsync(notificationId);
            if (notif != null && !notif.IsRead)
            {
                notif.IsRead = true;
                notif.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(long userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
            }

            if (unread.Count > 0)
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> CountUnreadNotificationsAsync(long userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead && n.Type != "CHAT");
        }

        public async Task<List<long>> GetAdminUserIdsAsync()
        {
            return await _context.Users
                .Where(u => u.Role.RoleName == "ADMIN")
                .Select(u => u.UserId)
                .ToListAsync();
        }
    }
}
