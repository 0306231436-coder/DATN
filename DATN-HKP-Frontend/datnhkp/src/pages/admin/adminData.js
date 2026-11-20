export const orders = [
  { id: '#DH-261106', customer: 'Nguyễn Minh Anh', date: '06/11/2026', amount: 28990000, status: 'Đã giao' },
  { id: '#DH-261105', customer: 'Trần Hoàng Nam', date: '06/11/2026', amount: 15490000, status: 'Đang giao' },
  { id: '#DH-261104', customer: 'Lê Thu Hà', date: '05/11/2026', amount: 3290000, status: 'Chờ xác nhận' },
  { id: '#DH-261103', customer: 'Phạm Quốc Bảo', date: '05/11/2026', amount: 21990000, status: 'Đã giao' },
];

export const products = [
  { name: 'MacBook Air M3 13 inch', category: 'Laptop', sku: 'MBA-M3-013', stock: 24, sold: 86, price: 28990000 },
  { name: 'Laptop ASUS Vivobook 15', category: 'Laptop', sku: 'ASU-VB-015', stock: 8, sold: 64, price: 15490000 },
  { name: 'Màn hình Dell UltraSharp', category: 'Màn hình', sku: 'DEL-US-027', stock: 3, sold: 42, price: 8990000 },
  { name: 'Bàn phím cơ Keychron K8', category: 'Phụ kiện', sku: 'KEY-K8-001', stock: 0, sold: 31, price: 2190000 },
];

export const customers = [
  { name: 'Nguyễn Minh Anh', email: 'minhanh@gmail.com', phone: '0901 234 567', orders: 8, spent: 52890000, joined: '06/11/2026', initials: 'MA' },
  { name: 'Trần Hoàng Nam', email: 'hoangnam@gmail.com', phone: '0902 345 678', orders: 5, spent: 38450000, joined: '05/11/2026', initials: 'HN' },
  { name: 'Lê Thu Hà', email: 'thuha@gmail.com', phone: '0903 456 789', orders: 3, spent: 12990000, joined: '04/11/2026', initials: 'TH' },
  { name: 'Phạm Quốc Bảo', email: 'quocbao@gmail.com', phone: '0904 567 890', orders: 6, spent: 64390000, joined: '03/11/2026', initials: 'QB' },
];

export const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

export const statusStyles = {
  'Đã giao': 'bg-green-50 text-green-700',
  'Đang giao': 'bg-blue-50 text-blue-700',
  'Chờ xác nhận': 'bg-amber-50 text-amber-700',
};
