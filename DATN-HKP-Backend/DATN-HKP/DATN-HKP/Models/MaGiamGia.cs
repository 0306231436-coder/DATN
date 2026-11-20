using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class MaGiamGia
    {
        [Key]
        public int MaVoucher { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty; // VD: "GIAM100K", "DISCOUNT10"

        [Column(TypeName = "decimal(18,2)")]
        public decimal SoTienGiam { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GiaTriToiThieu { get; set; } // Đơn hàng tối thiểu để áp dụng

        public int SoLuong { get; set; }

        public DateTime NgayBatDau { get; set; }
        public DateTime NgayKetThuc { get; set; }
        public bool TrangThai { get; set; } = true;
    }
}