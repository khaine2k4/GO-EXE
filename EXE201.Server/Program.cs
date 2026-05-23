using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using EXE201.Server.Hubs;

namespace EXE201.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.AddDebug();

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddProblemDetails();
            builder.Services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(
                    Path.Combine(builder.Environment.ContentRootPath, ".keys")));
            builder.Services.AddDbContext<exe201.Server.Models.PhotoStudioBookingContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddSignalR();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    // SignalR WebSocket cần AllowCredentials nên không dùng AllowAnyOrigin
                    policy.WithOrigins("http://localhost:5173", "https://localhost:5173",
                                       "http://localhost:56076", "https://localhost:56076")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            // Đăng ký Repositories và Services
            builder.Services.AddScoped<EXE201.Server.Repositories.IStudioRepository, EXE201.Server.Repositories.StudioRepository>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IBookingRepository, EXE201.Server.Repositories.BookingRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.IStudioService, EXE201.Server.Services.StudioService>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IUserRepository, EXE201.Server.Repositories.UserRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.IAuthService, EXE201.Server.Services.AuthService>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IAddressRepository, EXE201.Server.Repositories.AddressRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.IAddressService, EXE201.Server.Services.AddressService>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IAdminRepository, EXE201.Server.Repositories.AdminRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.IAdminService, EXE201.Server.Services.AdminService>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IChatRepository, EXE201.Server.Repositories.ChatRepository>();
            builder.Services.AddScoped<EXE201.Server.Repositories.ICatalogRepository, EXE201.Server.Repositories.CatalogRepository>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IStudioRevenueRepository, EXE201.Server.Repositories.StudioRevenueRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.ICatalogService, EXE201.Server.Services.CatalogService>();
            builder.Services.AddScoped<EXE201.Server.Repositories.IBookingWorkflowRepository, EXE201.Server.Repositories.BookingWorkflowRepository>();
            builder.Services.AddScoped<EXE201.Server.Services.IBookingWorkflowService, EXE201.Server.Services.BookingWorkflowService>();
            builder.Services.AddScoped<EXE201.Server.Services.IStudioRevenueService, EXE201.Server.Services.StudioRevenueService>();
            builder.Services.AddHostedService<EXE201.Server.Services.BookingExpiryWorker>();
            builder.Services.AddHttpClient<EXE201.Server.Services.IGeminiModerationService, EXE201.Server.Services.GeminiModerationService>();

            var jwtSettings = builder.Configuration.GetSection("Jwt");
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
                };
                // SignalR gửi token qua query string khi dùng WebSocket
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "EXE201.Server",
                    Version = "v1"
                });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập JWT token theo dạng: Bearer {token}"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseExceptionHandler();
            }

            app.UseHttpsRedirection();
            app.UseCors("AllowAll");
            app.UseAuthentication();
            app.Use(async (context, next) =>
            {
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!long.TryParse(userIdValue, out var userId))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return;
                    }

                    using var scope = context.RequestServices.CreateScope();
                    var users = scope.ServiceProvider.GetRequiredService<EXE201.Server.Repositories.IUserRepository>();
                    var user = await users.GetUserByIdAsync(userId);
                    if (user == null || user.Status != "ACTIVE")
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return;
                    }
                }

                await next();
            });
            app.UseAuthorization();


            app.MapControllers();
            app.MapHub<ChatHub>("/hubs/chat");  // SignalR endpoint

            var indexPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
            if (File.Exists(indexPath))
            {
                app.MapFallbackToFile("/index.html");
            }

            app.Run();
        }
    }
}
