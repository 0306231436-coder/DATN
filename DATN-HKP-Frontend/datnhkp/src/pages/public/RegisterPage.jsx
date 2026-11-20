import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Laptop, LockKeyhole, Mail, ShieldCheck, UserRound, AtSign, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

const getErrorMessage = (err) => {
  const data = err.response?.data;
  if (!data) return err.message || 'Tạo tài khoản thất bại';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && data.errors[firstKey].length > 0) {
      return data.errors[firstKey][0];
    }
  }
  return data.title || err.message || 'Tạo tài khoản thất bại';
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    tenDangNhap: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Chỉ cho phép nhập số ở trường số điện thoại và giới hạn 10 ký tự
    if (name === 'soDienThoai') {
      const onlyNumbers = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        soDienThoai: onlyNumbers,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    // Kiểm tra thêm phía frontend
    if (formData.soDienThoai.length !== 10 || !formData.soDienThoai.startsWith('0')) {
      setError('Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.register({
        tenDangNhap: formData.tenDangNhap,
        hoTen: formData.hoTen,
        email: formData.email,
        soDienThoai: formData.soDienThoai,
        matKhau: formData.matKhau,
      });

      const data = res.data || res;

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('storage'));
      navigate('/');
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
              Đăng ký tài khoản để mua sắm và nhận những ưu đãi hấp dẫn.
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

        {/* Form Đăng ký bên phải */}
        <section className="px-5 py-8 sm:px-10 sm:py-11 lg:px-12">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-slate-900 lg:hidden" to="/">
            <span className="grid size-9 place-items-center rounded-lg bg-green-700 text-white">
              {storeInfo?.logo ? <img alt="" className="size-full rounded-lg object-contain" src={storeInfo.logo} /> : <Laptop size={19} />}
            </span>
            {storeName}
          </Link>
          <div className="mt-8 lg:mt-4">
            <p className="text-sm font-bold text-green-700">BẮT ĐẦU CÙNG {storeName.toLocaleUpperCase('vi')}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Tạo tài khoản
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Điền thông tin để tạo tài khoản mua sắm.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tên đăng nhập</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <AtSign className="text-slate-400" size={18} />
                <input
                  autoComplete="username"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="tenDangNhap"
                  onChange={handleChange}
                  placeholder="vuducan123"
                  required
                  type="text"
                  value={formData.tenDangNhap}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Họ và tên</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <UserRound className="text-slate-400" size={18} />
                <input
                  autoComplete="name"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="hoTen"
                  onChange={handleChange}
                  placeholder="Vũ Đức An"
                  required
                  type="text"
                  value={formData.hoTen}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <Mail className="text-slate-400" size={18} />
                <input
                  autoComplete="email"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  name="email"
                  onChange={handleChange}
                  placeholder="ban@email.com"
                  required
                  type="email"
                  value={formData.email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <span className="text-sm text-slate-400">VN</span>
                <input
                  autoComplete="tel"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  inputMode="numeric"
                  maxLength={10}
                  name="soDienThoai"
                  onChange={handleChange}
                  placeholder="0912345678"
                  required
                  type="tel"
                  value={formData.soDienThoai}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu</span>
              <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10">
                <LockKeyhole className="text-slate-400" size={18} />
                <input
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  minLength={6}
                  name="matKhau"
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.matKhau}
                />
                <button
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="text-slate-400 hover:text-slate-700"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-500 pt-1">
              <input className="mt-1 accent-green-700" required type="checkbox" />
              <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của {storeName}.</span>
            </label>

            {error && (
              <p aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-sm font-bold text-white shadow-lg shadow-green-700/15 transition hover:bg-green-800 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Đang tạo tài khoản...
                </>
              ) : (
                <>
                  Tạo tài khoản <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link className="font-bold text-green-700 hover:text-green-800" to="/dang-nhap">
              Đăng nhập
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}