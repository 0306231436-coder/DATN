import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import { getStoredUser } from '../services/authUtils.js';
import { getProductImageUrl, handleProductImageError } from '../services/imageUtils.js';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const [action, setAction] = useState('');
  const [added, setAdded] = useState(false);

  const { addToCart } = useStore();

  // Thông tin sản phẩm
  const maSanPham =
    product.maSanPham ??
    product.MaSanPham ??
    product.id;

  const tenSanPham =
    product.tenSanPham ??
    product.TenSanPham ??
    'Sản phẩm';

  const gia = Number(
    product.giaKhuyenMai ??
    product.GiaKhuyenMai ??
    product.price ??
    product.gia ??
    product.Gia ??
    0
  );

  const rawHinhAnh =
    product.hinhAnh ??
    product.HinhAnh;

  // Biến thể sản phẩm
  const variants =
    product.bienTheSanPhams ??
    product.BienTheSanPhams ??
    [];

  const buyNowVariant =
    variants.find((variant) =>
      Number(
        variant.soLuongTon ??
        variant.SoLuongTon ??
        0
      ) > 0
    ) || null;

  const selectedVariant = variants.length
    ? buyNowVariant
    : null;

  // Kiểm tra tồn kho
  const stock = Number(
    product.soLuong ??
    product.SoLuong ??
    1
  );

  const isOutOfStock = variants.length
    ? !selectedVariant
    : stock <= 0;

  // Kiểm tra đăng nhập (chỉ áp dụng cho Thêm vào giỏ hàng)
  const checkAuthentication = () => {
    const user = getStoredUser();
    const token = localStorage.getItem('token');

    if (!user || !token) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');

      const currentPath = window.location.pathname + window.location.search;
      navigate('/dang-nhap', {
        state: {
          from: currentPath,
        },
      });

      return false;
    }

    return true;
  };

  // Xem chi tiết sản phẩm
  const handleGoToDetail = () => {
    if (maSanPham) {
      navigate(`/san-pham/${maSanPham}`);
    }
  };

  // 1. Chức năng MUA NGAY: Người dùng chưa đăng nhập hoặc đã đăng nhập đều có thể mua ngay
  // Chuyển thẳng đến trang thanh toán đơn hàng chỉ với sản phẩm này, không qua giỏ hàng chung
  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (action) return;

    if (isOutOfStock) {
      alert('Sản phẩm hiện đã hết hàng!');
      return;
    }

    const buyNowVariantItem = selectedVariant;
    const buyNowPrice = Number(
      buyNowVariantItem?.giaKhuyenMai && buyNowVariantItem.giaKhuyenMai > 0
        ? buyNowVariantItem.giaKhuyenMai
        : buyNowVariantItem?.gia || gia
    );
    const buyNowImage = getProductImageUrl(
      buyNowVariantItem?.hinhAnh || buyNowVariantItem?.HinhAnh || rawHinhAnh
    );

    const buyNowItem = {
      id: `buy_now_${maSanPham}_${buyNowVariantItem?.maBienThe || 0}`,
      maSanPham: maSanPham,
      maBienThe: buyNowVariantItem?.maBienThe ?? buyNowVariantItem?.MaBienThe ?? null,
      name: tenSanPham,
      variantName: buyNowVariantItem?.tenBienThe ?? buyNowVariantItem?.TenBienThe ?? '',
      price: buyNowPrice,
      image: buyNowImage,
      quantity: 1,
      stock: stock,
    };

    navigate('/checkout', {
      state: {
        buyNowItem,
      },
    });
  };

  // 2. Chức năng THÊM VÀO GIỎ HÀNG: Bắt buộc thành viên phải đăng nhập
  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (action) return;

    // Bước 1: Kiểm tra đăng nhập
    if (!checkAuthentication()) return;

    // Bước 2: Kiểm tra tồn kho
    if (isOutOfStock) {
      alert('Sản phẩm hiện đã hết hàng!');
      return;
    }

    try {
      setAction('add');
      setAdded(false);

      // Bước 3: Thêm vào giỏ và lưu vào cơ sở dữ liệu
      await addToCart(product, selectedVariant, 1);

      setAdded(true);
      window.setTimeout(() => {
        setAdded(false);
      }, 1800);
    } catch (error) {
      console.error('Lỗi thao tác giỏ hàng:', error);

      if (error.response?.status === 401 || error.isAuthRequired) {
        alert(error.response?.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));

        const currentPath = window.location.pathname + window.location.search;
        navigate('/dang-nhap', {
          state: {
            from: currentPath,
          },
        });

        return;
      }

      alert(
        error.response?.data?.message ||
        'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.'
      );
    } finally {
      setAction('');
    }
  };

  // Xem chi tiết
  const handleProductClick = (event) => {
    event.preventDefault();
    handleGoToDetail();
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg">

      {/* Thông tin sản phẩm */}
      <button
        aria-label={`Xem ${tenSanPham}`}
        className="block w-full cursor-pointer p-3 text-left sm:p-4"
        onClick={handleProductClick}
        type="button"
      >
        {/* Hình ảnh */}
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
          <img
            src={getProductImageUrl(rawHinhAnh)}
            alt={tenSanPham}
            onError={handleProductImageError}
            className="h-full w-full object-cover object-center transition group-hover:scale-105"
          />
        </div>

        {/* Tên sản phẩm */}
        <h3 className="mt-3 text-sm font-bold text-slate-900 line-clamp-2">
          {tenSanPham}
        </h3>

        {/* Giá sản phẩm */}
        <p className="mt-1 text-base font-black text-green-700">
          {gia.toLocaleString('vi-VN')} đ
        </p>
      </button>

      {/* Các nút thao tác */}
      <div className="mt-auto  grid grid-cols-1 gap-2 p-3 pt-0 sm:p-4 sm:pt-0 lg:grid-cols-2">

        {/* Thêm vào giỏ */}
        <button
          aria-label={`Thêm ${tenSanPham} vào giỏ hàng`}
          className=" cursor-pointer flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-green-700 px-3 text-xs font-bold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={Boolean(action) || isOutOfStock}
          onClick={handleAddToCart}
          type="button"
        >
          {action === 'add' ? (
            <Loader2
              className="shrink-0 animate-spin"
              size={15}
            />
          ) : (
            <ShoppingCart
              className="shrink-0"
              size={15}
            />
          )}

          <span>
            {isOutOfStock
              ? 'Hết hàng'
              : action === 'add'
                ? 'Đang thêm'
                : added
                  ? 'Đã thêm'
                  : 'Thêm vào giỏ'}
          </span>
        </button>

        {/* Mua ngay */}
        <button
          aria-label={`Mua ngay ${tenSanPham}`}
          className="cursor-pointer flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-green-700 px-3 text-xs font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isOutOfStock}
          onClick={handleBuyNow}
          type="button"
        >
          <ShoppingBag
            className="shrink-0"
            size={15}
          />
          <span>
            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
          </span>
        </button>

      </div>
    </article>
  );
}
