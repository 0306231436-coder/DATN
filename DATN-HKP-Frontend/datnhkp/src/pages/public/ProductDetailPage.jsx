import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, Heart, Minus, Plus, ShoppingBag, ShoppingCart, Star, Truck, Loader2, Check } from 'lucide-react';
import { productService } from '../../services/productService.js';
import { useStore } from '../../context/StoreContext.jsx';
import { getStoredUser } from '../../services/authUtils.js';
import NotFoundPage from './NotFoundPage.jsx';
import { getProductImageUrl, handleProductImageError } from '../../services/imageUtils.js';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

// Hàm hỗ trợ lấy giá bán & giá gốc cho card sản phẩm liên quan
const getProductDisplayPrices = (item) => {
  const itemVariants = item.bienTheSanPhams || item.BienTheSanPhams || [];
  const firstVar = itemVariants[0];

  const basePrice = firstVar
    ? (firstVar.gia ?? firstVar.Gia ?? 0)
    : (item.gia ?? item.Gia ?? 0);

  const salePrice = firstVar
    ? (firstVar.giaKhuyenMai ?? firstVar.GiaKhuyenMai ?? 0)
    : (item.giaKhuyenMai ?? item.GiaKhuyenMai ?? 0);

  if (salePrice > 0 && salePrice < basePrice) {
    return { finalPrice: salePrice, oldPrice: basePrice };
  }
  return { finalPrice: salePrice > 0 ? salePrice : basePrice, oldPrice: null };
};

