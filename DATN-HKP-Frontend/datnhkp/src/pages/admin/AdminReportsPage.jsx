    import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartNoAxesCombined, LoaderCircle, ShoppingCart, Users } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { donHangService } from '../../services/donHangService.js';
import { formatApiDate, getApiField, getApiList, normalizeOrderStatus } from '../../services/adminDataUtils.js';
import { formatCurrency } from './adminData.js';
import { PageHeading } from './AdminComponents.jsx';

const periods = [
  { days: 7, label: '7 ngày qua' },
  { days: 30, label: '30 ngày qua' },
  { days: 90, label: '90 ngày qua' },
];

const getOrderDate = (order) => getApiField(order, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat', 'createdAt', 'CreatedAt');
const isCancelled = (order) => {
  const status = normalizeOrderStatus(getApiField(order, 'trangThai', 'TrangThai'));
  return status.includes('huy') || status.includes('cancel');
};

export default function AdminReportsPage() {
  const [period, setPeriod] = useState(7);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersResponse, usersResponse] = await Promise.all([
        donHangService.getDonHangs(),
        authService.getUsers(),
      ]);
      const orderList = getApiList(ordersResponse);
      const userList = getApiList(usersResponse);
      if (!orderList || !userList) throw new Error('Dữ liệu báo cáo từ API không hợp lệ.');
      setOrders(orderList);
      setCustomers(userList.filter((user) => normalizeOrderStatus(getApiField(user, 'vaiTro', 'VaiTro', 'role', 'Role')) !== 'admin'));
    } catch (requestError) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', requestError);
      setError(requestError.response?.data?.message || requestError.message || 'Không thể tải dữ liệu báo cáo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const report = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - period + 1);
    const isInRange = (value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= start && date <= now;
    };

    const periodOrders = orders.filter((order) => isInRange(getOrderDate(order)));
    const paidOrders = periodOrders.filter((order) => !isCancelled(order));
    const periodCustomers = customers.filter((customer) => isInRange(getApiField(customer, 'ngayTao', 'NgayTao', 'ngayDangKy', 'NgayDangKy', 'createdAt', 'CreatedAt')));
    const bucketCount = Math.min(7, period);
    const bucketDays = Math.ceil(period / bucketCount);
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + index * bucketDays);
      const bucketEnd = new Date(start);
      bucketEnd.setDate(start.getDate() + Math.min((index + 1) * bucketDays, period));
      bucketEnd.setMilliseconds(bucketEnd.getMilliseconds() - 1);
      const bucketOrders = paidOrders.filter((order) => {
        const date = new Date(getOrderDate(order));
        return !Number.isNaN(date.getTime()) && date >= bucketStart && date <= bucketEnd;
      });
      return {
        label: period === 7
          ? new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(bucketStart)
          : formatApiDate(bucketStart, { day: '2-digit', month: '2-digit' }),
        revenue: bucketOrders.reduce((sum, order) => sum + (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0), 0),
        count: bucketOrders.length,
      };
    });
    const maxRevenue = Math.max(...buckets.map((bucket) => bucket.revenue), 1);
    return {
      revenue: paidOrders.reduce((sum, order) => sum + (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) || 0), 0),
      orderCount: periodOrders.length,
      newCustomers: periodCustomers.length,
      buckets: buckets.map((bucket) => ({ ...bucket, height: bucket.revenue ? Math.max(5, (bucket.revenue / maxRevenue) * 100) : 0 })),
    };
  }, [customers, orders, period]);

  return (
    <>
      <PageHeading eyebrow="Phân tích cửa hàng" title="Báo cáo" description="Thống kê doanh thu, đơn hàng và khách hàng theo dữ liệu hệ thống.">
        <select aria-label="Chọn khoảng thời gian báo cáo" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-green-500" onChange={(event) => setPeriod(Number(event.target.value))} value={period}>
          {periods.map(({ days, label }) => <option key={days} value={days}>{label}</option>)}
        </select>
      </PageHeading>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700" role="alert">
          <p>{error}</p>
          <button className="mt-3 font-bold underline" onClick={loadReportData} type="button">Thử tải lại</button>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Tổng doanh thu', value: formatCurrency(report.revenue), icon: ChartNoAxesCombined, tone: 'bg-green-50 text-green-700' },
              { label: 'Tổng đơn hàng', value: report.orderCount.toLocaleString('vi-VN'), icon: ShoppingCart, tone: 'bg-blue-50 text-blue-700' },
              { label: 'Khách hàng mới', value: report.newCustomers.toLocaleString('vi-VN'), icon: Users, tone: 'bg-violet-50 text-violet-700' },
            ].map(({ label, value, icon: Icon, tone }) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
                <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
                <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{loading ? '—' : value}</p>
              </article>
            ))}
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-base font-extrabold text-slate-900">Doanh thu theo thời gian</h2><p className="mt-1 text-xs text-slate-500">Các đơn đã đặt trong {period} ngày qua, không tính đơn đã hủy</p></div>
              <span className="text-xs font-semibold text-slate-500">Tổng: {loading ? '—' : formatCurrency(report.revenue)}</span>
            </div>
            {loading ? (
              <div className="grid h-64 place-items-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={18} />Đang tải báo cáo...</div>
            ) : (
              <>
                <div aria-label="Biểu đồ doanh thu và số đơn hàng" className="mt-8 grid h-64 grid-cols-7 items-end gap-3 border-b border-slate-100 pb-2 sm:gap-6">
                  {report.buckets.map(({ label, revenue, count, height }, index) => (
                    <div className="flex h-full flex-col items-center justify-end gap-2" key={`${label}-${index}`}>
                      <div className="flex h-full w-full max-w-12 items-end justify-center gap-1">
                        <div className={`w-1/2 rounded-t ${revenue ? 'bg-green-600' : 'bg-slate-100'}`} style={{ height: `${height}%` }} title={`${label}: ${formatCurrency(revenue)}`} />
                        <div className={`w-1/2 rounded-t ${count ? 'bg-blue-400' : 'bg-slate-100'}`} style={{ height: `${count ? Math.max(5, Math.min(100, (count / Math.max(...report.buckets.map((bucket) => bucket.count), 1)) * 100)) : 0}%` }} title={`${label}: ${count} đơn`} />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-green-600" />Doanh thu</span>
                  <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-400" />Số đơn hàng</span>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
