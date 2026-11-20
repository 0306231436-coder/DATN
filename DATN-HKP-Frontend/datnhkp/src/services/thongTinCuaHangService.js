import axiosClient from '../api/axiosClient';

export const thongTinCuaHangService = {
  getPrimary: () => axiosClient.get('/ThongTinCuaHang/first'),
  create: (data) => axiosClient.post('/ThongTinCuaHang', data),
  update: (id, data) => axiosClient.put(`/ThongTinCuaHang/${id}`, data),
};
