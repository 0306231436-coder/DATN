namespace DATN_HKP.DTOs.Common
{
    public class PagedResponse<T>
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
        public IEnumerable<T> Items { get; set; } = new List<T>();

        public PagedResponse() { }

        public PagedResponse(IEnumerable<T> items, int totalItems, int pageNumber, int pageSize, string message = "Lấy dữ liệu thành công")
        {
            Success = true;
            Message = message;
            TotalItems = totalItems;
            PageNumber = pageNumber;
            PageSize = pageSize;
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
            Items = items;
        }
    }
}
