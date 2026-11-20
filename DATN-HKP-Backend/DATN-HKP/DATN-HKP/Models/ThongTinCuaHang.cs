using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.Models
{
    public class ThongTinCuaHang
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TenCuaHang { get; set; } = string.Empty;
        public string Hotline { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DiaChi { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public string? FanpageUrl { get; set; }
        public string? MapEmbedUrl { get; set; } // Bản đồ Google Maps
        public string? GioMoCua { get; set; }
    }
}