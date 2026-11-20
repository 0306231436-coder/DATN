import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Loader2,
  LoaderCircle,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { donHangService } from '../../services/donHangService.js';
import { getStoredUser } from '../../services/authUtils.js';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(price) || 0);

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật ngày đặt';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getField = (value, ...keys) => {
  for (const key of keys) {
    if (value?.[key] !== undefined && value[key] !== null && value[key] !== '') {
      return value[key];
    }
  }
  return undefined;
};

const getUserId = (user) =>
  getField(user, 'maNguoiDung', 'MaNguoiDung', 'id', 'Id', 'userId', 'UserId');

const normalizeStatus = (status) =>
  String(status || 'Chưa cập nhật')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi');

const isPendingStatus = (status) => {
  const value = normalizeStatus(status);
  return value.includes('cho xac nhan') || value === 'pending';
};

const isPendingOrder = (order) => {
  const status = getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai');
  return isPendingStatus(status);
};

const getOrders = (response) => {
  if (Array.isArray(response)) return response;
  for (const key of ['data', 'items', 'donHangs', 'DonHangs', '$values']) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return null;
};

const getStatusCategory = (status) => {
  const value = normalizeStatus(status);
  if (value.includes('huy') || value.includes('cancel')) return 'cancelled';
  if (value.includes('da giao') || value.includes('delivered') || value.includes('hoan tat'))
    return 'delivered';
  if (
    value.includes('dang giao') ||
    value.includes('van chuyen') ||
    value.includes('ship') ||
    value.includes('dang xu ly')
  )
    return 'shipping';
  if (value.includes('cho') || value.includes('xac nhan') || value.includes('pending'))
    return 'pending';
  return 'other';
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  shipping: 'bg-blue-50 text-blue-700 ring-blue-200',
  delivered: 'bg-green-50 text-green-700 ring-green-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  other: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const filters = [
  { id: 'all', label: 'Tất cả đơn hàng' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'shipping', label: 'Đang xử lý' },
  { id: 'delivered', label: 'Đã giao' },
  { id: 'cancelled', label: 'Đã hủy' },
];

