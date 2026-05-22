using EXE201.Server.DTOs;
using EXE201.Server.Repositories;

namespace EXE201.Server.Services
{
    public class CatalogService : ICatalogService
    {
        private readonly ICatalogRepository _catalogRepository;

        public CatalogService(ICatalogRepository catalogRepository)
        {
            _catalogRepository = catalogRepository;
        }

        public Task<List<CategoryResponse>> GetCategoriesAsync(bool includeInactive)
            => _catalogRepository.GetCategoriesAsync(includeInactive);

        public Task<CategoryResponse> CreateCategoryAsync(UpsertCategoryRequest request, long adminId)
            => _catalogRepository.CreateCategoryAsync(request, adminId);

        public Task<CategoryResponse?> UpdateCategoryAsync(long id, UpsertCategoryRequest request, long adminId)
            => _catalogRepository.UpdateCategoryAsync(id, request, adminId);

        public Task<bool> DeleteCategoryAsync(long id, long adminId)
            => _catalogRepository.DeleteCategoryAsync(id, adminId);

        public Task<List<ServiceSummaryResponse>> SearchServicesAsync(string? search, long? categoryId, string? city, decimal? minPrice, decimal? maxPrice, long? studioId, bool includeInactive)
            => _catalogRepository.SearchServicesAsync(search, categoryId, city, minPrice, maxPrice, studioId, includeInactive);

        public Task<List<ServiceSummaryResponse>> GetOwnerServicesAsync(long ownerId)
            => _catalogRepository.GetOwnerServicesAsync(ownerId);

        public Task<ServiceDetailResponse?> GetServiceAsync(long id, bool includeInactive)
            => _catalogRepository.GetServiceAsync(id, includeInactive);

        public Task<ServiceDetailResponse> CreateServiceAsync(long ownerId, UpsertServiceRequest request)
            => _catalogRepository.CreateServiceAsync(ownerId, request);

        public Task<ServiceDetailResponse?> UpdateServiceAsync(long ownerId, long id, UpsertServiceRequest request)
            => _catalogRepository.UpdateServiceAsync(ownerId, id, request);

        public Task<bool> SetServiceStatusAsync(long ownerId, long id, bool isActive)
            => _catalogRepository.SetServiceStatusAsync(ownerId, id, isActive);

        public Task<bool> HideServiceAsync(long ownerId, long id)
            => _catalogRepository.HideServiceAsync(ownerId, id);

        public Task<ServiceImageResponse?> AddServiceImageAsync(long ownerId, long serviceId, AddServiceImageRequest request)
            => _catalogRepository.AddServiceImageAsync(ownerId, serviceId, request);

        public Task<bool> DeleteServiceImageAsync(long ownerId, long imageId)
            => _catalogRepository.DeleteServiceImageAsync(ownerId, imageId);

        public Task<List<PackageResponse>> GetPackagesAsync(long? serviceId, long? studioId = null, bool includeInactive = false)
            => _catalogRepository.GetPackagesAsync(serviceId, studioId, includeInactive);

        public Task<List<PackageResponse>> GetOwnerPackagesAsync(long ownerId)
            => _catalogRepository.GetOwnerPackagesAsync(ownerId);

        public Task<PackageResponse?> GetPackageAsync(long id)
            => _catalogRepository.GetPackageAsync(id);

        public Task<PackageResponse?> CreatePackageAsync(long ownerId, UpsertPackageRequest request)
            => _catalogRepository.CreatePackageAsync(ownerId, request);

        public Task<PackageResponse?> UpdatePackageAsync(long ownerId, long id, UpsertPackageRequest request)
            => _catalogRepository.UpdatePackageAsync(ownerId, id, request);

        public Task<PackageResponse?> UpdatePackagePriceAsync(long ownerId, long id, decimal price)
            => _catalogRepository.UpdatePackagePriceAsync(ownerId, id, price);

        public Task<bool> DeletePackageAsync(long ownerId, long id)
            => _catalogRepository.DeletePackageAsync(ownerId, id);

        public Task<List<PortfolioResponse>> GetPortfolioAsync(long? studioId, long? serviceId)
            => _catalogRepository.GetPortfolioAsync(studioId, serviceId);

        public Task<List<PortfolioResponse>> GetOwnerPortfolioAsync(long ownerId)
            => _catalogRepository.GetOwnerPortfolioAsync(ownerId);

        public Task<PortfolioResponse?> AddPortfolioAsync(long ownerId, AddPortfolioRequest request)
            => _catalogRepository.AddPortfolioAsync(ownerId, request);

        public Task<bool> DeletePortfolioAsync(long ownerId, long id)
            => _catalogRepository.DeletePortfolioAsync(ownerId, id);

        public Task<StudioPublicResponse?> GetStudioAsync(long id)
            => _catalogRepository.GetStudioAsync(id);

        public Task<StudioDashboardResponse?> GetStudioDashboardAsync(long ownerId)
            => _catalogRepository.GetStudioDashboardAsync(ownerId);

        public Task<List<ReviewResponse>> GetStudioReviewsAsync(long studioId)
            => _catalogRepository.GetStudioReviewsAsync(studioId);

        public Task<RatingSummaryResponse?> GetStudioRatingSummaryAsync(long studioId)
            => _catalogRepository.GetStudioRatingSummaryAsync(studioId);
    }
}
