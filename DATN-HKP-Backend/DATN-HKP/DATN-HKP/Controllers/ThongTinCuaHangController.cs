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

        public ThongTinCuaHangController(ApplicationDbContext context)
        {
            _context = context;
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

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin cửa hàng thành công", data = info });
        }
    }
}
