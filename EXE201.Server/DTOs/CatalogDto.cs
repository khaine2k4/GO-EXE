namespace EXE201.Server.DTOs
{
    public class CategoryResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class UpsertCategoryRequest
    {
        public string? Name { get; set; }
        public string? CategoryName { get; set; }
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class ServiceSummaryResponse
    {
        public long Id { get; set; }
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public long CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? City { get; set; }
        public bool IsActive { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
    }

    public class ServiceDetailResponse : ServiceSummaryResponse
    {
        public string? District { get; set; }
        public string? AddressLine { get; set; }
        public string? StudioLogoUrl { get; set; }
        public string? StudioCoverUrl { get; set; }
        public List<string> Images { get; set; } = new();
        public List<PackageResponse> Packages { get; set; } = new();
        public List<PortfolioResponse> Portfolio { get; set; } = new();
        public List<ReviewResponse> Reviews { get; set; } = new();
    }

    public class UpsertServiceRequest
    {
        public long CategoryId { get; set; }
        public string? Name { get; set; }
        public string? ServiceName { get; set; }
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? City { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class UpdateServiceStatusRequest
    {
        public bool IsActive { get; set; }
    }

    public class ServiceImageResponse
    {
        public long Id { get; set; }
        public long ServiceId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public int SortOrder { get; set; }
    }

    public class AddServiceImageRequest
    {
        public string ImageUrl { get; set; } = null!;
        public int SortOrder { get; set; }
    }

    public class PackageResponse
    {
        public long Id { get; set; }
        public long ServiceId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? DurationHours { get; set; }
        public int? MaxPhotos { get; set; }
        public string? Inclusions { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class UpsertPackageRequest
    {
        public long ServiceId { get; set; }
        public string? Name { get; set; }
        public string? PackageName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? DurationHours { get; set; }
        public int? MaxPhotos { get; set; }
        public string? Inclusions { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class UpdatePackagePriceRequest
    {
        public decimal Price { get; set; }
    }

    public class PortfolioResponse
    {
        public long Id { get; set; }
        public long StudioId { get; set; }
        public long? ServiceId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? Caption { get; set; }
        public int SortOrder { get; set; }
        public string UploadedAt { get; set; } = null!;
    }

    public class AddPortfolioRequest
    {
        public long? ServiceId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? Caption { get; set; }
        public int SortOrder { get; set; }
    }

    public class ReviewResponse
    {
        public long Id { get; set; }
        public string CustomerName { get; set; } = null!;
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public string CreatedAt { get; set; } = null!;
    }

    public class StudioPublicResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? AddressLine { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverUrl { get; set; }
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
        public List<ServiceSummaryResponse> Services { get; set; } = new();
        public List<PortfolioResponse> Portfolio { get; set; } = new();
        public List<ReviewResponse> Reviews { get; set; } = new();
    }

    public class StudioSummaryResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? AddressLine { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverUrl { get; set; }
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
        public int ServiceCount { get; set; }
        public int PortfolioCount { get; set; }
        public decimal? MinPrice { get; set; }
        public List<string> Categories { get; set; } = new();
    }

    public class StudioDashboardResponse
    {
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public int TotalServices { get; set; }
        public int ActiveServices { get; set; }
        public int HiddenServices { get; set; }
        public int TotalPackages { get; set; }
        public int PortfolioImages { get; set; }
        public int TotalPortfolios { get; set; }
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CompletedBookings { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal StudioRevenue { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal Rating { get; set; }
        public decimal AvgRating { get; set; }
        public int ReviewCount { get; set; }
        public int TotalReviews { get; set; }
        public List<ServiceSummaryResponse> RecentServices { get; set; } = new();
        public List<PackageResponse> RecentPackages { get; set; } = new();
    }

    public class RatingSummaryResponse
    {
        public decimal AvgRating { get; set; }
        public int TotalReviews { get; set; }
    }
}
