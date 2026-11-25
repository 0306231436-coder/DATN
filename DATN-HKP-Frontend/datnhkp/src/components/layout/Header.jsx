import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Laptop,
  Search,
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  Package,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { isAdminUser } from '../../services/authUtils';
import { productService } from '../../services/productService.js';
import { useStore } from '../../context/StoreContext.jsx';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { getProductImageUrl, handleProductImageError } from '../../services/imageUtils.js';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // State tìm kiếm
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const { cart } = useStore();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';
  const hotline = storeInfo?.hotline?.trim() || '1900 1234';
  const cartCount = user ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

  // Đồng bộ từ khóa khi URL thay đổi
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || searchParams.get('q') || '');
  }, [searchParams]);

  // Lấy thông tin user từ localStorage
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Lỗi đọc thông tin user:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
    window.addEventListener('storage', loadUserFromStorage);
    return () => {
      window.removeEventListener('storage', loadUserFromStorage);
    };
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gợi ý tìm kiếm nhanh (Debounce 350ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setTotalResults(0);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getSanPhams({
          pageNumber: 1,
          pageSize: 5,
          search: trimmed,
          includeInactive: false,
        });

        if (cancelled) return;

        const payload = res?.data ?? res;
        const items = Array.isArray(payload)
          ? payload
          : payload?.items ?? payload?.Items ?? payload?.data ?? [];
        const total = payload?.totalItems ?? payload?.TotalItems ?? items.length;

        setSearchResults(items);
        setTotalResults(total);
      } catch (err) {
        if (!cancelled) {
          console.error('Lỗi tìm kiếm:', err);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setShowSuggestions(false);
    setMobileMenuOpen(false);

    if (!trimmed) {
      navigate('/san-pham');
      return;
    }
    navigate(`/san-pham?search=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(new Event('storage'));
    navigate('/dang-nhap');
  };

  const getAvatarLetter = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Top Notification Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
            Chào mừng bạn đến với {storeName} — Công nghệ trong tầm tay
          </p>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>Hotline: {hotline}</span>
            <Link to="/lien-he" className="hover:text-white transition">Liên hệ</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-black text-xl text-slate-900 tracking-tight shrink-0">
            <span className="grid size-10 place-items-center rounded-xl bg-green-600 text-white shadow-md shadow-green-600/20">
              {storeInfo?.logo
                ? <img alt="" className="size-full rounded-xl object-contain" src={storeInfo.logo} />
                : <Laptop size={22} />}
            </span>
            <span className="max-w-40 truncate">{storeName}</span>
          </Link>

          {/* Thanh tìm kiếm đơn giản */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Tìm kiếm sản phẩm..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-3.5 pr-16 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-green-600 focus:bg-white"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  aria-label="Xóa từ khóa"
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
              )}

              <button
                type="submit"
                aria-label="Tìm kiếm sản phẩm"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-green-700 transition"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin text-green-600" /> : <Search size={18} />}
              </button>
            </form>

            {/* Dropdown kết quả gợi ý tối giản */}
            {showSuggestions && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {isSearching && searchResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">Đang tìm kiếm...</p>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="divide-y divide-slate-100">
                      {searchResults.map((item) => {
                        const itemId = item.maSanPham ?? item.MaSanPham ?? item.id;
                        const itemName = item.tenSanPham ?? item.TenSanPham ?? item.name;
                        const itemPrice = item.gia ?? item.Gia ?? 0;

                        return (
                          <Link
                            key={itemId}
                            to={`/san-pham/${itemId}`}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <img
                              src={getProductImageUrl(item.hinhAnh ?? item.HinhAnh)}
                              alt={itemName}
                              className="size-10 shrink-0 rounded-md border border-slate-100 object-cover"
                              onError={handleProductImageError}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-800">{itemName}</p>
                              <p className="mt-0.5 text-xs font-bold text-green-700">{formatPrice(itemPrice)}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="block w-full border-t border-slate-100 bg-slate-50/70 py-2 text-center text-xs font-semibold text-green-700 hover:bg-slate-100"
                    >
                      Xem tất cả ({totalResults}) kết quả
                    </button>
                  </>
                ) : (
                  <p className="py-4 text-center text-xs text-slate-500">
                    Không tìm thấy sản phẩm nào
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: Đã đăng nhập / Chưa đăng nhập */}
          <div className="flex items-center gap-3">

            {/* Nút Giỏ hàng */}
            <Link
              to="/gio-hang"
              className="relative flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:border-green-600 hover:text-green-700"
            >
              <ShoppingBag size={20} />
              <span className="hidden sm:inline text-xs font-bold">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[11px] font-black text-white shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Khu vực tài khoản */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-3 text-slate-800 transition hover:border-green-600 hover:bg-green-50/50"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-green-700 text-xs font-black text-white shadow-sm">
                    {getAvatarLetter(user.hoTen || user.tenDangNhap)}
                  </span>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-900 max-w-[120px] truncate">
                      {user.hoTen || user.tenDangNhap}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">
                      {isAdminUser(user) ? 'Quản trị viên' : 'Khách hàng'}
                    </p>
                  </div>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/50">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="text-xs font-bold text-slate-900">{user.hoTen || user.tenDangNhap}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {isAdminUser(user) && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                        >
                          <ShieldCheck size={16} /> Quản trị hệ thống
                        </Link>
                      )}

                      <Link
                        to="/don-hang"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Package size={16} /> Đơn hàng của tôi
                      </Link>

                      <Link
                        to="/tai-khoan"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <UserCheck size={16} /> Thông tin tài khoản
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dang-nhap"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-green-700/15 transition hover:bg-green-800"
                >
                  <User size={16} />
                  <span>Đăng nhập</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 md:hidden hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Categories Bar (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 border-t border-slate-100 py-2.5 text-xs font-semibold text-slate-600">
          <Link to="/" className="text-green-700 hover:text-green-800 font-bold">Trang chủ</Link>
          <Link to="/san-pham?danh-muc=Laptop" className="hover:text-green-700 transition">Laptop</Link>
          <Link to="/san-pham?danh-muc=PC" className="hover:text-green-700 transition">PC</Link>
          <Link to="/san-pham?danh-muc=Macbook" className="hover:text-green-700 transition">Macbook</Link>
          <Link to="/lien-he" className="hover:text-green-700 transition">Liên hệ</Link>
          <Link to="/gioi-thieu" className="hover:text-green-700 transition">Giới thiệu</Link>
          {!user && (
            <Link to="/tra-cuu-don-hang" className="hover:text-green-700 transition">Tra cứu đơn hàng</Link>
          )}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pb-6 pt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-xs outline-none focus:border-green-600 focus:bg-white"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-700"
            >
              <Search size={16} />
            </button>
          </form>
          <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
            <Link to="/san-pham" onClick={() => setMobileMenuOpen(false)}>Tất cả sản phẩm</Link>
            {user ? (
              <Link to="/don-hang" onClick={() => setMobileMenuOpen(false)}>Đơn hàng của tôi</Link>
            ) : (
              <Link to="/tra-cuu-don-hang" onClick={() => setMobileMenuOpen(false)}>Tra cứu đơn hàng</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}