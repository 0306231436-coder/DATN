using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    [Table("sanphams")]
    public class SanPham
    {
        [Key]
        public int MaSanPham { get; set; }

        [Required]
        [StringLength(200)]
        public string TenSanPham { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Gia { get; set; }

        public int SoLuong { get; set; }

        public int LuotBan { get; set; } = 0; // BỔ SUNG CỘT NÀY

        public string HinhAnh { get; set; } = string.Empty;

        public string ThongSoKyThuat { get; set; } = string.Empty;

        public string MoTa { get; set; } = string.Empty;

        public int MaDanhMuc { get; set; }

        [ForeignKey("MaDanhMuc")]
        public DanhMuc? DanhMuc { get; set; }

        public int MaThuongHieu { get; set; }

        [ForeignKey("MaThuongHieu")]
        public ThuongHieu? ThuongHieu { get; set; }

        public bool TrangThai { get; set; } = true;

        public DateTime? NgayXoa { get; set; }

        public ICollection<BienTheSanPham> BienTheSanPhams { get; set; } = new List<BienTheSanPham>();

        public ICollection<HinhAnhSanPham> HinhAnhSanPhams { get; set; } = new List<HinhAnhSanPham>();
    }
}