// Bóc tách mảng sản phẩm từ PagedResponse hoặc mảng trực tiếp
const extractProductList = (res) => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  return payload?.items || payload?.Items || payload?.data || payload?.Data || payload?.results || [];
};

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Trạng thái cho nút giỏ hàng
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { addToCart, favorites, toggleFavorite } = useStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchRelatedProducts = async (currentProduct, currentId) => {
      try {
        setLoadingRelated(true);
        const currentCatId = currentProduct.maDanhMuc ?? currentProduct.MaDanhMuc;
        const currentBrandId = currentProduct.maThuongHieu ?? currentProduct.MaThuongHieu;

        const collected = [];
        const seenIds = new Set([String(currentId)]);

        const appendUniqueProducts = (res) => {
          const list = extractProductList(res);
          for (const item of list) {
            const itemId = String(item.maSanPham ?? item.MaSanPham ?? item.id ?? item.Id);
            if (!seenIds.has(itemId) && collected.length < 4) {
              seenIds.add(itemId);
              collected.push(item);
            }
          }
        };

        // Tầng 1: Lấy sản phẩm cùng Danh mục
        if (currentCatId) {
          const catRes = await productService.getSanPhams({
            pageNumber: 1,
            pageSize: 5,
            category: currentCatId,
            includeInactive: false,
          });
          appendUniqueProducts(catRes);
        }

        // Tầng 2: Nếu chưa đủ 4 sản phẩm, lấy thêm sản phẩm cùng Thương hiệu
        if (collected.length < 4 && currentBrandId) {
          const brandRes = await productService.getSanPhams({
            pageNumber: 1,
            pageSize: 5,
            brand: currentBrandId,
            includeInactive: false,
          });
          appendUniqueProducts(brandRes);
        }

        // Tầng 3: Nếu vẫn chưa đủ 4 sản phẩm, lấy sản phẩm mới nhất bù vào
        if (collected.length < 4) {
          const latestRes = await productService.getSanPhams({
            pageNumber: 1,
            pageSize: 6,
            includeInactive: false,
          });
          appendUniqueProducts(latestRes);
        }

        setRelatedProducts(collected);
      } catch (err) {
        console.warn('Không thể tải sản phẩm liên quan:', err);
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    const fetchProductAndVariants = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setQuantity(1);
        setSelectedVariant(null);

        // 1. Bóc tách Axios Response nếu API trả về dạng { data: ... }
        const res = await productService.getSanPhamById(productId);
        const productData = res.data || res;

        const currentId = productData?.maSanPham ?? productData?.MaSanPham ?? productData?.id ?? productData?.Id;
        if (!productData || !currentId) {
          setNotFound(true);
          return;
        }

        setProduct(productData);

        let variantList = productData.bienTheSanPhams || productData.BienTheSanPhams || [];
        if (variantList.length === 0 && typeof productService.getBienTheSanPhams === 'function') {
          try {
            const variantRes = await productService.getBienTheSanPhams(productId);
            variantList = variantRes.data || variantRes || [];
          } catch (e) {
            console.warn('Không thể lấy danh sách biến thể:', e);
          }
        }

        setVariants(variantList || []);

        if (variantList && variantList.length > 0) {
          const firstVariant = variantList[0];
          setSelectedVariant(firstVariant);
          setSelectedImage(firstVariant.hinhAnh || firstVariant.HinhAnh || productData.hinhAnh || productData.HinhAnh || '');
        } else {
          const productImages = productData.hinhAnhSanPhams || productData.HinhAnhSanPhams || [];
          const mainImg = productData.hinhAnh || productData.HinhAnh || productImages[0]?.duongDanAnh || productImages[0]?.DuongDanAnh || '';
          setSelectedImage(mainImg);
        }

        // 2. Tải danh sách sản phẩm liên quan theo 3 tầng ưu tiên
        fetchRelatedProducts(productData, currentId);
      } catch (error) {
        console.error('Lỗi khi tải thông tin sản phẩm:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProductAndVariants();
  }, [productId]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Đang tải thông tin sản phẩm...</div>;
  }

  if (notFound || !product) return <NotFoundPage />;

  const id = product.maSanPham ?? product.MaSanPham ?? product.id ?? product.Id;
  const name = product.tenSanPham ?? product.TenSanPham ?? product.name ?? 'Sản phẩm';
  const categoryName = product.tenDanhMuc ?? product.TenDanhMuc ?? 'Sản phẩm';
  const specs = product.thongSoKyThuat ?? product.ThongSoKyThuat ?? 'Đang cập nhật';
  const description = product.moTa ?? product.MoTa ?? '';
  const images = product.hinhAnhSanPhams ?? product.HinhAnhSanPhams ?? [];

  const currentPrice = selectedVariant
    ? ((selectedVariant.giaKhuyenMai ?? selectedVariant.GiaKhuyenMai ?? 0) > 0
      ? selectedVariant.giaKhuyenMai ?? selectedVariant.GiaKhuyenMai
      : selectedVariant.gia ?? selectedVariant.Gia)
    : product.giaKhuyenMai ?? product.GiaKhuyenMai ?? product.gia ?? product.Gia;

  const originalPrice = selectedVariant && (selectedVariant.giaKhuyenMai ?? selectedVariant.GiaKhuyenMai ?? 0) > 0
    ? selectedVariant.gia ?? selectedVariant.Gia
    : null;
  const currentStock = Number(selectedVariant
    ? selectedVariant.soLuongTon ?? selectedVariant.SoLuongTon
    : product.soLuong ?? product.SoLuong ?? 0);

  const favorite = favorites?.includes(id);

  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
    const image = variant.hinhAnh ?? variant.HinhAnh;
    if (image) {
      setSelectedImage(image);
    }
  };

  // 1. Chức năng MUA NGAY: Người dùng chưa đăng nhập hoặc đã đăng nhập đều có thể mua ngay
  const handleBuyNow = () => {
    if (currentStock <= 0 || quantity > currentStock) {
      alert('Số lượng chọn vượt quá tồn kho hoặc sản phẩm đã hết hàng!');
      return;
    }

    const buyNowImage = getProductImageUrl(
      selectedVariant?.hinhAnh || selectedVariant?.HinhAnh || selectedImage || product.hinhAnh
    );

    const buyNowItem = {
      id: `buy_now_${id}_${selectedVariant?.maBienThe || 0}`,
      maSanPham: id,
      maBienThe: selectedVariant?.maBienThe ?? selectedVariant?.MaBienThe ?? null,
      name: name,
      variantName: selectedVariant?.tenBienThe ?? selectedVariant?.TenBienThe ?? '',
      price: Number(currentPrice || 0),
      image: buyNowImage,
      quantity: quantity,
      stock: currentStock,
    };

    navigate('/checkout', {
      state: {
        buyNowItem,
      },
    });
  };

  // 2. Chức năng THÊM VÀO GIỎ: Bắt buộc người dùng phải đăng nhập tài khoản
  const handleAddToCart = async () => {
    if (isAddingCart || currentStock <= 0 || quantity > currentStock) return;

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
      return;
    }

    try {
      setIsAddingCart(true);
      await addToCart(product, selectedVariant, quantity);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
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

      alert(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setIsAddingCart(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-7 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link className="hover:text-green-700" to="/">Trang chủ</Link><ChevronRight size={14} />
        <Link className="hover:text-green-700" to="/san-pham">Sản phẩm</Link><ChevronRight size={14} />
        <span className="truncate text-slate-800">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* Khối Hình Ảnh */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl bg-slate-100 aspect-square border border-slate-200 shadow-sm">
            <img
              alt={name}
              className="h-full w-full object-cover transition duration-300"
              src={getProductImageUrl(selectedImage)}
              onError={handleProductImageError}
              onError={handleProductImageError}
            />
          </div>

          {(images.length > 0 || product.hinhAnh) && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.hinhAnh && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(product.hinhAnh)}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedImage === product.hinhAnh ? 'border-green-600 ring-2 ring-green-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img alt={name} className="h-full w-full object-cover" onError={handleProductImageError} src={getProductImageUrl(product.hinhAnh)} />
                </button>
              )}
              {images.map((img) => (
                <button
                  key={img.maHinhAnh || img.duongDanAnh}
                  type="button"
                  onClick={() => setSelectedImage(img.duongDanAnh)}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedImage === img.duongDanAnh ? 'border-green-600 ring-2 ring-green-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img alt={name} className="h-full w-full object-cover" onError={handleProductImageError} src={getProductImageUrl(img.duongDanAnh)} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin chi tiết */}
        <div className="py-2">
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{categoryName}</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{name}</h1>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <Star className="fill-amber-400 text-amber-400" size={16} /> 5.0
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              Kho: <strong className="text-slate-800">{currentStock > 0 ? `${currentStock} sản phẩm` : 'Hết hàng'}</strong>
            </span>
          </div>

          {/* Danh sách biến thể */}
          {variants.length > 0 && (
            <div className="mt-6 border-t border-b border-slate-100 py-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Lựa chọn phiên bản: <span className="text-slate-900 font-extrabold">{selectedVariant?.tenBienThe ?? selectedVariant?.TenBienThe}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const variantId = v.maBienThe ?? v.MaBienThe;
                  const isSelected = (selectedVariant?.maBienThe ?? selectedVariant?.MaBienThe) === variantId;
                  return (
                    <button
                      key={variantId}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`rounded-lg border px-4 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'border-green-700 bg-green-50 text-green-700 ring-2 ring-green-700/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {v.tenBienThe ?? v.TenBienThe}
                      {(v.sku ?? v.SKU) && <span className="block text-[10px] text-slate-400 font-normal">SKU: {v.sku ?? v.SKU}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hiển thị giá */}
          <div className="mt-5 flex items-baseline gap-3">
            <strong className="text-3xl font-black text-green-700">{formatPrice(currentPrice)}</strong>
            {originalPrice && (
              <span className="text-sm text-slate-400 line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thông số kỹ thuật</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-line">{specs}</p>
          </div>

          {description && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mô tả sản phẩm</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          )}

          <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <span className="flex items-center gap-2"><BadgeCheck className="text-emerald-600" size={17} />Cam kết hàng chính hãng 100%</span>
            <span className="flex items-center gap-2"><Truck className="text-green-700" size={17} />Giao hàng toàn quốc, kiểm tra trước khi nhận</span>
          </div>

          {/* Chọn số lượng & Nút Thêm vào giỏ / Mua ngay */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-slate-200">
              <button
                aria-label="Giảm số lượng"
                className="grid size-10 place-items-center text-slate-600 hover:text-green-700 disabled:opacity-40"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || isAddingCart}
                type="button"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                aria-label="Tăng số lượng"
                className="grid size-10 place-items-center text-slate-600 hover:text-green-700 disabled:opacity-40"
                onClick={() => setQuantity((current) => Math.min(currentStock || 99, current + 1))}
                disabled={quantity >= currentStock || isAddingCart}
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Nút Thêm vào giỏ (yêu cầu đăng nhập) */}
            <button
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold text-white transition ${
                isSuccess
                  ? 'bg-emerald-600'
                  : 'bg-green-700 hover:bg-green-800'
              } disabled:bg-slate-300`}
              onClick={handleAddToCart}
              disabled={currentStock <= 0 || isAddingCart}
              type="button"
            >
              {isAddingCart ? (
                <>
                  <Loader2 className="animate-spin" size={17} /> Đang lưu vào giỏ...
                </>
              ) : isSuccess ? (
                <>
                  <Check size={17} /> Đã thêm {quantity} sản phẩm!
                </>
              ) : (
                <>
                  <ShoppingCart size={17} />
                  {currentStock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                </>
              )}
            </button>

            {/* Nút Mua ngay */}
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              onClick={handleBuyNow}
              disabled={currentStock <= 0 || isAddingCart}
              type="button"
            >
              <ShoppingBag size={17} /> Mua ngay <ArrowRight size={15} />
            </button>

            <button
              aria-label={favorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
              className={`grid size-11 place-items-center rounded-lg border border-slate-200 ${favorite ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
              onClick={() => toggleFavorite(id)}
              type="button"
            >
              <Heart fill={favorite ? 'currentColor' : 'none'} size={19} />
            </button>
          </div>

          {!localStorage.getItem('user') && (
            <p className="mt-3 text-xs text-slate-500">
              * Bạn có thể chọn <strong>Mua ngay</strong> nhanh chóng, hoặc đăng nhập để <strong>Thêm vào giỏ hàng</strong>.
            </p>
          )}
        </div>
      </div>

      {/* Khối Sản Phẩm Liên Quan */}
      {(loadingRelated || relatedProducts.length > 0) && (
        <section className="mt-16 border-t border-slate-200 pt-12">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Sản phẩm liên quan</h2>
              <p className="mt-1 text-sm text-slate-500">Gợi ý các sản phẩm tương tự có thể bạn quan tâm</p>
            </div>
            <Link
              to="/san-pham"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="aspect-square w-full rounded-xl bg-slate-100" />
                  <div className="mt-4 h-3 w-1/3 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-4 h-5 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const relId = item.maSanPham ?? item.MaSanPham ?? item.id ?? item.Id;
                const relName = item.tenSanPham ?? item.TenSanPham ?? item.name ?? 'Sản phẩm';
                const relCat = item.tenDanhMuc ?? item.TenDanhMuc ?? categoryName;
                const relImages = item.hinhAnhSanPhams ?? item.HinhAnhSanPhams ?? [];
                const relThumb =
                  item.hinhAnh ||
                  item.HinhAnh ||
                  relImages[0]?.duongDanAnh ||
                  relImages[0]?.DuongDanAnh ||
                  '';

                const { finalPrice, oldPrice } = getProductDisplayPrices(item);
                const isRelFavorite = favorites?.includes(relId);
                const discountPercent =
                  oldPrice && oldPrice > finalPrice
                    ? Math.round(((oldPrice - finalPrice) / oldPrice) * 100)
                    : null;

                return (
                  <div
                    key={relId}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <button
                      type="button"
                      aria-label={isRelFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(relId);
                      }}
                      className={`absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition ${
                        isRelFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart fill={isRelFavorite ? 'currentColor' : 'none'} size={16} />
                    </button>

                    {discountPercent && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        -{discountPercent}%
                      </span>
                    )}

                    <Link to={`/san-pham/${relId}`} className="block aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={getProductImageUrl(relThumb)}
                        alt={relName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={handleProductImageError}
                        onError={handleProductImageError}
                      />
                    </Link>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
                          {relCat}
                        </span>
                        <Link to={`/san-pham/${relId}`}>
                          <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-800 transition group-hover:text-green-700">
                            {relName}
                          </h3>
                        </Link>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2 border-t border-slate-100 pt-3">
                        <span className="text-base font-black text-green-700">{formatPrice(finalPrice)}</span>
                        {oldPrice && (
                          <span className="text-xs text-slate-400 line-through">{formatPrice(oldPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}