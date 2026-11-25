import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoaderCircle, PackageSearch, Search } from 'lucide-react';
import { donHangService } from '../../services/donHangService.js';
import {
  formatApiDate,
  getApiField,
  getOrderCustomer,
  getOrderDisplayCode,
  getOrderStatusStyle,
} from '../../services/adminDataUtils.js';
import { formatCurrency } from '../admin/adminData.js';

const maskPhoneNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length <= 3) return `***${digits}`;
  return `${'*'.repeat(digits.length - 3)}${digits.slice(-3)}`;
};

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState((searchParams.get('ma') || '').trim().toUpperCase());
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (event, directCode) => {
    event?.preventDefault();
    const normalizedCode = (directCode ?? code).trim().toUpperCase();
    if (!normalizedCode) {
      setError('Vui lòng nhập mã đơn hàng.');
      setOrder(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await donHangService.getDonHangByMaHienThi(normalizedCode);
      setOrder(response?.data || response);
    } catch (requestError) {
      setOrder(null);
      setError(requestError.response?.data?.message || 'Không tìm thấy đơn hàng với mã này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCode = searchParams.get('ma');
    if (!initialCode) return;
    setCode(initialCode.trim().toUpperCase());

    let cancelled = false;
    const loadInitialOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await donHangService.getDonHangByMaHienThi(initialCode);
        if (!cancelled) setOrder(response?.data || response);
      } catch (requestError) {
        if (!cancelled) {
          setOrder(null);
          setError(requestError.response?.data?.message || 'Không tìm thấy đơn hàng với mã này.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInitialOrder();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const status = getApiField(order, 'trangThai', 'TrangThai', 'tenTrangThai', 'TenTrangThai') || 'Chưa cập nhật';
  const items = getApiField(order, 'chiTietDonHangs', 'ChiTietDonHangs', 'items', 'Items') || [];
  const total = getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan');
  const address = getApiField(order, 'diaChiGiaoHang', 'DiaChiGiaoHang', 'diaChi', 'DiaChi');
  const phone = getApiField(order, 'soDienThoai', 'SoDienThoai');
  const date = getApiField(order, 'ngayDatHang', 'NgayDatHang', 'ngayDat', 'NgayDat', 'createdAt', 'CreatedAt');

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-slate-950 px-5 py-8 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-green-500 text-slate-950">
            <PackageSearch size={22} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Theo dõi đơn hàng</p>
            <h1 className="mt-1 text-2xl font-black">Tra cứu đơn hàng</h1>
          </div>
        </div>
        <form className="mt-7 flex flex-col gap-3 sm:flex-row" onSubmit={lookup}>
          <input
            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-700 bg-white px-4 text-sm font-semibold uppercase text-slate-900 outline-none placeholder:text-slate-400 focus:border-green-500"
            maxLength={30}
            onChange={(event) =>
              setCode(event.target.value.replace(/\s+/g, '').toUpperCase())
            }
            placeholder="Nhập mã đơn hàng"
            value={code}
          />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-black text-slate-950 hover:bg-green-400 disabled:opacity-60" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />}
            Tra cứu
          </button>
        </form>
      </section>

      {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}

      {order && (
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã đơn hàng</p>
              <p className="mt-1 text-xl font-black text-green-800">{getOrderDisplayCode(order)}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getOrderStatusStyle(status)}`}>{status}</span>
          </div>
          <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-slate-400">Người nhận</dt><dd className="mt-1 font-bold text-slate-800">{getOrderCustomer(order)}</dd></div>
              <div><dt className="text-xs text-slate-400">Số điện thoại</dt><dd className="mt-1 font-semibold text-slate-700">{maskPhoneNumber(phone)}</dd></div>
              <div><dt className="text-xs text-slate-400">Địa chỉ giao hàng</dt><dd className="mt-1 font-semibold text-slate-700">{address || '—'}</dd></div>
            </dl>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-slate-400">Ngày đặt</dt><dd className="mt-1 font-semibold text-slate-700">{formatApiDate(date, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
              <div><dt className="text-xs text-slate-400">Phương thức thanh toán</dt><dd className="mt-1 font-semibold text-slate-700">{getApiField(order, 'phuongThucThanhToan', 'PhuongThucThanhToan') || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Tổng thanh toán</dt><dd className="mt-1 text-lg font-black text-green-800">{formatCurrency(Number(total) || 0)}</dd></div>
            </dl>
          </div>
          {Array.isArray(items) && items.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-sm font-extrabold text-slate-900">Sản phẩm trong đơn</h2>
              <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {items.map((item, index) => {
                  const product = getApiField(item, 'sanPham', 'SanPham') || {};
                  const name = getApiField(item, 'tenSanPham', 'TenSanPham', 'name', 'Name')
                    || getApiField(product, 'tenSanPham', 'TenSanPham', 'name', 'Name')
                    || 'Sản phẩm';
                  const quantity = Number(getApiField(item, 'soLuong', 'SoLuong')) || 0;
                  const price = Number(getApiField(item, 'donGia', 'DonGia')) || 0;
                  return (
                    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm" key={index}>
                      <div><p className="font-bold text-slate-800">{name}</p><p className="mt-1 text-xs text-slate-500">Số lượng: {quantity}</p></div>
                      <p className="shrink-0 font-bold text-slate-800">{formatCurrency(price * quantity)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
