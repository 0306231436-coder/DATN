using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    [Table("hinhanhsanphams")]
    public class HinhAnhSanPham
    {
        [Key]
        public int MaHinhAnh { get; set; }

        public int MaSanPham { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        [Required]
        public string DuongDanAnh { get; set; } = string.Empty;

        public bool LaAnhChinh { get; set; } = false;

        public int ThuTuHienThi { get; set; } = 0;
    }
}