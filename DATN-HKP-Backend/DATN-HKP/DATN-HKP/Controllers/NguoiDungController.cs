using DATN_HKP.Data;
using DATN_HKP.DTOs.NguoiDung;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NguoiDungController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<NguoiDung> _passwordHasher = new PasswordHasher<NguoiDung>();

        public NguoiDungController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // GET: api/NguoiDung
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<NguoiDungDto>>> GetNguoiDungs()
        {
            var users = await _context.NguoiDungs
                .AsNoTracking()
                .Select(u => new NguoiDungDto
                {
                    MaNguoiDung = u.MaNguoiDung,
                    TenDangNhap = u.TenDangNhap,
                    Email = u.Email,
                    HoTen = u.HoTen,
                    SoDienThoai = u.SoDienThoai,
                    VaiTro = u.VaiTro,
                    NgayTao = u.NgayTao,
                    TrangThai = u.TrangThai
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/NguoiDung/5
        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<ActionResult<NguoiDungDto>> GetNguoiDung(int id)
        {
            var isAdmin = User.IsInRole("Admin");
            var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!isAdmin && (!int.TryParse(subject, out int currentUserId) || currentUserId != id))
            {
                return Forbid();
            }

            var user = await _context.NguoiDungs
                .AsNoTracking()
                .Where(u => u.MaNguoiDung == id)
                .Select(u => new NguoiDungDto
                {
                    MaNguoiDung = u.MaNguoiDung,
                    TenDangNhap = u.TenDangNhap,
                    Email = u.Email,
                    HoTen = u.HoTen,
                    SoDienThoai = u.SoDienThoai,
                    VaiTro = u.VaiTro,
                    NgayTao = u.NgayTao,
                    TrangThai = u.TrangThai
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng có mã {id}" });
            }

            return Ok(user);
        }

        // POST: api/NguoiDung (Đăng ký)
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<object>> CreateNguoiDung([FromBody] NguoiDungCreateDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var cleanUsername = request.TenDangNhap.Trim().ToLower();
            var cleanEmail = request.Email.Trim().ToLower();
            var cleanPhone = request.SoDienThoai?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(cleanPhone) ||
                cleanPhone.Length != 10 ||
                !cleanPhone.StartsWith("0") ||
                !cleanPhone.All(char.IsDigit))
            {
                return BadRequest(new { message = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số" });
            }

            var usernameExists = await _context.NguoiDungs.AnyAsync(u => u.TenDangNhap.ToLower() == cleanUsername);
            if (usernameExists)
            {
                return BadRequest(new { message = "Tên đăng nhập này đã được sử dụng trong hệ thống" });
            }

            var emailExists = await _context.NguoiDungs.AnyAsync(u => u.Email.ToLower() == cleanEmail);
            if (emailExists)
            {
                return BadRequest(new { message = "Email này đã được sử dụng trong hệ thống" });
            }

            var user = new NguoiDung
            {
                TenDangNhap = request.TenDangNhap.Trim(),
                Email = request.Email.Trim(),
                HoTen = request.HoTen.Trim(),
                SoDienThoai = cleanPhone,
                VaiTro = string.IsNullOrWhiteSpace(request.VaiTro) ? "Customer" : request.VaiTro,
                NgayTao = DateTime.Now,
                TrangThai = true
            };

            user.MatKhau = _passwordHasher.HashPassword(user, request.MatKhau);

            _context.NguoiDungs.Add(user);
            await _context.SaveChangesAsync();

            var dto = new NguoiDungDto
            {
                MaNguoiDung = user.MaNguoiDung,
                TenDangNhap = user.TenDangNhap,
                Email = user.Email,
                HoTen = user.HoTen,
                SoDienThoai = user.SoDienThoai,
                VaiTro = user.VaiTro,
                NgayTao = user.NgayTao,
                TrangThai = user.TrangThai
            };

            var token = CreateJwtToken(dto);

            return CreatedAtAction(nameof(GetNguoiDung), new { id = user.MaNguoiDung }, new
            {
                message = "Đăng ký tài khoản thành công",
                token = token,
                user = dto
            });
        }

        // POST: api/NguoiDung/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> Login([FromBody] NguoiDungLoginDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var keyword = request.UserNameOrEmail.Trim().ToLower();
            var user = await _context.NguoiDungs
                .FirstOrDefaultAsync(u =>
                    u.TenDangNhap.ToLower() == keyword ||
                    u.Email.ToLower() == keyword);

            if (user == null)
            {
                return Unauthorized(new { message = "Tên đăng nhập / Email hoặc mật khẩu không chính xác" });
            }

            bool isPasswordCorrect = false;
            try
            {
                var result = _passwordHasher.VerifyHashedPassword(user, user.MatKhau, request.MatKhau);
                isPasswordCorrect = (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded);
            }
            catch
            {
                isPasswordCorrect = false;
            }

            // Fallback plain-text (chỉ dùng khi đang migrate)
            if (!isPasswordCorrect && user.MatKhau == request.MatKhau)
            {
                isPasswordCorrect = true;
            }

            if (!isPasswordCorrect)
            {
                return Unauthorized(new { message = "Tên đăng nhập / Email hoặc mật khẩu không chính xác" });
            }

            if (!user.TrangThai)
            {
                return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ." });
            }

            var dto = new NguoiDungDto
            {
                MaNguoiDung = user.MaNguoiDung,
                TenDangNhap = user.TenDangNhap,
                Email = user.Email,
                HoTen = user.HoTen,
                SoDienThoai = user.SoDienThoai,
                VaiTro = user.VaiTro,
                NgayTao = user.NgayTao,
                TrangThai = user.TrangThai
            };
            var token = CreateJwtToken(dto);

            return Ok(new
            {
                success = true,
                message = "Đăng nhập thành công",
                token = token,
                user = dto
            });
        }

        // PUT: api/NguoiDung/5
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateNguoiDung(int id, [FromBody] NguoiDungUpdateDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var isAdmin = User.IsInRole("Admin");
            var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!isAdmin && (!int.TryParse(subject, out int currentUserId) || currentUserId != id))
            {
                return Forbid();
            }

            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng có mã {id}" });
            }

            if (!string.IsNullOrWhiteSpace(request.HoTen))
                user.HoTen = request.HoTen.Trim();

            if (request.SoDienThoai != null)
            {
                var phone = request.SoDienThoai.Trim();
                if (phone.Length != 10 || !phone.StartsWith("0") || !phone.All(char.IsDigit))
                {
                    return BadRequest(new { message = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số" });
                }
                user.SoDienThoai = phone;
            }

            if (isAdmin && !string.IsNullOrWhiteSpace(request.VaiTro))
                user.VaiTro = request.VaiTro;

            if (isAdmin && request.TrangThai.HasValue)
                user.TrangThai = request.TrangThai.Value;

            if (!string.IsNullOrWhiteSpace(request.MatKhauMoi))
            {
                user.MatKhau = _passwordHasher.HashPassword(user, request.MatKhauMoi);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật người dùng thành công" });
        }

        // PUT: api/NguoiDung/5/trang-thai
        [HttpPut("{id:int}/trang-thai")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleTrangThai(int id)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng có mã {id}" });
            }

            user.TrangThai = !user.TrangThai;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = user.TrangThai ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
                trangThai = user.TrangThai
            });
        }

        // DELETE: api/NguoiDung/5
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNguoiDung(int id)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng có mã {id}" });
            }

            // Xóa luôn các địa chỉ liên quan (nếu muốn cascade)
            var addresses = await _context.DiaChiNguoiDungs
                .Where(d => d.MaNguoiDung == id)
                .ToListAsync();
            _context.DiaChiNguoiDungs.RemoveRange(addresses);

            _context.NguoiDungs.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa người dùng {user.TenDangNhap} thành công" });
        }

        private string CreateJwtToken(NguoiDungDto user)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"] ?? throw new InvalidOperationException("Thiếu khóa JWT.")));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var durationInDays = int.TryParse(jwtSection["DurationInDays"], out var configuredDays)
                ? configuredDays
                : 7;

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.MaNguoiDung.ToString()),
                new Claim(ClaimTypes.Name, user.TenDangNhap),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.VaiTro)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSection["Issuer"],
                audience: jwtSection["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(durationInDays),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}