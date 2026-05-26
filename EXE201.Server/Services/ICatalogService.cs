using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface ICatalogService
    {
        Task<List<CategoryResponse>> GetCategoriesAsync(bool includeInactive);
        Task<CategoryResponse> CreateCategoryAsync(UpsertCategoryRequest request, long adminId);
        Task<CategoryResponse?> UpdateCategoryAsync(long id, UpsertCategoryRequest request, long adminId);
        Task<bool> DeleteCategoryAsync(long id, long adminId);

        Task<List<ServiceSummaryResponse>> SearchServicesAsync(string? search, long? categoryId, string? city, decimal? minPrice, decimal? maxPrice, long? studioId, bool includeInactive);
        Task<List<ServiceSummaryResponse>> GetOwnerServicesAsync(long ownerId);
        Task<ServiceDetailResponse?> GetServiceAsync(long id, bool includeInactive);
        Task<ServiceDetailResponse> CreateServiceAsync(long ownerId, UpsertServiceRequest request);
        Task<ServiceDetailResponse?> UpdateServiceAsync(long ownerId, long id, UpsertServiceRequest request);
        Task<bool> SetServiceStatusAsync(long ownerId, long id, bool isActive);
        Task<bool> HideServiceAsync(long ownerId, long id);
        Task<ServiceImageResponse?> AddServiceImageAsync(long ownerId, long serviceId, AddServiceImageRequest request);
        Task<bool> DeleteServiceImageAsync(long ownerId, long imageId);

        Task<List<PackageResponse>> GetPackagesAsync(long? serviceId, long? studioId = null, bool includeInactive = false);
        Task<List<PackageResponse>> GetOwnerPackagesAsync(long ownerId);
        Task<PackageResponse?> GetPackageAsync(long id);
        Task<PackageResponse?> CreatePackageAsync(long ownerId, UpsertPackageRequest request);
        Task<PackageResponse?> UpdatePackageAsync(long ownerId, long id, UpsertPackageRequest request);
        Task<PackageResponse?> UpdatePackagePriceAsync(long ownerId, long id, decimal price);
        Task<bool> DeletePackageAsync(long ownerId, long id);

        Task<List<PortfolioResponse>> GetPortfolioAsync(long? studioId, long? serviceId);
        Task<List<PortfolioResponse>> GetOwnerPortfolioAsync(long ownerId);
        Task<PortfolioResponse?> AddPortfolioAsync(long ownerId, AddPortfolioRequest request);
        Task<bool> DeletePortfolioAsync(long ownerId, long id);
        Task<List<StudioSummaryResponse>> SearchStudiosAsync(string? search, string? city, long? categoryId);
        Task<StudioPublicResponse?> GetStudioAsync(long id);
        Task<StudioDashboardResponse?> GetStudioDashboardAsync(long ownerId);
        Task<List<ReviewResponse>> GetStudioReviewsAsync(long studioId);
        Task<RatingSummaryResponse?> GetStudioRatingSummaryAsync(long studioId);
    }
}
