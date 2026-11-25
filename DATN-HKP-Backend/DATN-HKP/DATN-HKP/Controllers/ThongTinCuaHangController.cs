using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThongTinCuaHangController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ThongTinCuaHangController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/ThongTinCuaHang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThongTinCuaHang>>> GetThongTinCuaHangs()
        {
            return await _context.ThongTinCuaHangs.AsNoTracking().ToListAsync();
        }

        // GET: api/ThongTinCuaHang/first
        [HttpGet("first")]
        public async Task<ActionResult<ThongTinCuaHang>> GetThongTinChinh()
        {
            var info = await _context.ThongTinCuaHangs.AsNoTracking().FirstOrDefaultAsync();
            if (info == null)
            {
                return NotFound(new { message = "Chưa thiết lập thông tin cửa hàng" });
            }
            return Ok(info);
        }

        // GET: api/ThongTinCuaHang/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ThongTinCuaHang>> GetThongTinCuaHang(int id)
        {
            var info = await _context.ThongTinCuaHangs
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (info == null)
            {
                return NotFound(new { message = $"Không tìm thấy thông tin cửa hàng với mã {id}" });
            }

            return Ok(info);
        }

        // POST: api/ThongTinCuaHang
        [HttpPost]
        public async Task<ActionResult<ThongTinCuaHang>> CreateThongTinCuaHang([FromBody] ThongTinCuaHang model)
        {
            model.QrThanhToan = model.QrThanhToan;
            model.TenNganHang = model.TenNganHang;
            model.TenChuTaiKhoan = model.TenChuTaiKhoan;
            model.SoTaiKhoan = model.SoTaiKhoan;
            _context.ThongTinCuaHangs.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetThongTinCuaHang), new { id = model.Id }, model);
        }

        // PUT: api/ThongTinCuaHang/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateThongTinCuaHang(int id, [FromBody] ThongTinCuaHang model)
        {
            var info = await _context.ThongTinCuaHangs.FindAsync(id);
            if (info == null)
            {
                return NotFound(new { message = $"Không tìm thấy thông tin cửa hàng mã {id}" });
            }

            info.TenCuaHang = model.TenCuaHang;
            info.Hotline = model.Hotline;
            info.Email = model.Email;
            info.DiaChi = model.DiaChi;
            info.GioMoCua = model.GioMoCua;
            info.FanpageUrl = model.FanpageUrl;
            info.MapEmbedUrl = model.MapEmbedUrl;
            info.Logo = model.Logo;
            info.QrThanhToan = model.QrThanhToan;
            info.TenNganHang = model.TenNganHang;
            info.TenChuTaiKhoan = model.TenChuTaiKhoan;
            info.SoTaiKhoan = model.SoTaiKhoan;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin cửa hàng thành công", data = info });
        }

        // POST: api/ThongTinCuaHang/{id}/qr-thanh-toan
        [HttpPost("{id:int}/qr-thanh-toan")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadQrThanhToan(int id, IFormFile file)
        {
            var info = await _context.ThongTinCuaHangs.FindAsync(id);
            if (info == null)
            {
                return NotFound(new { message = $"Không tìm thấy thông tin cửa hàng mã {id}" });
            }
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ảnh mã QR." });
            }
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Ảnh mã QR không được vượt quá 5 MB." });
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension is not ".jpg" and not ".jpeg" and not ".png" and not ".webp")
            {
                return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." });
            }

            using var stream = file.OpenReadStream();
            var signature = new byte[12];
            var bytesRead = await stream.ReadAsync(signature.AsMemory(0, signature.Length));
            var valid = (extension is ".jpg" or ".jpeg"
                    && bytesRead >= 3 && signature[0] == 0xFF && signature[1] == 0xD8 && signature[2] == 0xFF)
                || (extension == ".png"
                    && bytesRead >= 8 && signature[0] == 0x89 && signature[1] == 0x50
                    && signature[2] == 0x4E && signature[3] == 0x47)
                || (extension == ".webp"
                    && bytesRead >= 12 && signature[0] == 0x52 && signature[1] == 0x49
                    && signature[8] == 0x57 && signature[9] == 0x45
                    && signature[10] == 0x42 && signature[11] == 0x50);
            if (!valid)
            {
                return BadRequest(new { message = "Nội dung file không phải ảnh hợp lệ." });
            }

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var folder = Path.Combine(webRoot, "uploads", "payment");
            Directory.CreateDirectory(folder);
            var fileName = $"qr-{Guid.NewGuid():N}{extension}";
            var path = Path.Combine(folder, fileName);
            stream.Position = 0;
            await using (var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write))
            {
                await stream.CopyToAsync(output);
            }

            if (!string.IsNullOrWhiteSpace(info.QrThanhToan))
            {
                var oldName = Path.GetFileName(info.QrThanhToan);
                var oldPath = Path.Combine(folder, oldName);
                if (System.IO.File.Exists(oldPath))
                {
                    System.IO.File.Delete(oldPath);
                }
            }

            info.QrThanhToan = $"/uploads/payment/{fileName}";
            await _context.SaveChangesAsync();
            return Ok(new
            {
                message = "Đã cập nhật mã QR thanh toán.",
                qrThanhToan = info.QrThanhToan,
                data = info
            });
        }
    }
}
