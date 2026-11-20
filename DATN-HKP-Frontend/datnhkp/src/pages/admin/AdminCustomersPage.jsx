import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { donHangService } from '../../services/donHangService.js';
import {
  formatApiDate,
  getApiField,
  getApiList,
  normalizeOrderStatus,
} from '../../services/adminDataUtils.js';
import { formatCurrency } from './adminData.js';
import { PageHeading, SearchField } from './AdminComponents.jsx';

const getUserId = (user) => getApiField(user, 'maNguoiDung', 'MaNguoiDung', 'id', 'Id', 'userId', 'UserId');
const getUserName = (user) => getApiField(user, 'hoTen', 'HoTen', 'tenDangNhap', 'TenDangNhap', 'name', 'Name') || 'Chưa cập nhật';
const getDateValue = (user) => getApiField(user, 'ngayTao', 'NgayTao', 'ngayDangKy', 'NgayDangKy', 'createdAt', 'CreatedAt');
const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, ordersResponse] = await Promise.all([
        authService.getUsers(),
        donHangService.getDonHangs(),
      ]);
      const userList = getApiList(usersResponse);
      const orderList = getApiList(ordersResponse);
      if (!userList) throw new Error('Dữ liệu danh sách người dùng từ API không hợp lệ.');
      if (!orderList) throw new Error('Dữ liệu danh sách đơn hàng từ API không hợp lệ.');
      setCustomers(userList.filter((user) => {
        const role = normalizeOrderStatus(getApiField(user, 'vaiTro', 'VaiTro', 'role', 'Role'));
        return role !== 'admin';
      }));
      setOrders(orderList);
    } catch (requestError) {
      console.error('Lỗi khi tải dữ liệu khách hàng quản trị:', requestError);
      setError(requestError.response?.data?.message || requestError.message || 'Không thể tải dữ liệu khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const customerRows = useMemo(() => {
    const ordersByUser = new Map();
    orders.forEach((order) => {
      const nestedUser = getApiField(order, 'nguoiDung', 'NguoiDung', 'khachHang', 'KhachHang', 'user', 'User') || {};
      const userId = getApiField(order, 'maNguoiDung', 'MaNguoiDung') ?? getUserId(nestedUser);
      if (userId === undefined) return;
      const userOrders = ordersByUser.get(String(userId)) || [];
      userOrders.push(order);
      ordersByUser.set(String(userId), userOrders);
    });

    return customers.map((customer) => {
      const id = getUserId(customer);
      const userOrders = ordersByUser.get(String(id)) || [];
      const completedOrders = userOrders.filter((order) => {
        const status = normalizeOrderStatus(getApiField(order, 'trangThai', 'TrangThai'));
        return !status.includes('huy') && !status.includes('cancel');
      });
      const name = getUserName(customer);
      const initials = name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0)).join('').toUpperCase();
      return {
        id: id ?? getApiField(customer, 'email', 'Email') ?? name,
        name,
        email: getApiField(customer, 'email', 'Email') || '—',
        phone: getApiField(customer, 'soDienThoai', 'SoDienThoai', 'phone', 'Phone') || '—',
        joined: getDateValue(customer),
        orderCount: userOrders.length,
        spent: completedOrders.reduce((sum, order) => sum + (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0), 0),
        initials: initials || 'KH',
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return customerRows.filter((customer) => `${customer.name} ${customer.email} ${customer.phone}`.toLocaleLowerCase('vi').includes(normalizedQuery));
  }, [customerRows, query]);

  const newCustomerCount = customerRows.filter((customer) => {
    const joined = toDate(customer.joined);
    if (!joined) return false;
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return joined >= monthAgo;
  }).length;
  const customersWithOrders = customerRows.filter((customer) => customer.orderCount > 0).length;

  return (
    <>
      <PageHeading eyebrow="Chăm sóc khách hàng" title="Quản lý khách hàng" description="Tra cứu hồ sơ và thống kê mua hàng từ dữ liệu hệ thống." />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng khách hàng', value: customers.length },
          { label: 'Khách hàng mới (30 ngày)', value: newCustomerCount },
          { label: 'Đã từng đặt hàng', value: customersWithOrders },
        ].map(({ label, value }) => (
          <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><Users size={20} /></span>
            <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{loading || error ? '—' : value}</p></div>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div><h2 className="text-sm font-extrabold text-slate-900">Danh sách khách hàng</h2><p className="mt-1 text-xs text-slate-500">Thông tin và lịch sử đơn hàng từ máy chủ</p></div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SearchField label="Tìm khách hàng" onChange={setQuery} placeholder="Tên, email hoặc số điện thoại..." value={query} />
          </div>
        </div>
        {error ? (
          <div className="p-8 text-center text-sm text-rose-700" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead><tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-6 py-3">Khách hàng</th><th className="px-4 py-3">Số điện thoại</th><th className="px-4 py-3">Ngày tham gia</th><th className="px-4 py-3">Đơn hàng</th><th className="px-4 py-3">Tổng chi tiêu</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={5}>Đang tải dữ liệu khách hàng...</td></tr>
                  ) : filteredCustomers.map((customer, index) => (
                    <tr className="text-xs hover:bg-slate-50/70" key={customer.id}>
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-full text-[10px] font-extrabold ${['bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700'][index % 4]}`}>{customer.initials}</span><div><p className="font-bold text-slate-800">{customer.name}</p><p className="mt-1 text-[10px] text-slate-400">{customer.email}</p></div></div></td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">{customer.phone}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatApiDate(customer.joined, { dateStyle: 'short' })}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{customer.orderCount}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">{formatCurrency(customer.spent)}</td>
                    </tr>
                  ))}
                  {!loading && filteredCustomers.length === 0 && <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={5}>Không tìm thấy khách hàng phù hợp.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">Hiển thị {loading ? '—' : filteredCustomers.length} / {loading ? '—' : customerRows.length} khách hàng</div>
          </>
        )}
      </section>
    </>
  );
}
