using exe201.Server.Models;
using EXE201.Server.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Services
{
    public class CatalogService : ICatalogService
    {
        private readonly PhotoStudioBookingContext _context;

        public CatalogService(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<List<CategoryResponse>> GetCategoriesAsync(bool includeInactive)
        {
            return await _context.Categories
                .Where(c => includeInactive || c.IsActive)
                .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryName)
                .Select(c => MapCategory(c))
                .ToListAsync();
        }

        public async Task<CategoryResponse> CreateCategoryAsync(UpsertCategoryRequest request, long adminId)
        {
            var now = DateTime.UtcNow;
            var category = new Category
            {
                CategoryName = request.Name,
                Description = request.Description,
                IconUrl = request.IconUrl,
                IsActive = request.IsActive,
                SortOrder = request.SortOrder,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = adminId,
                UpdatedBy = adminId
            };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return MapCategory(category);
        }

        public async Task<CategoryResponse?> UpdateCategoryAsync(long id, UpsertCategoryRequest request, long adminId)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == id);
            if (category == null) return null;

            category.CategoryName = request.Name;
            category.Description = request.Description;
            category.IconUrl = request.IconUrl;
            category.IsActive = request.IsActive;
            category.SortOrder = request.SortOrder;
            category.UpdatedAt = DateTime.UtcNow;
            category.UpdatedBy = adminId;
            await _context.SaveChangesAsync();
            return MapCategory(category);
        }

        public async Task<bool> DeleteCategoryAsync(long id, long adminId)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == id);
            if (category == null) return false;

            category.IsActive = false;
            category.UpdatedAt = DateTime.UtcNow;
            category.UpdatedBy = adminId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ServiceSummaryResponse>> SearchServicesAsync(string? search, long? categoryId, string? city, decimal? minPrice, decimal? maxPrice, long? studioId, bool includeInactive)
        {
            var query = BaseServicesQuery(includeInactive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s =>
                    s.ServiceName.ToLower().Contains(q) ||
                    (s.Description != null && s.Description.ToLower().Contains(q)) ||
                    s.Studio.StudioName.ToLower().Contains(q));
            }

            if (categoryId.HasValue) query = query.Where(s => s.CategoryId == categoryId);
            if (studioId.HasValue) query = query.Where(s => s.StudioId == studioId);
            if (!string.IsNullOrWhiteSpace(city)) query = query.Where(s => s.City == city || s.Studio.City == city);
            if (minPrice.HasValue) query = query.Where(s => s.Packages.Any(p => p.DeletedAt == null && p.IsActive && p.Price >= minPrice));
            if (maxPrice.HasValue) query = query.Where(s => s.Packages.Any(p => p.DeletedAt == null && p.IsActive && p.Price <= maxPrice));

            var services = await query
                .OrderBy(s => s.SortOrder).ThenByDescending(s => s.Studio.AvgRating).ThenBy(s => s.ServiceName)
                .ToListAsync();

            return services.Select(MapServiceSummary).ToList();
        }

        public async Task<List<ServiceSummaryResponse>> GetOwnerServicesAsync(long ownerId)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return new List<ServiceSummaryResponse>();

            return await SearchServicesAsync(null, null, null, null, null, studio.StudioId, true);
        }

        public async Task<ServiceDetailResponse?> GetServiceAsync(long id, bool includeInactive)
        {
            var service = await BaseServicesQuery(includeInactive)
                .Include(s => s.ServiceImages)
                .Include(s => s.StudioPortfolios)
                .Include(s => s.Studio).ThenInclude(st => st.Reviews.Where(r => !r.IsHidden)).ThenInclude(r => r.Customer)
                .FirstOrDefaultAsync(s => s.ServiceId == id);

            return service == null ? null : MapServiceDetail(service);
        }

        public async Task<ServiceDetailResponse> CreateServiceAsync(long ownerId, UpsertServiceRequest request)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) throw new InvalidOperationException("Studio not found.");

            var now = DateTime.UtcNow;
            var service = new Service
            {
                StudioId = studio.StudioId,
                CategoryId = request.CategoryId,
                ServiceName = request.Name,
                Description = request.Description,
                ThumbnailUrl = request.ThumbnailUrl,
                City = request.City ?? studio.City,
                IsActive = request.IsActive,
                IsHidden = false,
                SortOrder = request.SortOrder,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = ownerId,
                UpdatedBy = ownerId
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return (await GetServiceAsync(service.ServiceId, true))!;
        }

        public async Task<ServiceDetailResponse?> UpdateServiceAsync(long ownerId, long id, UpsertServiceRequest request)
        {
            var service = await GetOwnedServiceAsync(ownerId, id);
            if (service == null) return null;

            service.CategoryId = request.CategoryId;
            service.ServiceName = request.Name;
            service.Description = request.Description;
            service.ThumbnailUrl = request.ThumbnailUrl;
            service.City = request.City;
            service.IsActive = request.IsActive;
            service.SortOrder = request.SortOrder;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            return await GetServiceAsync(id, true);
        }

        public async Task<bool> SetServiceStatusAsync(long ownerId, long id, bool isActive)
        {
            var service = await GetOwnedServiceAsync(ownerId, id);
            if (service == null) return false;
            service.IsActive = isActive;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HideServiceAsync(long ownerId, long id)
        {
            var service = await GetOwnedServiceAsync(ownerId, id);
            if (service == null) return false;
            service.IsActive = false;
            service.IsHidden = true;
            service.HiddenAt = DateTime.UtcNow;
            service.HiddenBy = ownerId;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ServiceImageResponse?> AddServiceImageAsync(long ownerId, long serviceId, AddServiceImageRequest request)
        {
            var service = await GetOwnedServiceAsync(ownerId, serviceId);
            if (service == null) return null;

            var image = new ServiceImage { ServiceId = serviceId, ImageUrl = request.ImageUrl, SortOrder = request.SortOrder };
            _context.ServiceImages.Add(image);
            await _context.SaveChangesAsync();
            return new ServiceImageResponse { Id = image.ImageId, ServiceId = image.ServiceId, ImageUrl = image.ImageUrl, SortOrder = image.SortOrder };
        }

        public async Task<bool> DeleteServiceImageAsync(long ownerId, long imageId)
        {
            var image = await _context.ServiceImages.Include(i => i.Service).FirstOrDefaultAsync(i => i.ImageId == imageId);
            if (image == null) return false;
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null || image.Service.StudioId != studio.StudioId) return false;

            _context.ServiceImages.Remove(image);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PackageResponse>> GetPackagesAsync(long? serviceId)
        {
            var query = _context.Packages.Where(p => p.DeletedAt == null).AsQueryable();
            if (serviceId.HasValue) query = query.Where(p => p.ServiceId == serviceId);
            return await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Price).Select(p => MapPackage(p)).ToListAsync();
        }

        public async Task<PackageResponse?> CreatePackageAsync(long ownerId, UpsertPackageRequest request)
        {
            var service = await GetOwnedServiceAsync(ownerId, request.ServiceId);
            if (service == null) return null;

            var now = DateTime.UtcNow;
            var package = new Package
            {
                ServiceId = request.ServiceId,
                PackageName = request.Name,
                Description = request.Description,
                Price = request.Price,
                DurationHours = request.DurationHours,
                MaxPhotos = request.MaxPhotos,
                Inclusions = request.Inclusions,
                IsActive = request.IsActive,
                SortOrder = request.SortOrder,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = ownerId,
                UpdatedBy = ownerId
            };
            _context.Packages.Add(package);
            await _context.SaveChangesAsync();
            return MapPackage(package);
        }

        public async Task<PackageResponse?> UpdatePackageAsync(long ownerId, long id, UpsertPackageRequest request)
        {
            var package = await _context.Packages.Include(p => p.Service).FirstOrDefaultAsync(p => p.PackageId == id && p.DeletedAt == null);
            var studio = await GetOwnedStudioAsync(ownerId);
            if (package == null || studio == null || package.Service.StudioId != studio.StudioId) return null;

            if (request.ServiceId != package.ServiceId)
            {
                var targetService = await GetOwnedServiceAsync(ownerId, request.ServiceId);
                if (targetService == null) return null;
            }

            package.ServiceId = request.ServiceId;
            package.PackageName = request.Name;
            package.Description = request.Description;
            package.Price = request.Price;
            package.DurationHours = request.DurationHours;
            package.MaxPhotos = request.MaxPhotos;
            package.Inclusions = request.Inclusions;
            package.IsActive = request.IsActive;
            package.SortOrder = request.SortOrder;
            package.UpdatedAt = DateTime.UtcNow;
            package.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            return MapPackage(package);
        }

        public async Task<bool> DeletePackageAsync(long ownerId, long id)
        {
            var package = await _context.Packages.Include(p => p.Service).FirstOrDefaultAsync(p => p.PackageId == id && p.DeletedAt == null);
            var studio = await GetOwnedStudioAsync(ownerId);
            if (package == null || studio == null || package.Service.StudioId != studio.StudioId) return false;

            package.IsActive = false;
            package.DeletedAt = DateTime.UtcNow;
            package.DeletedBy = ownerId;
            package.UpdatedAt = DateTime.UtcNow;
            package.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PortfolioResponse>> GetPortfolioAsync(long? studioId, long? serviceId)
        {
            var query = _context.StudioPortfolios.AsQueryable();
            if (studioId.HasValue) query = query.Where(p => p.StudioId == studioId);
            if (serviceId.HasValue) query = query.Where(p => p.ServiceId == serviceId);

            return await query.OrderBy(p => p.SortOrder).ThenByDescending(p => p.UploadedAt).Select(p => MapPortfolio(p)).ToListAsync();
        }

        public async Task<PortfolioResponse?> AddPortfolioAsync(long ownerId, AddPortfolioRequest request)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            if (request.ServiceId.HasValue)
            {
                var service = await GetOwnedServiceAsync(ownerId, request.ServiceId.Value);
                if (service == null) return null;
            }

            var item = new StudioPortfolio
            {
                StudioId = studio.StudioId,
                ServiceId = request.ServiceId,
                ImageUrl = request.ImageUrl,
                Caption = request.Caption,
                SortOrder = request.SortOrder,
                UploadedAt = DateTime.UtcNow,
                UploadedBy = ownerId
            };
            _context.StudioPortfolios.Add(item);
            await _context.SaveChangesAsync();
            return MapPortfolio(item);
        }

        public async Task<bool> DeletePortfolioAsync(long ownerId, long id)
        {
            var item = await _context.StudioPortfolios.FirstOrDefaultAsync(p => p.PortfolioId == id);
            var studio = await GetOwnedStudioAsync(ownerId);
            if (item == null || studio == null || item.StudioId != studio.StudioId) return false;

            _context.StudioPortfolios.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<StudioPublicResponse?> GetStudioAsync(long id)
        {
            var studio = await _context.Studios
                .Include(s => s.Services.Where(x => !x.IsHidden && x.IsActive)).ThenInclude(s => s.Category)
                .Include(s => s.Services.Where(x => !x.IsHidden && x.IsActive)).ThenInclude(s => s.Packages.Where(p => p.DeletedAt == null && p.IsActive))
                .Include(s => s.StudioPortfolios)
                .Include(s => s.Reviews.Where(r => !r.IsHidden)).ThenInclude(r => r.Customer)
                .FirstOrDefaultAsync(s => s.StudioId == id && s.DeletedAt == null && s.Status == "APPROVED");

            if (studio == null) return null;

            return new StudioPublicResponse
            {
                Id = studio.StudioId,
                Name = studio.StudioName,
                Description = studio.Description,
                City = studio.City,
                District = studio.District,
                AddressLine = studio.AddressLine,
                LogoUrl = studio.LogoUrl,
                CoverUrl = studio.CoverUrl,
                Rating = studio.AvgRating,
                ReviewCount = studio.TotalReviews,
                Services = studio.Services.OrderBy(s => s.SortOrder).Select(MapServiceSummary).ToList(),
                Portfolio = studio.StudioPortfolios.OrderBy(p => p.SortOrder).Select(MapPortfolio).ToList(),
                Reviews = studio.Reviews.OrderByDescending(r => r.CreatedAt).Take(20).Select(r => new ReviewResponse
                {
                    Id = r.ReviewId,
                    CustomerName = r.Customer.FullName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt.ToString("O")
                }).ToList()
            };
        }

        public async Task<StudioDashboardResponse?> GetStudioDashboardAsync(long ownerId)
        {
            var studio = await _context.Studios
                .Include(s => s.Services).ThenInclude(s => s.Packages)
                .Include(s => s.StudioPortfolios)
                .Include(s => s.Bookings).ThenInclude(b => b.Status)
                .FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);

            if (studio == null) return null;

            var completed = studio.Bookings.Where(b => b.Status.StatusName == "COMPLETED").ToList();
            return new StudioDashboardResponse
            {
                StudioId = studio.StudioId,
                StudioName = studio.StudioName,
                Status = studio.Status,
                TotalServices = studio.Services.Count(s => !s.IsHidden),
                ActiveServices = studio.Services.Count(s => !s.IsHidden && s.IsActive),
                TotalPackages = studio.Services.SelectMany(s => s.Packages).Count(p => p.DeletedAt == null),
                PortfolioImages = studio.StudioPortfolios.Count,
                PendingBookings = studio.Bookings.Count(b => b.Status.StatusName == "PENDING"),
                ConfirmedBookings = studio.Bookings.Count(b => b.Status.StatusName == "CONFIRMED"),
                CompletedBookings = completed.Count,
                GrossRevenue = completed.Sum(b => b.TotalPrice),
                StudioRevenue = completed.Sum(b => b.StudioRevenue),
                Rating = studio.AvgRating,
                ReviewCount = studio.TotalReviews
            };
        }

        private IQueryable<Service> BaseServicesQuery(bool includeInactive)
        {
            return _context.Services
                .Include(s => s.Category)
                .Include(s => s.Studio)
                .Include(s => s.Packages.Where(p => p.DeletedAt == null))
                .Where(s => !s.IsHidden && s.Studio.DeletedAt == null && (includeInactive || (s.IsActive && s.Studio.Status == "APPROVED")));
        }

        private async Task<Studio?> GetOwnedStudioAsync(long ownerId)
        {
            return await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);
        }

        private async Task<Service?> GetOwnedServiceAsync(long ownerId, long serviceId)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;
            return await _context.Services.FirstOrDefaultAsync(s => s.ServiceId == serviceId && s.StudioId == studio.StudioId && !s.IsHidden);
        }

        private static CategoryResponse MapCategory(Category c) => new()
        {
            Id = c.CategoryId,
            Name = c.CategoryName,
            Description = c.Description,
            IconUrl = c.IconUrl,
            IsActive = c.IsActive,
            SortOrder = c.SortOrder
        };

        private static ServiceSummaryResponse MapServiceSummary(Service s)
        {
            var activePackages = s.Packages.Where(p => p.DeletedAt == null && p.IsActive).ToList();
            return new ServiceSummaryResponse
            {
                Id = s.ServiceId,
                StudioId = s.StudioId,
                StudioName = s.Studio.StudioName,
                CategoryId = s.CategoryId,
                CategoryName = s.Category.CategoryName,
                Name = s.ServiceName,
                Description = s.Description,
                ThumbnailUrl = s.ThumbnailUrl,
                City = s.City ?? s.Studio.City,
                IsActive = s.IsActive,
                MinPrice = activePackages.Count == 0 ? null : activePackages.Min(p => p.Price),
                MaxPrice = activePackages.Count == 0 ? null : activePackages.Max(p => p.Price),
                Rating = s.Studio.AvgRating,
                ReviewCount = s.Studio.TotalReviews
            };
        }

        private static ServiceDetailResponse MapServiceDetail(Service s)
        {
            var summary = MapServiceSummary(s);
            return new ServiceDetailResponse
            {
                Id = summary.Id,
                StudioId = summary.StudioId,
                StudioName = summary.StudioName,
                CategoryId = summary.CategoryId,
                CategoryName = summary.CategoryName,
                Name = summary.Name,
                Description = summary.Description,
                ThumbnailUrl = summary.ThumbnailUrl,
                City = summary.City,
                IsActive = summary.IsActive,
                MinPrice = summary.MinPrice,
                MaxPrice = summary.MaxPrice,
                Rating = summary.Rating,
                ReviewCount = summary.ReviewCount,
                District = s.Studio.District,
                AddressLine = s.Studio.AddressLine,
                StudioLogoUrl = s.Studio.LogoUrl,
                StudioCoverUrl = s.Studio.CoverUrl,
                Images = s.ServiceImages.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
                Packages = s.Packages.Where(p => p.DeletedAt == null).OrderBy(p => p.SortOrder).Select(MapPackage).ToList(),
                Portfolio = s.StudioPortfolios.OrderBy(p => p.SortOrder).Select(MapPortfolio).ToList(),
                Reviews = s.Studio.Reviews.Where(r => !r.IsHidden).OrderByDescending(r => r.CreatedAt).Take(20).Select(r => new ReviewResponse
                {
                    Id = r.ReviewId,
                    CustomerName = r.Customer.FullName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt.ToString("O")
                }).ToList()
            };
        }

        private static PackageResponse MapPackage(Package p) => new()
        {
            Id = p.PackageId,
            ServiceId = p.ServiceId,
            Name = p.PackageName,
            Description = p.Description,
            Price = p.Price,
            DurationHours = p.DurationHours,
            MaxPhotos = p.MaxPhotos,
            Inclusions = p.Inclusions,
            IsActive = p.IsActive,
            SortOrder = p.SortOrder
        };

        private static PortfolioResponse MapPortfolio(StudioPortfolio p) => new()
        {
            Id = p.PortfolioId,
            StudioId = p.StudioId,
            ServiceId = p.ServiceId,
            ImageUrl = p.ImageUrl,
            Caption = p.Caption,
            SortOrder = p.SortOrder,
            UploadedAt = p.UploadedAt.ToString("O")
        };
    }
}
