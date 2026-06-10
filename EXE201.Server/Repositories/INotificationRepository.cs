using exe201.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public interface INotificationRepository
    {
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task<List<Notification>> GetNotificationsByUserIdAsync(long userId, int take = 50);
        Task<Notification?> GetNotificationByIdAsync(long notificationId);
        Task MarkAsReadAsync(long notificationId);
        Task MarkAllAsReadAsync(long userId);
        Task<int> CountUnreadNotificationsAsync(long userId);
        Task<List<long>> GetAdminUserIdsAsync();
    }
}
