import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Minus, Plus, ShoppingCart, Trash2, X, Lock } from 'lucide-react';
import { useStore } from '../../context/StoreContext.jsx';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { getStoredUser } from '../../services/authUtils.js';
import { handleProductImageError } from '../../services/imageUtils.js';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

export default function CartPage() {
  const { cart, changeQuantity, removeFromCart, loadingCart, user } = useStore();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';
  const [warningNotice, setWarningNotice] = useState('');

  const currentUser = user || getStoredUser();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Xử lý tăng số lượng & Thông báo khi chạm mức tồn kho
  const handleIncreaseQuantity = (item) => {
    changeQuantity(item.id, 1);
  };

  // Chưa đăng nhập -> Yêu cầu đăng nhập để xem và quản lý giỏ hàng
  if (!currentUser) {
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-7xl place-items-center px-4 py-16 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-amber-600">
            <Lock size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Yêu cầu đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-500">
            Chỉ thành viên đã đăng nhập mới có thể quản lý và lưu trữ giỏ hàng. Vui lòng đăng nhập tài khoản của bạn để tiếp tục.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800 shadow-md shadow-green-700/20"
            to="/dang-nhap"
            state={{ from: '/gio-hang' }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (loadingCart) {
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-7xl place-items-center px-4 py-16 text-center text-slate-500">
        Đang tải giỏ hàng của bạn...
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-7xl place-items-center px-4 py-16 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-700">
            <ShoppingCart size={28} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Giỏ hàng đang trống</h1>
          <p className="mt-2 text-sm text-slate-500">Hãy khám phá các sản phẩm công nghệ tại {storeName}.</p>
          <Link className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800" to="/san-pham">
            <ArrowLeft size={16} />Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[55vh] max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Giỏ hàng</h1>
      <p className="mt-2 text-sm text-slate-500">{totalItems} sản phẩm trong giỏ</p>

      {/* Cảnh báo khi người dùng tăng số lượng vượt tồn kho */}
      {warningNotice && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-800 border border-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
            <span>{warningNotice}</span>
          </div>
          <button 
            onClick={() => setWarningNotice('')} 
            className="text-amber-600 hover:text-amber-800"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Danh sách các sản phẩm trong giỏ */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {cart.map((item) => {
            return (
              <article className="flex gap-4 p-4 sm:p-5" key={item.id}>
                <img
                  alt={item.name}
                  className="size-20 rounded-lg bg-slate-100 object-cover sm:size-24"
                  onError={handleProductImageError}
                  src={item.image}
                />
                
                <div className="min-w-0 flex-1">
                  <Link to={`/san-pham/${item.maSanPham}`} className="font-bold text-slate-800 hover:text-green-700 line-clamp-1">
                    {item.name}
                  </Link>

                  {item.variantName && (
                    <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      Phiên bản: {item.variantName}
                    </span>
                  )}

                  {/* Hiển thị số lượng tồn kho */}
                  <p className="mt-1 text-xs text-slate-500">
                    Tồn kho: <strong className={item.stock > 0 ? "text-slate-700" : "text-rose-600 font-bold"}>
                      {item.stock > 0 ? `${item.stock} sản phẩm` : 'Hết hàng'}
                    </strong>
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-8 items-center rounded-lg border border-slate-200">
                      <button 
                        aria-label="Giảm số lượng" 
                        className="grid size-8 place-items-center text-slate-600 hover:text-green-700" 
                        onClick={() => {
                          setWarningNotice('');
                          changeQuantity(item.id, -1);
                        }} 
                        type="button"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        aria-label="Tăng số lượng" 
                        className="grid size-8 place-items-center text-slate-600 hover:text-green-700 disabled:opacity-40" 
                        onClick={() => handleIncreaseQuantity(item)} 
                        disabled={item.quantity == item.stock}
                        type="button"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {item.quantity==item.stock &&(
                      <span className="rounded text-red-700 px-2 py-0.5 text-[11px] font-bold border border-amber-200">Đã đạt số lượng tối đa</span>
                    )}

                    <button
                      onClick={() => {
                        setWarningNotice('');
                        removeFromCart(item.id);
                      }}
                      className="ml-auto text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                      type="button"
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                </div>

                <strong className="whitespace-nowrap text-sm text-slate-800">
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </article>
            );
          })}
        </div>

        {/* Khối Tóm tắt đơn hàng */}
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Tóm tắt đơn hàng</h2>
          <div className="mt-5 flex justify-between text-sm text-slate-600">
            <span>Tạm tính ({totalItems} sản phẩm)</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-slate-600">
            <span>Phí vận chuyển</span>
            <span className="font-semibold text-emerald-600">Miễn phí</span>
          </div>
          <div className="my-5 border-t border-slate-100" />
          <div className="flex justify-between font-bold text-slate-900 text-base">
            <span>Tổng cộng</span>
            <span className="text-green-700 text-xl">{formatPrice(total)}</span>
          </div>

          <Link 
            to="/checkout" 
            state={{ fromCart: true }}
            className="mt-5 block w-full text-center rounded-lg bg-green-700 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Tiến hành đặt hàng
          </Link>
        </aside>
      </div>
    </div>
  );
}
