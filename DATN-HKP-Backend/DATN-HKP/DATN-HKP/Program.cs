using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Cấu hình Chuỗi Kết Nối CSDL (MySQL / MariaDB)
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Không tìm thấy chuỗi kết nối 'DefaultConnection'.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Tự động phát hiện phiên bản MySQL/MariaDB
    var serverVersion = ServerVersion.AutoDetect(connectionString);

    options.UseMySql(connectionString, serverVersion, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,                          // Thử lại tối đa 5 lần khi mất kết nối mạng
            maxRetryDelay: TimeSpan.FromSeconds(10),   // Thời gian chờ giữa mỗi lần thử lại
            errorNumbersToAdd: null
        );
        mySqlOptions.CommandTimeout(30);               // Timeout câu lệnh SQL (30 giây)
    });
});

// ==========================================
// 2. Cấu hình CORS (Cho phép ReactJS truy cập API)
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                    "http://localhost:5173", // Vite default
                    "http://localhost:5174",
                    "http://localhost:3000"  // Create React App
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ==========================================
// 3. Đăng ký Controllers & Cấu hình JSON Serializer
// ==========================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Chống lỗi lặp vòng vô hạn (Circular Reference) khi return Entity có Navigation
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        // Chuyển Enum thành chuỗi String thay vì số Int khi trả về JSON
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ==========================================
// 4. Cấu hình Identity (Quản lý User & Role)
// ==========================================
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>();

// ==========================================
// 5. Cấu hình Swagger / OpenAPI
// ==========================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DATN HKP API",
        Version = "v1",
        Description = "Hệ thống API Backend quản lý linh kiện, máy tính và thương mại điện tử"
    });
    // Tránh lỗi Swagger 500 do xung đột route
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    c.CustomSchemaIds(type => type.FullName ?? type.Name);
});

var app = builder.Build();

// ==========================================
// 6. Cấu hình Middleware Pipeline
// ==========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DATN HKP API v1");
    });
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// BẮT BỘC: Phục vụ file tĩnh (Hình ảnh sản phẩm tải lên trong thư mục wwwroot)
app.UseStaticFiles();

app.UseRouting();

// Middleware CORS BẮT BUỘC nằm giữa UseRouting và UseAuthentication / UseAuthorization
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

// Định tuyến API Controllers
app.MapControllers();

// ==========================================
// 7. Tự động Migration & Khởi tạo dữ liệu mẫu (Seed Data)
// ==========================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        // Tự động áp dụng Migration tạo/cập nhật bảng nếu CSDL chưa có
        await context.Database.MigrateAsync();

        // Nạp dữ liệu mẫu
        await DbSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Có lỗi xảy ra khi tự động Migrate hoặc khởi tạo dữ liệu mẫu (Seed Data).");
    }
}

app.Run();