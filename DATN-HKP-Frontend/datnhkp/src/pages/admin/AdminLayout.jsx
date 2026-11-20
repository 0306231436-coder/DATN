import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  Layers3,
  LayoutDashboard,
  Laptop,
  Megaphone,
  LogOut,
  Package,
  Search,
  Store,
  Users,
} from 'lucide-react';
import { getStoredUser } from '../../services/authUtils';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

function AdminAccountMenu({ displayName, avatar, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Tùy chọn tài khoản ${displayName}`}
        className="flex items-center gap-2.5 rounded-xl p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-600"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-100 text-xs font-black text-green-800">{avatar}</span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-40 truncate text-xs font-bold text-slate-800">{displayName}</span>
          <span className="block text-[10px] text-slate-500">Quản trị viên</span>
        </span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="menu">
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            role="menuitem"
            type="button"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

const menuItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, to: '/admin', end: true },
  { label: 'Sản phẩm', icon: Package, to: '/admin/san-pham' },
  { label: 'Danh mục', icon: Layers3, to: '/admin/danh-muc' },
  { label: 'Thương hiệu', icon: Megaphone, to: '/admin/thuong-hieu' },
  { label: 'Thông tin cửa hàng', icon: Store, to: '/admin/trang' },
  { label: 'Đơn hàng', icon: ClipboardList, to: '/admin/don-hang', badge: '8' },
  // { label: 'Khách hàng', icon: Users, to: '/admin/khach-hang' },
  { label: 'Báo cáo', icon: ChartNoAxesCombined, to: '/admin/bao-cao' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { storeInfo } = useStoreInfo();
  const user = getStoredUser();
  const storeName = storeInfo?.name?.trim() || 'Cửa hàng';
  const storeLogo = storeInfo?.logo;
  const displayName = user?.hoTen || user?.HoTen || user?.tenDangNhap || user?.TenDangNhap || 'Quản trị viên';
  const avatar = displayName.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'A';
  const currentPage = menuItems.find((item) => item.to === pathname)?.label || 'Trang quản trị';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    navigate('/dang-nhap', { replace: true });
  };

  const navClass = ({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-green-50 text-green-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
  }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6" to="/">
          <span className={`grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl ${storeLogo ? 'bg-white' : 'bg-green-700 text-white shadow-lg shadow-green-700/20'}`}>
            {storeLogo ? <img alt={storeName} className="size-full object-contain" src={storeLogo} /> : <Laptop size={21} />}
          </span>
          <span className="truncate text-lg font-black tracking-tight text-slate-900">{storeName}</span>
          <span className="ml-auto rounded-md bg-green-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-green-700">Admin</span>
        </Link>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Quản lý cửa hàng</p>
          <nav aria-label="Điều hướng quản trị" className="space-y-1">
            {menuItems.map(({ label, icon: Icon, to, end, badge }) => (
              <NavLink className={navClass} end={end} key={to} to={to}>
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                    {label}
                    {badge && <span className="ml-auto rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-green-500/20 text-green-300"><CircleHelp size={18} /></span>
            <p className="mt-3 text-sm font-bold">Bạn cần hỗ trợ?</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Cập nhật thông tin và kênh liên hệ của cửa hàng.</p>
            {storeInfo?.email ? (
              <a className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-300 hover:text-green-200" href={`mailto:${storeInfo.email}`}>Liên hệ hỗ trợ <ArrowRight size={13} /></a>
            ) : (
              <Link className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-300 hover:text-green-200" to="/admin/trang">Cập nhật thông tin <ArrowRight size={13} /></Link>
            )}
          </div>
          <Link className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900" to="/"><LogOut size={17} /> Về trang cửa hàng</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg lg:hidden ${storeLogo ? 'bg-white' : 'bg-green-700 text-white'}`}>
                {storeLogo ? <img alt="" className="size-full object-contain" src={storeLogo} /> : <Laptop size={19} />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{currentPage}</p>
                <p className="hidden text-xs text-slate-500 sm:block">Quản lý hoạt động cửa hàng {storeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button aria-label="Thông báo" className="relative grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-green-50 hover:text-green-700">
                <Bell size={18} /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-red-500" />
              </button>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <AdminAccountMenu avatar={avatar} displayName={displayName} onLogout={handleLogout} />
            </div>
          </div>
          <nav aria-label="Điều hướng nhanh" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {menuItems.map(({ label, to, end }) => <NavLink className={navClass} end={end} key={to} to={to}>{label}</NavLink>)}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          <Outlet />
          <footer className="flex flex-wrap items-center justify-between gap-2 py-7 text-[11px] text-slate-400">
            <span>© 2026 {storeName} Admin. Bảng điều khiển cửa hàng.</span>
            <Link className="hover:text-green-700" to="/">Quay lại trang cửa hàng</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
