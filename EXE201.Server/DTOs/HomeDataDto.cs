namespace EXE201.Server.DTOs
{
    public class HomeDataDto
    {
        public int ApprovedStudiosCount { get; set; }
        public int TotalBookingsCount { get; set; }
        public double AvgRating { get; set; }
        public List<FeaturedStudioDto> FeaturedStudios { get; set; } = new();
    }

    public class FeaturedStudioDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? City { get; set; }
        public decimal Rating { get; set; }
        public int ReviewCount { get; set; }
        public string? CoverUrl { get; set; }
    }
}
