export function getApiList(response) {
  const candidates = [
    response,
    response?.data,
    response?.items,
    response?.Items,
    response?.donHangs,
    response?.DonHangs,
    response?.nguoiDungs,
    response?.NguoiDungs,
    response?.sanPhams,
    response?.SanPhams,
    response?.$values,
    response?.data?.data,
    response?.data?.items,
    response?.data?.Items,
    response?.data?.donHangs,
    response?.data?.DonHangs,
    response?.data?.nguoiDungs,
    response?.data?.NguoiDungs,
    response?.data?.sanPhams,
    response?.data?.SanPhams,
    response?.data?.$values,
  ];
  return candidates.find(Array.isArray) || null;
}

export function getApiField(value, ...keys) {
  for (const key of keys) {
    if (value?.[key] !== undefined && value[key] !== null && value[key] !== '') {
      return value[key];
    }
  }
  return undefined;
}

export function normalizeOrderStatus(status) {
  return String(status || '')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .trim();
}

export function getAllowedOrderStatuses(status) {
  const normalized = normalizeOrderStatus(status);

  if (normalized.includes('huy') || normalized.includes('cancel')
    || normalized.includes('da giao') || normalized.includes('hoan tat')
    || normalized.includes('completed') || normalized.includes('delivered')) {
    return [];
  }
  if (normalized.includes('cho') || normalized.includes('xac nhan') || normalized.includes('pending')) {
    return ['Đang xử lý', 'Đã hủy'];
  }
  if (normalized.includes('dang xu ly') || normalized.includes('processing')) {
    return ['Đang giao', 'Đã hủy'];
  }
  if (normalized.includes('dang giao') || normalized.includes('van chuyen') || normalized.includes('shipping')) {
    return ['Đã giao', 'Đã hủy'];
  }
  return [];
}

export function getOrderStatusStyle(status) {
  const value = normalizeOrderStatus(status);
  if (value.includes('huy') || value.includes('cancel')) return 'bg-rose-50 text-rose-700';
  if (value.includes('giao') || value.includes('deliver') || value.includes('hoan tat')) return 'bg-green-50 text-green-700';
  if (value.includes('van chuyen') || value.includes('ship') || value.includes('dang xu ly')) return 'bg-blue-50 text-blue-700';
  if (value.includes('cho') || value.includes('xac nhan') || value.includes('pending')) return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function formatApiDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

export function getOrderId(order) {
  return getApiField(order, 'maDonHang', 'MaDonHang', 'id', 'Id');
}

export function getOrderDisplayCode(order) {
  return getApiField(order, 'maDonHangHienThi', 'MaDonHangHienThi', 'maDonHangHienThiDisplay')
    || getOrderId(order);
}

export function getOrderCustomer(order) {
  const customer = getApiField(order, 'nguoiDung', 'NguoiDung', 'khachHang', 'KhachHang', 'user', 'User') || {};
  return getApiField(order, 'tenNguoiNhan', 'TenNguoiNhan')
    || getApiField(customer, 'hoTen', 'HoTen', 'tenDangNhap', 'TenDangNhap')
    || 'Khách hàng';
}
