import axiosClient from '../api/axiosClient';

export const diaChiNguoiDungService = {
  getByUser: (maNguoiDung) => axiosClient.get(`/DiaChiNguoiDung/user/${maNguoiDung}`),
  create: (data) => axiosClient.post('/DiaChiNguoiDung', data),
  update: (id, data) => axiosClient.put(`/DiaChiNguoiDung/${id}`, data),
  setDefault: (id) => axiosClient.put(`/DiaChiNguoiDung/${id}/set-default`),
  remove: (id) => axiosClient.delete(`/DiaChiNguoiDung/${id}`),
};
