import axios from 'axios';

const PROVINCES_API_URL = 'https://provinces.open-api.vn/api/v2/p/';

export const provinceService = {
  getProvinces: async () => {
    const response = await axios.get(PROVINCES_API_URL);
    if (!Array.isArray(response.data)) {
      throw new Error('Dữ liệu tỉnh/thành phố không hợp lệ.');
    }

    return response.data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  },

  getWards: async (provinceCode) => {
    const response = await axios.get(`${PROVINCES_API_URL}${provinceCode}/`, {
      params: { depth: 2 },
    });
    if (!Array.isArray(response.data?.wards)) {
      throw new Error('Dữ liệu phường/xã không hợp lệ.');
    }

    return response.data.wards.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  },
};
