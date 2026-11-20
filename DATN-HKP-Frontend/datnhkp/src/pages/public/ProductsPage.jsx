import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  ShoppingBag,
  X,
} from 'lucide-react';

import ProductCard from '../../components/ProductCard.jsx';
import { productService } from '../../services/productService';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';

  const category = searchParams.get('danh-muc') || 'Tất cả';
  const query = searchParams.get('search') || searchParams.get('q') || '';
  const promotionOnly = searchParams.get('uu-dai') === 'true';
  const pageNumber = Number(searchParams.get('page')) || 1;
  const pageSize = 12;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Chuẩn hóa dữ liệu từ SanPhamDto
  const normalizeProduct = (item) => {
    const rawSalePrice = Number(item.giaKhuyenMai ?? item.GiaKhuyenMai ?? 0);
    const rawBasePrice = Number(item.gia ?? item.Gia ?? item.price ?? 0);
    const price = rawSalePrice > 0 ? rawSalePrice : rawBasePrice;
    const oldPrice = Number(item.gia ?? item.Gia ?? item.oldPrice ?? price);

    return {
      ...item,
      id: item.maSanPham ?? item.MaSanPham ?? item.id,
      maSanPham: item.maSanPham ?? item.MaSanPham ?? item.id,
      name: item.tenSanPham ?? item.TenSanPham ?? item.name ?? '',
      tenSanPham: item.tenSanPham ?? item.TenSanPham ?? item.name ?? '',
      category:
        item.tenDanhMuc ??
        item.TenDanhMuc ??
        item.category ??
        item.danhMuc?.tenDanhMuc ??
        '',
      price,
      oldPrice,
      specs: item.thongSoKyThuat ?? item.ThongSoKyThuat ?? item.specs ?? '',
      hinhAnh: item.hinhAnh ?? item.HinhAnh,
      soLuong: item.soLuong ?? item.SoLuong ?? 0,
      bienTheSanPhams: item.bienTheSanPhams ?? item.BienTheSanPhams ?? [],
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [productRes, categoryRes] = await Promise.all([
          productService.getSanPhams({
            pageNumber,
            pageSize,
            search: query.trim(),
            category: category === 'Tất cả' ? '' : category,
            includeInactive: false,
          }),
          productService.getCategories(),
        ]);

        const productData = productRes?.data ?? productRes;
        const categoryData = categoryRes?.data ?? categoryRes;

        const productList =
          productData?.items ??
          productData?.Items ??
          productData?.data ??
          productData?.Data ??
          (Array.isArray(productData) ? productData : []);

        const categoryList =
          categoryData?.items ??
          categoryData?.Items ??
          categoryData?.data ??
          categoryData?.Data ??
          (Array.isArray(categoryData) ? categoryData : []);

        const total =
          productData?.totalItems ??
          productData?.TotalItems ??
          productData?.totalCount ??
          productData?.TotalCount ??
          productList.length;

        const pages =
          productData?.totalPages ??
          productData?.TotalPages ??
          Math.max(1, Math.ceil(Number(total) / pageSize));

        setProducts(productList.map(normalizeProduct));
        setCategories(categoryList);
        setTotalItems(total);
        setTotalPages(pages);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu sản phẩm:', err);
        setError(
          err.response?.data?.message ||
            'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pageNumber, query, category]);

  const filteredProducts = promotionOnly
    ? products.filter((p) => p.oldPrice > p.price)
    : products;

  const chooseCategory = (nextCategory) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextCategory === 'Tất cả') {
      nextParams.delete('danh-muc');
    } else {
      nextParams.set('danh-muc', nextCategory);
    }

    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const clearSearchQuery = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    nextParams.delete('q');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const goToPage = (page) => {
    const nextParams = new URLSearchParams(searchParams);

    if (page <= 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(page));
    }

    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, pageNumber - 1);
    let end = Math.min(totalPages - 1, pageNumber + 1);

    if (pageNumber <= 3) {
      end = 4;
    }
    if (pageNumber >= totalPages - 2) {
      start = totalPages - 3;
    }

    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('...');

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-xs text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link className="hover:text-green-700" to="/">
          Trang chủ
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-800">Sản phẩm</span>
      </nav>

      {/* Tiêu đề */}
      <section className="relative mb-7 overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-20 size-56 rounded-full bg-green-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-300">
              {storeName} · Công nghệ trong tầm tay
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {promotionOnly
                ? 'Ưu đãi nổi bật'
                : category === 'Tất cả'
                  ? 'Tất cả sản phẩm'
                  : category}
            </h1>

            {query ? (
              <p className="mt-2 text-sm text-slate-300">
                Kết quả tìm kiếm cho “{query}”
              </p>
            ) : (
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Chọn sản phẩm phù hợp, thêm vào giỏ hoặc mua ngay để tiếp tục
                thanh toán.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-green-100">
              <BadgeCheck size={16} /> Mua hàng không cần đăng nhập
            </span>

            <span className="hidden items-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold sm:inline-flex">
              <ShoppingBag size={16} />
              {loading ? 'Đang tải...' : `${totalItems} sản phẩm`}
            </span>
          </div>
        </div>
      </section>

      {/* Bộ lọc danh mục & từ khóa */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <span className="mr-1 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
          <SlidersHorizontal size={15} />
          Lọc:
        </span>

        {[
          'Tất cả',
          ...categories
            .map(
              (item) =>
                item.tenDanhMuc ?? item.TenDanhMuc ?? item.name ?? item.Name
            )
            .filter(Boolean),
        ].map((item) => (
          <button
            key={item}
            onClick={() => chooseCategory(item)}
            type="button"
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              category === item
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700'
            }`}
          >
            {item}
          </button>
        ))}

        {query && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 border border-green-200">
            Từ khóa: “{query}”
            <button
              type="button"
              onClick={clearSearchQuery}
              aria-label="Xóa từ khóa tìm kiếm"
              className="rounded-full p-0.5 hover:bg-green-200/60"
            >
              <X size={13} />
            </button>
          </span>
        )}

        {(query || promotionOnly || category !== 'Tất cả') && (
          <button
            className="ml-auto text-xs font-semibold text-green-700 hover:underline"
            onClick={() => setSearchParams({})}
            type="button"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* Lỗi API */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* Danh sách sản phẩm */}
      {!loading && !error && (
        filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-green-300 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((p, index) =>
                  p === '...' ? (
                    <span
                      key={`dots-${index}`}
                      className="px-2 text-slate-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        pageNumber === p
                          ? 'bg-green-700 text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(pageNumber + 1)}
                  disabled={pageNumber >= totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-green-300 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-300 text-center">
            <div>
              <p className="font-bold text-slate-800">
                Chưa tìm thấy sản phẩm phù hợp
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Thử từ khóa khác hoặc xem toàn bộ cửa hàng.
              </p>
              <button
                className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white"
                onClick={() => setSearchParams({})}
                type="button"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}