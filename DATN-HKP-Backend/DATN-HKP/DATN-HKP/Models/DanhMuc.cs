using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.Models
{
    public class DanhMuc
    {
        [Key]
        public int MaDanhMuc { get; set; }

        [Required(ErrorMessage = "Tên danh mục không được để trống")]
        [StringLength(100, ErrorMessage = "Tên danh mục không được vượt quá 100 ký tự")]
        [Display(Name = "Tên danh mục")]
        public string TenDanhMuc { get; set; } = string.Empty;

        [Display(Name = "Mô tả")]
        public string MoTa { get; set; } = string.Empty;
        [Display(Name = "Trạng thái")]
        public bool TrangThai { get; set; } = true;
        [Display(Name = "Ngày xoá")]
        public DateTime? NgayXoa { get; set; }

        // Quan hệ 1 - Nhieu với Sản phẩm
        public List<SanPham>? DanhSachSanPham { get; set; }
    }
}