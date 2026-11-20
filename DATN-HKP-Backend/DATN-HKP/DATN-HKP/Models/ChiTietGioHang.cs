using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class ChiTietGioHang
    {
        [Key]
        public int MaChiTietGioHang { get; set; }

        public string MaNguoiDung { get; set; } = string.Empty;

        public int MaSanPham { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        public int? MaBienThe { get; set; }

        [ForeignKey("MaBienThe")]
        public BienTheSanPham? BienThe { get; set; }

        public int SoLuong { get; set; }
    }
}