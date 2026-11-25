import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/axiosClient.js';
import { thongTinCuaHangService } from '../services/thongTinCuaHangService.js';

const StoreInfoContext = createContext({
  storeInfo: null,
  loading: true,
  error: '',
  refreshStoreInfo: () => Promise.resolve(null),
});

const API_ORIGIN = new URL(API_BASE_URL).origin;

const getField = (record, ...keys) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null) return record[key];
  }
  return '';
};

const normalizeLogoUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, `${API_ORIGIN}/`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
};

const normalizeStoreInfo = (record) => ({
  name: getField(record, 'tenCuaHang', 'TenCuaHang'),
  hotline: getField(record, 'hotline', 'Hotline'),
  email: getField(record, 'email', 'Email'),
  address: getField(record, 'diaChi', 'DiaChi'),
  logo: normalizeLogoUrl(getField(record, 'logo', 'Logo')),
  fanpageUrl: getField(record, 'fanpageUrl', 'FanpageUrl'),
  mapEmbedUrl: getField(record, 'mapEmbedUrl', 'MapEmbedUrl'),
  openingHours: getField(record, 'gioMoCua', 'GioMoCua'),
  qrPayment: normalizeLogoUrl(getField(record, 'qrThanhToan', 'QrThanhToan')),
  bankName: getField(record, 'tenNganHang', 'TenNganHang'),
  accountHolder: getField(record, 'tenChuTaiKhoan', 'TenChuTaiKhoan'),
  accountNumber: getField(record, 'soTaiKhoan', 'SoTaiKhoan'),
});

const getErrorMessage = (error) => {
  if (error.response?.status === 404) return 'Thông tin cửa hàng chưa được cấu hình.';
  return error.response?.data?.message || 'Không thể tải thông tin cửa hàng.';
};

export function StoreInfoProvider({ children }) {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshStoreInfo = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await thongTinCuaHangService.getPrimary();
      const record = response?.data?.data ?? response?.data ?? response;
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error('Dữ liệu thông tin cửa hàng không hợp lệ.');
      }

      const normalizedInfo = normalizeStoreInfo(record);
      setStoreInfo(normalizedInfo);
      return normalizedInfo;
    } catch (requestError) {
      console.error('Lỗi khi tải thông tin cửa hàng:', requestError);
      setStoreInfo(null);
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStoreInfo();
  }, [refreshStoreInfo]);

  useEffect(() => {
    if (storeInfo?.name?.trim()) {
      document.title = `${storeInfo.name} | Máy tính & Công nghệ`;
    }
  }, [storeInfo?.name]);

  return (
    <StoreInfoContext.Provider value={{ storeInfo, loading, error, refreshStoreInfo }}>
      {children}
    </StoreInfoContext.Provider>
  );
}

export const useStoreInfo = () => useContext(StoreInfoContext);
