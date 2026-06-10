using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;

        public NotificationService(INotificationRepository notificationRepo)
        {
            _notificationRepo = notificationRepo;
        }

        public async Task<NotificationDto> CreateNotificationAsync(long userId, string title, string content, string type, string? refType = null, long? refId = null)
        {
            var notif = new Notification
            {
                UserId = userId,
                Title = title,
                Content = content,
                Type = type,
                RefType = refType,
                RefId = refId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _notificationRepo.CreateNotificationAsync(notif);
            return MapToDto(created);
        }

        public async Task<List<NotificationDto>> GetUserNotificationsAsync(long userId, int take = 50)
        {
            var list = await _notificationRepo.GetNotificationsByUserIdAsync(userId, take);
            return list.Select(MapToDto).ToList();
        }

        public async Task MarkAsReadAsync(long notificationId, long userId)
        {
            var notif = await _notificationRepo.GetNotificationByIdAsync(notificationId);
            if (notif == null || notif.UserId != userId)
            {
                throw new KeyNotFoundException("Notification not found or access denied.");
            }

            await _notificationRepo.MarkAsReadAsync(notificationId);
        }

        public async Task MarkAllAsReadAsync(long userId)
        {
            await _notificationRepo.MarkAllAsReadAsync(userId);
        }

        public async Task<int> GetUnreadCountAsync(long userId)
        {
            return await _notificationRepo.CountUnreadNotificationsAsync(userId);
        }

        public async Task<List<long>> GetAdminUserIdsAsync()
        {
            return await _notificationRepo.GetAdminUserIdsAsync();
        }

        private static NotificationDto MapToDto(Notification n)
        {
            return new NotificationDto
            {
                NotificationId = n.NotificationId,
                UserId = n.UserId,
                Type = n.Type,
                Title = n.Title,
                Content = n.Content,
                RefType = n.RefType,
                RefId = n.RefId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedAt = n.CreatedAt
            };
        }
    }
}