export default function OrderHistoryPage() {
  const user = getStoredUser();
  const userId = getUserId(user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    tenNguoiNhan: '',
    soDienThoai: '',
    diaChiGiaoHang: '',
    ghiChu: '',
  });
  const [actionOrderId, setActionOrderId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!userId) {
      setError('Không tìm thấy mã tài khoản. Vui lòng đăng nhập lại để xem đơn hàng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await donHangService.getDonHangsByUser(userId);
      const result = getOrders(response);
      if (!result) {
        throw new Error('Dữ liệu đơn hàng trả về không hợp lệ.');
      }
      setOrders(result);
    } catch (requestError) {
      console.error('Lỗi khi tải đơn hàng của người dùng:', requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Không thể tải đơn hàng. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Tự động làm mới khi quay lại tab (giúp giảm stale data)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrders();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return orders.filter((order) => {
      const orderId = getField(order, 'maDonHang', 'MaDonHang', 'id', 'Id');
      const status = getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai');
      const matchesFilter =
        activeFilter === 'all' || getStatusCategory(status) === activeFilter;
      const matchesQuery =
        !normalizedQuery ||
        `${orderId || ''} ${status || ''}`
          .toLocaleLowerCase('vi')
          .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, orders, query]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter(
        (order) =>
          getStatusCategory(
            getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai')
          ) === 'pending'
      ).length,
      shipping: orders.filter(
        (order) =>
          getStatusCategory(
            getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai')
          ) === 'shipping'
      ).length,
      delivered: orders.filter(
        (order) =>
          getStatusCategory(
            getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai')
          ) === 'delivered'
      ).length,
      cancelled: orders.filter(
        (order) =>
          getStatusCategory(
            getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai')
          ) === 'cancelled'
      ).length,
    }),
    [orders]
  );

  const openEditDialog = (order) => {
    setActionError('');
    setEditingOrder(order);
    setEditForm({
      tenNguoiNhan: getField(order, 'tenNguoiNhan', 'TenNguoiNhan') || '',
      soDienThoai: getField(order, 'soDienThoai', 'SoDienThoai') || '',
      diaChiGiaoHang:
        getField(order, 'diaChiGiaoHang', 'DiaChiGiaoHang', 'diaChi', 'DiaChi') || '',
      ghiChu: getField(order, 'ghiChu', 'GhiChu') || '',
    });
  };

  // ===== HỦY ĐƠN – luôn kiểm tra trạng thái mới nhất từ server =====
  const handleCancelOrder = async (order) => {
    const orderId = getField(order, 'maDonHang', 'MaDonHang', 'id', 'Id');
    if (orderId === undefined) {
      setActionError('Không tìm thấy mã đơn hàng để hủy.');
      return;
    }

    setActionError('');
    setActionOrderId(orderId);

    try {
      // 1. Lấy dữ liệu mới nhất từ server
      const detailResponse = await donHangService.getDonHangById(orderId);
      const latestOrder = detailResponse?.data || detailResponse || order;
      const latestStatus = getField(
        latestOrder,
        'trangThai',
        'TrangThai',
        'tenTrangThai',
        'TenTrangThai'
      );

      // 2. Kiểm tra lại trạng thái
      if (!isPendingStatus(latestStatus)) {
        setActionError(
          `Đơn hàng #${orderId} đã được cập nhật trạng thái thành "${
            latestStatus || 'không xác định'
          }". Không thể hủy.`
        );
        await loadOrders(); // đồng bộ lại UI
        return;
      }

      // 3. Xác nhận với người dùng
      const confirmed = window.confirm(
        `Bạn có chắc muốn hủy đơn hàng #${orderId}?`
      );
      if (!confirmed) return;

      // 4. Thực hiện hủy
      await donHangService.updateTrangThai(orderId, 'Đã hủy');
      await loadOrders();
    } catch (requestError) {
      console.error('Lỗi khi hủy đơn hàng:', requestError);
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Không thể hủy đơn hàng. Vui lòng thử lại.'
      );
    } finally {
      setActionOrderId(null);
    }
  };

  // ===== CHỈNH SỬA – cũng kiểm tra trạng thái mới nhất =====
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingOrder) return;

    const orderId = getField(editingOrder, 'maDonHang', 'MaDonHang', 'id', 'Id');
    if (orderId === undefined) {
      setActionError('Không tìm thấy mã đơn hàng để cập nhật.');
      return;
    }

    setActionError('');
    setActionOrderId(orderId);

    try {
      const detailResponse = await donHangService.getDonHangById(orderId);
      const fullOrder = detailResponse?.data || detailResponse || editingOrder;

      // Kiểm tra trạng thái mới nhất
      const latestStatus = getField(
        fullOrder,
        'trangThai',
        'TrangThai',
        'tenTrangThai',
        'TenTrangThai'
      );
      if (!isPendingStatus(latestStatus)) {
        setActionError(
          `Đơn hàng đã được cập nhật trạng thái thành "${
            latestStatus || 'không xác định'
          }". Không thể chỉnh sửa.`
        );
        setEditingOrder(null);
        await loadOrders();
        return;
      }

      const items =
        getField(
          fullOrder,
          'chiTietDonHangs',
          'ChiTietDonHangs',
          'chiTietDonHang',
          'ChiTietDonHang',
          'items',
          'Items'
        ) ??
        getField(
          editingOrder,
          'chiTietDonHangs',
          'ChiTietDonHangs',
          'chiTietDonHang',
          'ChiTietDonHang',
          'items',
          'Items'
        );

      const payload = {
        maDonHang: orderId,
        maNguoiDung:
          getField(fullOrder, 'maNguoiDung', 'MaNguoiDung') ??
          getField(editingOrder, 'maNguoiDung', 'MaNguoiDung'),
        tenNguoiNhan: editForm.tenNguoiNhan.trim(),
        soDienThoai: editForm.soDienThoai.trim(),
        diaChiGiaoHang: editForm.diaChiGiaoHang.trim(),
        tongTien:
          getField(fullOrder, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan') ??
          getField(editingOrder, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan'),
        trangThai:
          getField(fullOrder, 'trangThai', 'TrangThai') ??
          getField(editingOrder, 'trangThai', 'TrangThai'),
        phuongThucThanhToan:
          getField(fullOrder, 'phuongThucThanhToan', 'PhuongThucThanhToan') ??
          getField(editingOrder, 'phuongThucThanhToan', 'PhuongThucThanhToan'),
        ghiChu: editForm.ghiChu.trim(),
        ngayDatHang:
          getField(fullOrder, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat') ??
          getField(editingOrder, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat'),
        chiTietDonHangs: Array.isArray(items)
          ? items.map((item) => ({
              maChiTietDonHang: getField(item, 'maChiTietDonHang', 'MaChiTietDonHang'),
              maDonHang: getField(item, 'maDonHang', 'MaDonHang') ?? orderId,
              maSanPham: getField(item, 'maSanPham', 'MaSanPham'),
              maBienThe: getField(item, 'maBienThe', 'MaBienThe') ?? null,
              soLuong: getField(item, 'soLuong', 'SoLuong'),
              donGia: getField(item, 'donGia', 'DonGia'),
            }))
          : [],
      };

      await donHangService.updateDonHang(orderId, payload);
      setEditingOrder(null);
      await loadOrders();
    } catch (requestError) {
      console.error('Lỗi khi cập nhật đơn hàng:', requestError);
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Không thể cập nhật đơn hàng. Vui lòng thử lại.'
      );
    } finally {
      setActionOrderId(null);
    }
  };

  return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute -right-14 -top-24 size-64 rounded-full bg-green-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-300">
              Tài khoản của bạn
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Đơn hàng của tôi
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Theo dõi tình trạng đơn hàng và xem lại các sản phẩm bạn đã đặt.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-500"
            to="/san-pham"
          >
            Tiếp tục mua sắm <ArrowRight size={17} />
          </Link>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng đơn hàng', value: counts.all, icon: ClipboardList },
            { label: 'Chờ xác nhận', value: counts.pending, icon: CalendarDays },
            { label: 'Đang xử lý', value: counts.shipping, icon: Truck },
            { label: 'Đã giao thành công', value: counts.delivered, icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={label}>
              <div className="flex items-center justify-between gap-2 text-slate-300">
                <span className="text-xs font-medium">{label}</span>
                <Icon className="text-green-300" size={17} />
              </div>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(({ id, label }) => (
              <button
                aria-pressed={activeFilter === id}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeFilter === id
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
                key={id}
                onClick={() => setActiveFilter(id)}
                type="button"
              >
                {label}
                <span className="ml-1.5 opacity-75">{counts[id]}</span>
              </button>
            ))}
          </div>

          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10 sm:max-w-xs">
            <Search className="shrink-0 text-slate-400" size={16} />
            <input
              aria-label="Tìm đơn hàng"
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã đơn hoặc trạng thái..."
              value={query}
            />
          </label>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <LoaderCircle className="mx-auto animate-spin text-green-700" size={30} />
              <p className="mt-3 text-sm text-slate-500">Đang tải đơn hàng của bạn...</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"
            role="alert"
          >
            <p>{error}</p>
            {userId && (
              <button
                className="mt-3 inline-flex items-center gap-2 font-bold hover:text-rose-900"
                onClick={loadOrders}
                type="button"
              >
                <RefreshCw size={15} /> Thử tải lại
              </button>
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-green-50 text-green-700">
              <ShoppingBag size={25} />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              {orders.length ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn hàng nào'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {orders.length
                ? 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.'
                : 'Đơn hàng bạn đặt sẽ được hiển thị tại đây.'}
            </p>
            {!orders.length && (
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"
                to="/san-pham"
              >
                Khám phá sản phẩm <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {filteredOrders.map((order, index) => {
              const orderId = getField(order, 'maDonHang', 'MaDonHang', 'id', 'Id') ?? `#${index + 1}`;
              const displayOrderId = String(orderId).startsWith('#') ? orderId : `#${orderId}`;
              const status =
                getField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai') ||
                'Chưa cập nhật';
              const category = getStatusCategory(status);
              const orderDate = getField(
                order,
                'ngayDatHang',
                'NgayDatHang',
                'ngayDat',
                'NgayDat',
                'createdAt',
                'CreatedAt'
              );
              const total = getField(
                order,
                'tongTien',
                'TongTien',
                'tongThanhToan',
                'TongThanhToan'
              );
              const address = getField(
                order,
                'diaChiGiaoHang',
                'DiaChiGiaoHang',
                'diaChi',
                'DiaChi'
              );
              const items = getField(
                order,
                'chiTietDonHangs',
                'ChiTietDonHangs',
                'chiTietDonHang',
                'ChiTietDonHang',
                'items',
                'Items'
              );
              const isExpanded = expandedOrder === orderId;
              const canManageOrder = isPendingOrder(order);
              const isSubmittingOrder = actionOrderId === orderId;

              return (
                <article
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  key={`${orderId}-${index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Mã đơn hàng
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">
                          {displayOrderId}
                        </p>
                      </div>
                      <span className="hidden h-8 w-px bg-slate-200 sm:block" />
                      <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={14} /> {formatDate(orderDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[category]}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      {Array.isArray(items) && items.length > 0 ? (
                        <p className="text-sm font-bold text-slate-800">
                          {getField(
                            items[0],
                            'tenSanPham',
                            'TenSanPham',
                            'name',
                            'Name'
                          ) ||
                            getField(
                              getField(items[0], 'sanPham', 'SanPham'),
                              'tenSanPham',
                              'TenSanPham'
                            ) ||
                            'Sản phẩm'}
                          {items.length > 1 && (
                            <span className="font-medium text-slate-500">
                              {' '}
                              và {items.length - 1} sản phẩm khác
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">
                          Đơn hàng #{orderId}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {Array.isArray(items) && items.length
                          ? `${items.length} sản phẩm`
                          : 'Thông tin đơn hàng'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tổng thanh toán
                      </p>
                      <p className="mt-1 text-base font-black text-green-800">
                        {formatPrice(total)}
                      </p>
                    </div>

                    <button
                      aria-controls={`order-details-${index}`}
                      aria-expanded={isExpanded}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800 sm:w-auto"
                      onClick={() => setExpandedOrder(isExpanded ? null : orderId)}
                      type="button"
                    >
                      {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>

                    {canManageOrder && (
                      <div className="flex w-full gap-2 sm:w-auto">
                        <button
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 px-3 text-xs font-bold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          disabled={isSubmittingOrder}
                          onClick={() => openEditDialog(order)}
                          type="button"
                        >
                          <Pencil size={14} /> Chỉnh sửa
                        </button>
                        <button
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                          disabled={isSubmittingOrder}
                          onClick={() => handleCancelOrder(order)}
                          type="button"
                        >
                          {isSubmittingOrder ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <X size={14} />
                          )}
                          Hủy đơn
                        </button>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div
                      className="border-t border-slate-100 px-4 py-5 sm:px-6"
                      id={`order-details-${index}`}
                    >
                      {Array.isArray(items) && items.length > 0 && (
                        <div className="divide-y divide-slate-100">
                          {items.map((item, itemIndex) => {
                            const product =
                              getField(item, 'sanPham', 'SanPham', 'bienThe', 'BienThe') || {};
                            const name =
                              getField(
                                item,
                                'tenSanPham',
                                'TenSanPham',
                                'tenSanPhamSnapshot',
                                'TenSanPhamSnapshot',
                                'name',
                                'Name'
                              ) ||
                              getField(
                                product,
                                'tenSanPham',
                                'TenSanPham',
                                'tenBienThe',
                                'TenBienThe'
                              ) ||
                              'Sản phẩm';
                            const quantity =
                              getField(item, 'soLuong', 'SoLuong', 'quantity', 'Quantity') || 1;
                            const price = getField(
                              item,
                              'donGia',
                              'DonGia',
                              'gia',
                              'Gia',
                              'unitPrice',
                              'UnitPrice'
                            );

                            return (
                              <div
                                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                key={`${name}-${itemIndex}`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                                    <Package size={18} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Số lượng: {quantity}
                                    </p>
                                  </div>
                                </div>
                                <p className="shrink-0 text-sm font-bold text-slate-700">
                                  {formatPrice(price)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {address && (
                        <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                          <MapPin className="mt-0.5 shrink-0 text-green-700" size={15} />{' '}
                          {address}
                        </p>
                      )}

                      {!items?.length && !address && (
                        <p className="text-sm text-slate-500">
                          Đơn hàng không có thông tin chi tiết.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {actionError && !editingOrder && (
          <p
            aria-live="polite"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {actionError}
          </p>
        )}
      </section>

      {/* Modal chỉnh sửa */}
      {editingOrder && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/50 p-4"
          role="presentation"
        >
          <section
            aria-labelledby="edit-order-title"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Đơn hàng #{getField(editingOrder, 'maDonHang', 'MaDonHang', 'id', 'Id')}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900" id="edit-order-title">
                  Chỉnh sửa thông tin giao hàng
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Chỉ có thể cập nhật khi đơn hàng đang chờ xác nhận.
                </p>
              </div>
              <button
                aria-label="Đóng"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => {
                  setEditingOrder(null);
                  setActionError('');
                }}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleEditSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Tên người nhận
                <input
                  autoComplete="name"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      tenNguoiNhan: event.target.value,
                    }))
                  }
                  required
                  value={editForm.tenNguoiNhan}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Số điện thoại
                <input
                  autoComplete="tel"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      soDienThoai: event.target.value,
                    }))
                  }
                  required
                  type="tel"
                  value={editForm.soDienThoai}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Địa chỉ giao hàng
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      diaChiGiaoHang: event.target.value,
                    }))
                  }
                  required
                  rows={3}
                  value={editForm.diaChiGiaoHang}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Ghi chú
                <textarea
                  className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      ghiChu: event.target.value,
                    }))
                  }
                  rows={2}
                  value={editForm.ghiChu}
                />
              </label>

              {actionError && (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  role="alert"
                >
                  {actionError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  disabled={actionOrderId !== null}
                  onClick={() => {
                    setEditingOrder(null);
                    setActionError('');
                  }}
                  type="button"
                >
                  Đóng
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={actionOrderId !== null}
                  type="submit"
                >
                  {actionOrderId !== null && <Loader2 className="animate-spin" size={16} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}