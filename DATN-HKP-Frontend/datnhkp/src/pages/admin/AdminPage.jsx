import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, ChartNoAxesCombined, Package, ShoppingCart, Users } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { donHangService } from '../../services/donHangService.js';
import { productService } from '../../services/productService.js';
import {
  formatApiDate,
  getApiField,
  getApiList,
  getOrderCustomer,
  getOrderId,
  getOrderStatusStyle,
  normalizeOrderStatus,
} from '../../services/adminDataUtils.js';
import { formatCurrency } from './adminData.js';

const isCancelled = (order) => {
  const status = normalizeOrderStatus(getApiField(order, 'trangThai', 'TrangThai'));
  return status.includes('huy') || status.includes('cancel');
};

const getDate = (order) => getApiField(order, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat', 'createdAt', 'CreatedAt');

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [available, setAvailable] = useState({ orders: false, products: false, customers: false });
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadErrors([]);
    const [ordersResult, productsResult, customersResult] = await Promise.allSettled([
      donHangService.getDonHangs(),
      productService.getSanPhams({ pageNumber: 1, pageSize: 100, includeInactive: true }),
      authService.getUsers(),
    ]);

    const errors = [];
    const ordersList = ordersResult.status === 'fulfilled' ? getApiList(ordersResult.value) : null;
    const productsList = productsResult.status === 'fulfilled' ? getApiList(productsResult.value) : null;
    const customersList = customersResult.status === 'fulfilled' ? getApiList(customersResult.value) : null;

    if (ordersList) setOrders(ordersList);
    else errors.push('Không tải được đơn hàng.');
    if (productsList) setProducts(productsList);
    else errors.push('Không tải được sản phẩm.');
    if (customersList) {
      setCustomers(customersList.filter((user) => normalizeOrderStatus(getApiField(user, 'vaiTro', 'VaiTro', 'role', 'Role')) !== 'admin'));
    } else errors.push('Không tải được khách hàng.');

    setAvailable({
      orders: Boolean(ordersList),
      products: Boolean(productsList),
      customers: Boolean(customersList),
    });
    setLoadErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeOrders = useMemo(() => orders.filter((order) => !isCancelled(order)), [orders]);
  const revenue = activeOrders.reduce((sum, order) => sum + (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0), 0);
  const lowStockProducts = products.filter((product) => {
    const quantity = Number(getApiField(product, 'soLuong', 'SoLuong', 'soLuongTon', 'SoLuongTon'));
    return Number.isFinite(quantity) && quantity <= 5;
  });
  const recentOrders = useMemo(() => [...orders].sort((a, b) => {
    const first = new Date(getDate(a) || 0).getTime();
    const second = new Date(getDate(b) || 0).getTime();
    return second - first;
  }).slice(0, 5), [orders]);

  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const dayOrders = activeOrders.filter((order) => {
        const orderDate = new Date(getDate(order));
        return !Number.isNaN(orderDate.getTime())
          && orderDate.getFullYear() === date.getFullYear()
          && orderDate.getMonth() === date.getMonth()
          && orderDate.getDate() === date.getDate();
      });
      return {
        day: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date),
        revenue: dayOrders.reduce((sum, order) => sum + (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0), 0),
        date,
      };
    });
    const maxRevenue = Math.max(...days.map((day) => day.revenue), 1);
    return days.map((day) => ({ ...day, height: Math.max(day.revenue ? 6 : 0, (day.revenue / maxRevenue) * 100) }));
  }, [activeOrders]);

  const cards = [
    { label: 'Doanh thu', value: available.orders ? formatCurrency(revenue) : '—', note: 'Tổng đơn chưa hủy', icon: ChartNoAxesCombined, tone: 'bg-green-50 text-green-700' },
    { label: 'Đơn hàng', value: available.orders ? orders.length.toLocaleString('vi-VN') : '—', note: available.orders ? `${activeOrders.length} đơn chưa hủy` : 'Chưa có dữ liệu', icon: ShoppingCart, tone: 'bg-blue-50 text-blue-700', href: '/admin/don-hang' },
    { label: 'Khách hàng', value: available.customers ? customers.length.toLocaleString('vi-VN') : '—', note: 'Tài khoản khách hàng', icon: Users, tone: 'bg-violet-50 text-violet-700', href: '/admin/khach-hang' },
    { label: 'Sản phẩm sắp hết', value: available.products ? lowStockProducts.length.toLocaleString('vi-VN') : '—', note: 'Tồn kho không quá 5', icon: Boxes, tone: 'bg-amber-50 text-amber-700', href: '/admin/san-pham' },
  ];

  return (
    <>
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-green-700">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date()).toLocaleUpperCase('vi')}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Tổng quan cửa hàng <span aria-hidden="true">👋</span></h1>
          <p className="mt-2 text-sm text-slate-500">Chỉ số được đồng bộ từ dữ liệu hệ thống.</p>
        </div>
      </section>
      {loadErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          Một số dữ liệu chưa tải được: {loadErrors.join(' ')}
        </div>
      )}
      <section aria-label="Chỉ số cửa hàng" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, tone, href }) => {
          const content = (
            <>
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
              <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900">{loading ? '—' : value}</p>
              <p className="mt-1 text-[11px] text-slate-400">{note}</p>
            </>
          );
          return href
            ? <Link className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 transition hover:border-green-200" key={label} to={href}>{content}</Link>
            : <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40" key={label}>{content}</article>;
        })}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3"><div><h2 className="text-base font-extrabold text-slate-900">Tổng quan doanh thu</h2><p className="mt-1 text-xs text-slate-500">Doanh thu đơn hàng chưa hủy trong 7 ngày qua</p></div></div>
          <div className="mb-4 text-2xl font-black tracking-tight text-slate-900">{loading || !available.orders ? '—' : formatCurrency(chartData.reduce((sum, day) => sum + day.revenue, 0))}</div>
          <div aria-label="Biểu đồ doanh thu 7 ngày" className="grid h-44 grid-cols-7 items-end gap-3 border-b border-slate-100 pb-2 sm:gap-5">
            {chartData.map(({ day, revenue: dayRevenue, height, date }) => (
              <div className="flex h-full flex-col items-center justify-end gap-2" key={date.toISOString()}>
                <div className="flex h-full w-full items-end"><div className={`w-full rounded-t-md ${dayRevenue ? 'bg-green-600' : 'bg-slate-100'}`} style={{ height: `${height}%` }} title={`${formatApiDate(date)}: ${formatCurrency(dayRevenue)}`} /></div>
                <span className="text-[10px] font-medium text-slate-400">{day}</span>
              </div>
            ))}
          </div>
          {!loading && !available.orders && <p className="mt-3 text-xs text-rose-600">Không tải được dữ liệu đơn hàng để lập biểu đồ.</p>}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500"><span className="size-2 rounded-full bg-green-600" /> Doanh thu thực tế</div>
        </section>
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-extrabold text-slate-900">Tồn kho thấp</h2><Link className="inline-flex items-center gap-1 text-xs font-bold text-green-700" to="/admin/san-pham">Quản lý <ArrowRight size={14} /></Link></div>
          {lowStockProducts.length ? (
            <div className="space-y-5">
              {lowStockProducts.slice(0, 5).map((product, index) => (
                <div className="flex items-center gap-3" key={getApiField(product, 'maSanPham', 'MaSanPham') ?? index}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500"><Package size={18} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{getApiField(product, 'tenSanPham', 'TenSanPham') || 'Sản phẩm'}</p><p className="mt-1 text-[10px] text-slate-400">Còn {Number(getApiField(product, 'soLuong', 'SoLuong', 'soLuongTon', 'SoLuongTon')) || 0} sản phẩm</p></div>
                </div>
              ))}
            </div>
          ) : <p className={`py-6 text-sm ${available.products || loading ? 'text-slate-500' : 'text-rose-600'}`}>{loading ? 'Đang tải sản phẩm...' : available.products ? 'Không có sản phẩm tồn kho thấp.' : 'Không tải được dữ liệu sản phẩm.'}</p>}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="text-base font-extrabold text-slate-900">Đơn hàng gần đây</h2><p className="mt-1 text-xs text-slate-500">Theo dõi các đơn hàng mới nhất</p></div><Link className="inline-flex items-center gap-1 text-xs font-bold text-green-700" to="/admin/don-hang">Tất cả đơn hàng <ArrowRight size={14} /></Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead><tr className="bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-6 py-3">Mã đơn hàng</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Ngày đặt</th><th className="px-4 py-3">Tổng tiền</th><th className="px-4 py-3">Trạng thái</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td className="px-6 py-8 text-center text-sm text-slate-500" colSpan={5}>Đang tải đơn hàng...</td></tr> : recentOrders.map((order, index) => {
                const id = getOrderId(order);
                const status = getApiField(order, 'trangThai', 'TrangThai') || 'Chưa cập nhật';
                return <tr className="text-xs" key={id ?? index}><td className="whitespace-nowrap px-6 py-4 font-bold text-green-800">#{id ?? '—'}</td><td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">{getOrderCustomer(order)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatApiDate(getDate(order), { dateStyle: 'short' })}</td><td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">{formatCurrency(Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0)}</td><td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getOrderStatusStyle(status)}`}>{status}</span></td></tr>;
              })}
              {!loading && recentOrders.length === 0 && <tr><td className="px-6 py-8 text-center text-sm text-slate-500" colSpan={5}>{available.orders ? 'Chưa có đơn hàng.' : 'Không tải được dữ liệu đơn hàng.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Link className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-green-200" to="/admin/san-pham"><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Package size={20} /></span><span className="flex-1"><span className="block text-sm font-bold text-slate-900">Quản lý sản phẩm</span><span className="mt-1 block text-xs text-slate-500">{loading ? 'Đang tải...' : available.products ? `${products.length} sản phẩm đã tải` : 'Không tải được sản phẩm'}</span></span><ArrowRight className="text-slate-400" size={17} /></Link>
        <Link className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-green-200" to="/admin/khach-hang"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users size={20} /></span><span className="flex-1"><span className="block text-sm font-bold text-slate-900">Khách hàng</span><span className="mt-1 block text-xs text-slate-500">{loading ? 'Đang tải...' : available.customers ? `${customers.length} tài khoản khách hàng` : 'Không tải được khách hàng'}</span></span><ArrowRight className="text-slate-400" size={17} /></Link>
      </div>
    </>
  );
}
