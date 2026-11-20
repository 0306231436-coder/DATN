using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class BienTheSanPham
    {
        [Key]
        public int MaBienThe { get; set; }

        public int MaSanPham { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        [Required]
        [StringLength(100)]
        [Display(Name = "Tên biến thể")] // VD: "RAM 16GB - SSD 512GB - Màu Xám"
        public string TenBienThe { get; set; } = string.Empty;

        [StringLength(50)]
        public string? SKU { get; set; } // Mã định danh kho hàng

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá bán")]
        public decimal Gia { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Giá khuyến mãi")]
        public decimal? GiaKhuyenMai { get; set; }

        [Display(Name = "Số lượng tồn kho")]
        public int SoLuongTon { get; set; }

        [Display(Name = "Hình ảnh đại diện biến thể")]
        public string? HinhAnh { get; set; }

        [Display(Name = "Trạng Thái")]
        public bool TrangThai { get; set; } = true;

        [Display(Name = "Ngày Xoá")]
        public DateTime? NgayXoa { get; set; }
    }
}