using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class LogThanhToan
    {
        [Key]
        public int Id { get; set; }

        public int MaDonHang { get; set; }

        [ForeignKey(nameof(MaDonHang))]
        public DonHang? DonHang { get; set; }

        [Required]
        [StringLength(100)]
        public string HanhDong { get; set; } = string.Empty;

        [StringLength(100)]
        public string? NguoiThucHien { get; set; }

        [StringLength(1000)]
        public string? LyDo { get; set; }

        public DateTime ThoiDiem { get; set; } = DateTime.Now;
    }
}
