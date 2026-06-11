using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EXE201.Server.Services
{
    public class BookingExpiryWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BookingExpiryWorker> _logger;

        public BookingExpiryWorker(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<BookingExpiryWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IBookingWorkflowService>();
                    var expiredCount = await service.ExpirePendingBookingsAsync();
                    if (expiredCount > 0)
                    {
                        _logger.LogInformation("Expired {ExpiredCount} pending booking holds.", expiredCount);
                    }

                    var completedCount = await service.AutoCompleteDeliveredBookingsAsync();
                    if (completedCount > 0)
                    {
                        _logger.LogInformation("Auto-completed {CompletedCount} finalized bookings.", completedCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to expire pending booking holds.");
                }

                var intervalSeconds = int.TryParse(_configuration["ExpiryWorkerIntervalSeconds"], out var configured) && configured > 0
                    ? configured
                    : 60;

                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }
        }
    }
}
