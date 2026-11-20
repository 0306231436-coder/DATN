using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.Models
{
    public class ThuongHieu
    {
        [Key]
        public int MaThuongHieu { get; set; }

        [Required(ErrorMessage = "Tên thương hiệu không được để trống")]
        [StringLength(100)]
        [Display(Name = "Tên thương hiệu")]
        public string TenThuongHieu { get; set; } = string.Empty;

        [Display(Name = "Logo")]
        public string Logo { get; set; } = string.Empty;

        [Display(Name = "Trạng Thái")]
        public bool TrangThai { get; set; } = true;

        [Display(Name = "Ngày Xoá")]
        public DateTime? NgayXoa { get; set; }

        public List<SanPham>? DanhSachSanPham { get; set; }
    }
}