import axiosClient from '../api/axiosClient';

export const thongTinCuaHangService = {
  getPrimary: () => axiosClient.get('/ThongTinCuaHang/first'),
  create: (data) => axiosClient.post('/ThongTinCuaHang', data),
  update: (id, data) => axiosClient.put(`/ThongTinCuaHang/${id}`, data),
  uploadQr: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/ThongTinCuaHang/${id}/qr-thanh-toan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
