import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Laptop, LockKeyhole, UserRound, ShieldCheck, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { isAdminUser } from '../../services/authUtils';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

const getErrorMessage = (err) => {
  const data = err.response?.data;
  if (!data) return err.message || 'Đăng nhập thất bại';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && data.errors[firstKey].length > 0) {
      return data.errors[firstKey][0];
    }
  }
  return data.title || err.message || 'Đăng nhập thất bại';
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ tenDangNhap: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await authService.login({
        userNameOrEmail: formData.tenDangNhap,
        matKhau: formData.password,
      });

      const data = res.data || res;

      if (data.token) {
        localStorage.setItem('token', data.token);
      } else {
        localStorage.removeItem('token');
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('user');
      }

      window.dispatchEvent(new Event('storage'));

      const requestedPath = typeof location.state?.from === 'string'
        ? location.state.from
        : typeof location.state?.from?.pathname === 'string'
          ? location.state.from.pathname
          : '/';
      const safeRequestedPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/';
      const requestedAdminPath = safeRequestedPath === '/admin' || safeRequestedPath.startsWith('/admin/');
      const redirectPath = isAdminUser(data.user)
        ? (requestedAdminPath ? safeRequestedPath : '/admin')
        : (requestedAdminPath ? '/' : safeRequestedPath);
      navigate(redirectPath);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[0.9fr_1.1fr]">

        {/* Sidebar giới thiệu bên trái */}
        <aside className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
          <div className="absolute -right-24 -top-20 size-80 rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-cyan-500/15 blur-3xl" />
          <Link className="relative inline-flex items-center gap-3 text-xl font-black tracking-tight" to="/">
            <span className="grid size-11 place-items-center rounded-xl bg-green-600">
              {storeInfo?.logo ? <img alt="" className="size-full rounded-xl object-contain" src={storeInfo.logo} /> : <Laptop size={24} />}
            </span>
            {storeName}
          </Link>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-green-300">
              <ShieldCheck size={15} /> Mua sắm an tâm
            </span>
            <h1 className="mt-6 max-w-sm text-4xl font-black leading-tight">
              Công nghệ tốt,<br />trải nghiệm tốt hơn.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Đăng nhập để theo dõi đơn hàng và khám phá những ưu đãi dành riêng cho bạn.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-200">
              {['Sản phẩm chính hãng', 'Hỗ trợ tận tâm mỗi ngày', 'Thanh toán linh hoạt'].map((item) => (
                <p className="flex items-center gap-2.5" key={item}>
                  <span className="grid size-5 place-items-center rounded-full bg-green-500/20 text-green-300"><Check size={13} /></span>
                  {item}
                </p>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-slate-500">{storeName} — Công nghệ trong tầm tay</p>
        </aside>

        {/* Form Đăng nhập bên phải */}
        <section className="px-5 py-8 sm:px-10 sm:py-11 lg:px-12">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-slate-900 lg:hidden" to="/">
            <span className="grid size-9 place-items-center rounded-lg bg-green-700 text-white">
              {storeInfo?.logo ? <img alt="" className="size-full rounded-lg object-contain" src={storeInfo.logo} /> : <Laptop size={19} />}
            </span>
            {storeName}
          </Link>
          <div className="mt-8 lg:mt-4">
            <p className="text-sm font-bold text-green-700">CHÀO MỪNG BẠN TRỜ LẠI</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Đăng nhập
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Nhập thông tin để tiếp tục mua sắm.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên đăng nhập</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <UserRound className="text-slate-400" size={18} />
                <input
                  autoComplete="username"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="tenDangNhap"
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập"
                  required
                  type="text"
                  value={formData.tenDangNhap}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <LockKeyhole className="text-slate-400" size={18} />
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  minLength={6}
                  name="password"
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                />
                <button aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="text-slate-400 hover:text-slate-700" onClick={() => setShowPassword((v) => !v)} type="button">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input className="accent-green-700" type="checkbox" /> Ghi nhớ đăng nhập
              </label>
              <button className="font-semibold text-green-700 hover:text-green-800" onClick={() => setNotice('Vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp đặt lại mật khẩu.')} type="button">
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <p aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {notice && (
              <p aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {notice}
              </p>
            )}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-sm font-bold text-white shadow-lg shadow-green-700/15 transition hover:bg-green-800 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link className="font-bold text-green-700 hover:text-green-800" to="/dang-ky">
              Đăng ký ngay
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}