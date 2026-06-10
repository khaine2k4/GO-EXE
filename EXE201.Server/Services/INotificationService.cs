using EXE201.Server.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(long userId, string title, string content, string type, string? refType = null, long? refId = null);
        Task<List<NotificationDto>> GetUserNotificationsAsync(long userId, int take = 50);
        Task MarkAsReadAsync(long notificationId, long userId);
        Task MarkAllAsReadAsync(long userId);
        Task<int> GetUnreadCountAsync(long userId);
        Task<List<long>> GetAdminUserIdsAsync();
    }
}
