using System.ComponentModel.DataAnnotations;

namespace EXE201.Server.DTOs
{
    public class CreateAnalyticsEventRequest
    {
        [Required]
        [MaxLength(50)]
        public string EventName { get; set; } = null!;

        [Required]
        [MaxLength(255)]
        public string PageUrl { get; set; } = null!;

        public long? StudioId { get; set; }

        public long? PackageId { get; set; }
    }
}
