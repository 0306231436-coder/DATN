import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, LoaderCircle } from 'lucide-react';
import { donHangService } from '../../services/donHangService.js';
import {
  formatApiDate,
  getAllowedOrderStatuses,
  getApiField,
  getApiList,
  getOrderCustomer,
  getOrderId,
  getOrderStatusStyle,
  normalizeOrderStatus,
} from '../../services/adminDataUtils.js';
import { formatCurrency } from './adminData.js';
import { PageHeading, SearchField } from './AdminComponents.jsx';

const getStatus = (order) => getApiField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai') || 'Chưa cập nhật';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await donHangService.getDonHangs();
      const data = getApiList(response);
      if (!data) throw new Error('Dữ liệu danh sách đơn hàng từ API không hợp lệ.');
      setOrders(data);
    } catch (requestError) {
      console.error('Lỗi khi tải đơn hàng quản trị:', requestError);
      setError(requestError.response?.data?.message || requestError.message || 'Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const statuses = useMemo(
    () => ['Tất cả trạng thái', ...new Set(orders.map(getStatus))],
    [orders]
  );
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return orders.filter((order) => {
      const id = getOrderId(order) ?? '';
      const matchesQuery = `${id} ${getOrderCustomer(order)}`.toLocaleLowerCase('vi').includes(normalizedQuery);
      const matchesStatus = statusFilter === 'Tất cả trạng thái' || getStatus(order) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const statusCounts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => normalizeOrderStatus(getStatus(order)).includes('cho xac nhan')).length,
    shipping: orders.filter((order) => {
      const status = normalizeOrderStatus(getStatus(order));
      return status.includes('dang giao') || status.includes('dang xu ly') || status.includes('van chuyen');
    }).length,
  }), [orders]);

  const handleStatusChange = async (order, nextStatus) => {
    const id = getOrderId(order);
    if (id === undefined || !nextStatus
      || normalizeOrderStatus(nextStatus) === normalizeOrderStatus(getStatus(order))) return;
    if (!getAllowedOrderStatuses(getStatus(order)).some(
      (status) => normalizeOrderStatus(status) === normalizeOrderStatus(nextStatus)
    )) {
      setActionError('Không thể chuyển đơn hàng về trạng thái trước đó hoặc cập nhật đơn đã kết thúc.');
      return;
    }

    setUpdatingId(id);
    setActionError('');
    try {
      const detailResponse = await donHangService.getDonHangById(id);
      const latestOrder = detailResponse?.data || detailResponse || order;
      const latestStatus = getApiField(latestOrder, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai');
      const latestAllowedStatuses = getAllowedOrderStatuses(latestStatus);

      if (!latestAllowedStatuses.some(
        (status) => normalizeOrderStatus(status) === normalizeOrderStatus(nextStatus)
      )) {
        setActionError(`Đơn hàng #${id} đã thay đổi trạng thái thành "${latestStatus || 'không xác định'}". Không thể áp dụng cập nhật này.`);
        await loadOrders();
        return;
      }

      if (normalizeOrderStatus(nextStatus) === normalizeOrderStatus('Đã hủy')
        && !window.confirm(`Xác nhận hủy đơn hàng #${id}?`)) return;

      await donHangService.updateTrangThai(id, nextStatus);
      await loadOrders();
    } catch (requestError) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', requestError);
      setActionError(requestError.response?.data?.message || requestError.message || 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeading eyebrow="Vận hành cửa hàng" title="Quản lý đơn hàng" description="Tra cứu và cập nhật trạng thái đơn hàng từ hệ thống." />
      {actionError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{actionError}</p>}
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng đơn hàng', value: statusCounts.total, tone: 'bg-green-50 text-green-700' },
          { label: 'Chờ xác nhận', value: statusCounts.pending, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Đang giao / xử lý', value: statusCounts.shipping, tone: 'bg-blue-50 text-blue-700' },
        ].map(({ label, value, tone }) => (
          <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><ClipboardList size={20} /></span>
            <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{loading || error ? '—' : value}</p></div>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div><h2 className="text-sm font-extrabold text-slate-900">Danh sách đơn hàng</h2><p className="mt-1 text-xs text-slate-500">Thông tin được tải trực tiếp từ máy chủ</p></div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <SearchField label="Tìm đơn hàng hoặc khách hàng" onChange={setQuery} placeholder="Mã đơn hoặc khách hàng..." value={query} />
            <select aria-label="Lọc trạng thái đơn hàng" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-green-500" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>
        {error ? (
          <div className="p-8 text-center text-sm text-rose-700" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead><tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-6 py-3">Mã đơn hàng</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Ngày đặt</th><th className="px-4 py-3">Tổng tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}><LoaderCircle className="mr-2 inline animate-spin" size={17} />Đang tải đơn hàng...</td></tr>
                  ) : filteredOrders.map((order, index) => {
                    const id = getOrderId(order);
                    const status = getStatus(order);
                    const allowedStatuses = getAllowedOrderStatuses(status);
                    const customer = getApiField(order, 'nguoiDung', 'NguoiDung', 'khachHang', 'KhachHang', 'user', 'User') || {};
                    const date = getApiField(order, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat', 'createdAt', 'CreatedAt');
                    const amount = getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan');
                    const options = [status, ...allowedStatuses];
                    return (
                      <tr className="text-xs hover:bg-slate-50/70" key={id ?? index}>
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-green-800">#{id ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                          <p>{getOrderCustomer(order)}</p>
                          <p className="mt-1 text-[10px] font-normal text-slate-400">{getApiField(customer, 'email', 'Email') || ''}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">{formatApiDate(date, { dateStyle: 'short' })}</td>
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">{formatCurrency(Number(amount) || 0)}</td>
                        <td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getOrderStatusStyle(status)}`}>{status}</span></td>
                        <td className="px-4 py-4">
                          <select
                            aria-label={`Cập nhật trạng thái đơn hàng ${id}`}
                            className="h-9 max-w-40 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 outline-none focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updatingId === id || id === undefined || allowedStatuses.length === 0}
                            onChange={(event) => handleStatusChange(order, event.target.value)}
                            value={status}
                          >
                            {options.map((option, optionIndex) => <option key={`${option}-${optionIndex}`} value={option}>{option}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredOrders.length === 0 && <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}>Không tìm thấy đơn hàng phù hợp.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">Hiển thị {loading ? '—' : filteredOrders.length} / {loading ? '—' : orders.length} đơn hàng</div>
          </>
        )}
      </section>
    </>
  );
}
