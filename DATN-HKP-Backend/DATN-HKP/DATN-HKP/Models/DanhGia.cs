using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class DanhGia
    {
        [Key]
        public int MaDanhGia { get; set; }

        public int MaSanPham { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        public string MaNguoiDung { get; set; } = string.Empty;

        [Range(1, 5, ErrorMessage = "Đánh giá từ 1 đến 5 sao")]
        [Display(Name = "Số sao")]
        public int SoSao { get; set; }

        [Display(Name = "Nội dung bình luận")]
        public string NoiDung { get; set; } = string.Empty;

        [Display(Name = "Ngày đánh giá")]
        public DateTime NgayDanhGia { get; set; } = DateTime.Now;

        [Display(Name = "Trạng Thái")]
        public bool TrangThai { get; set; } = true;

        [Display(Name = "Ngày Xoá")]
        public DateTime? NgayXoa { get; set; }
    }
}