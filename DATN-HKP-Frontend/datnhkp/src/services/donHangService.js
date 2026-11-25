import axiosClient from '../api/axiosClient';

export const donHangService = {
  // Lấy danh sách đơn hàng (hỗ trợ lọc theo maNguoiDung, trangThai)
  getDonHangs: (params = {}) => {
    return axiosClient.get('/DonHang', {
      params: {
        maNguoiDung: params.maNguoiDung || '',
        trangThai: params.trangThai || '',
      },
    });
  },

  // Lấy dữ liệu thống kê tổng số đơn, doanh thu và trạng thái đơn hàng
  getThongKe: () => axiosClient.get('/DonHang/thong-ke'),

  // Lấy chi tiết đơn hàng theo ID
  getDonHangById: (id) => axiosClient.get(`/DonHang/${id}`),

  // Tra cứu chi tiết đơn hàng theo mã hiển thị
  getDonHangByMaHienThi: (maHienThi) =>
    axiosClient.get(`/DonHang/ma/${encodeURIComponent(maHienThi.trim())}`),

  // Lấy danh sách đơn hàng của một người dùng cụ thể
  getDonHangsByUser: (maNguoiDung) => axiosClient.get(`/DonHang/user/${maNguoiDung}`),

  // Tạo đơn hàng mới
  createDonHang: (data) => axiosClient.post('/DonHang', data),

  // Tải ảnh xác nhận thanh toán chuyển khoản
  uploadPaymentProof: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/DonHang/${id}/thong-bao-thanh-toan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  confirmPayment: (id) => axiosClient.put(`/DonHang/${id}/xac-nhan-thanh-toan`),

  rejectPayment: (id, lyDo) => axiosClient.put(`/DonHang/${id}/tu-choi-thanh-toan`, { lyDo }),

  getPaymentProof: (id) => axiosClient.get(`/DonHang/${id}/hinh-thanh-toan`, {
    responseType: 'blob',
  }),

  // Backend cập nhật trạng thái và xử lý tồn kho trong cùng một transaction.
  updateTrangThai: (id, trangThai) => 
    axiosClient.put(`/DonHang/${id}/trang-thai`, { trangThai }),

  // Cập nhật toàn bộ thông tin đơn hàng
  updateDonHang: (id, data) => axiosClient.put(`/DonHang/${id}`, data),

  // Xóa đơn hàng
  deleteDonHang: (id) => axiosClient.delete(`/DonHang/${id}`),
};

export default donHangService;