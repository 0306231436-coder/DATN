namespace DATN_HKP.DTOs.SanPham
{
    public class ProductQueryParameters
    {
        private const int MaxPageSize = 50;
        private int _pageSize = 10;

        public string? Search { get; set; }
        public int? MaDanhMuc { get; set; }
        public string? Category { get; set; }
        public int? MaThuongHieu { get; set; }
        public string? Brand { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        /// <summary>
        /// Sắp xếp: gia_asc, gia_desc, ten_asc, ten_desc, moinhat
        /// </summary>
        public string? SortBy { get; set; } = "moinhat";

        public int PageNumber { get; set; } = 1;

        public int? Page
        {
            get => PageNumber;
            set
            {
                if (value.HasValue && value.Value > 0)
                {
                    PageNumber = value.Value;
                }
            }
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 1 : value);
        }

        public bool IncludeInactive { get; set; } = false;
    }
}
