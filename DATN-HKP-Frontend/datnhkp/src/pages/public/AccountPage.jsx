import { useEffect, useState } from 'react';
import {
  KeyRound,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { authService } from '../../services/authService.js';
import { diaChiNguoiDungService } from '../../services/diaChiNguoiDungService.js';
import { getStoredUser } from '../../services/authUtils.js';
import { provinceService } from '../../services/provinceService.js';

const getField = (value, ...keys) => {
  for (const key of keys) {
    if (value?.[key] !== undefined && value[key] !== null) return value[key];
  }
  return '';
};

const getEntity = (response) => {
  let value = response;
  for (let depth = 0; depth < 2 && value?.data && !Array.isArray(value.data); depth += 1) {
    value = value.data;
  }
  return value;
};

const getList = (response) => {
  const value = getEntity(response);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return null;
};

const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && data.errors[firstKey]?.length) return data.errors[firstKey][0];
  }
  return data?.title || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

const maskEmail = (email) => {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return '***';
  return `${email.slice(0, Math.min(2, atIndex))}***${email.slice(atIndex)}`;
};

const inputClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-600/10 disabled:bg-slate-50';
const labelClassName = 'block text-sm font-semibold text-slate-700';

export default function AccountPage() {
  const [user, setUser] = useState(() => getStoredUser());
  const userId = getField(user, 'maNguoiDung', 'MaNguoiDung', 'id', 'Id');
  const [profile, setProfile] = useState({ hoTen: '', email: '', soDienThoai: '', tenDangNhap: '' });
  const [password, setPassword] = useState({ matKhauMoi: '', xacNhanMatKhau: '' });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [profileNotice, setProfileNotice] = useState({ type: '', message: '' });
  const [addressNotice, setAddressNotice] = useState({ type: '', message: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressActionId, setAddressActionId] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceError, setProvinceError] = useState('');
  const [wardError, setWardError] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [addressForm, setAddressForm] = useState({
    tenNguoiNhan: '',
    soDienThoai: '',
    diaChi: '',
    tinhThanh: '',
    phuongXa: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      if (!userId) {
        setProfileError('Không tìm thấy mã tài khoản. Vui lòng đăng nhập lại.');
        setAddressError('Không thể tải địa chỉ khi thiếu mã tài khoản.');
        setLoading(false);
        return;
      }

      const [userResult, addressResult] = await Promise.allSettled([
        authService.getUserById(userId),
        diaChiNguoiDungService.getByUser(userId),
      ]);

      if (!isMounted) return;

      if (userResult.status === 'fulfilled') {
        const account = getEntity(userResult.value);
        setUser((previous) => ({ ...previous, ...account }));
        setProfile({
          hoTen: getField(account, 'hoTen', 'HoTen') || getField(user, 'hoTen', 'HoTen'),
          email: getField(account, 'email', 'Email') || getField(user, 'email', 'Email'),
          soDienThoai: getField(account, 'soDienThoai', 'SoDienThoai') || getField(user, 'soDienThoai', 'SoDienThoai'),
          tenDangNhap: getField(account, 'tenDangNhap', 'TenDangNhap') || getField(user, 'tenDangNhap', 'TenDangNhap'),
        });
      } else {
        console.error('Lỗi khi tải thông tin tài khoản:', userResult.reason);
        setProfileError(getErrorMessage(userResult.reason));
        setProfile({
          hoTen: getField(user, 'hoTen', 'HoTen'),
          email: getField(user, 'email', 'Email'),
          soDienThoai: getField(user, 'soDienThoai', 'SoDienThoai'),
          tenDangNhap: getField(user, 'tenDangNhap', 'TenDangNhap'),
        });
      }

      if (addressResult.status === 'fulfilled') {
        const list = getList(addressResult.value);
        if (list) {
          setAddresses(list);
          setAddressForm((previous) => ({
            ...previous,
            tenNguoiNhan: getField(user, 'hoTen', 'HoTen') || previous.tenNguoiNhan,
            soDienThoai: getField(user, 'soDienThoai', 'SoDienThoai') || previous.soDienThoai,
          }));
        } else {
          setAddressError('Dữ liệu địa chỉ từ máy chủ không hợp lệ.');
        }
      } else {
        console.error('Lỗi khi tải danh sách địa chỉ:', addressResult.reason);
        setAddressError(getErrorMessage(addressResult.reason));
      }

      setLoading(false);
    };

    loadAccount();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    provinceService.getProvinces()
      .then((data) => {
        if (isMounted) setProvinces(data);
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách tỉnh/thành phố:', error);
        if (isMounted) setProvinceError('Không thể tải tỉnh/thành phố. Vui lòng thử tải lại trang.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!addressForm.tinhThanh) {
      setWards([]);
      setWardError('');
      setIsLoadingWards(false);
      return undefined;
    }

    let isMounted = true;
    setWards([]);
    setIsLoadingWards(true);
    setWardError('');
    provinceService.getWards(addressForm.tinhThanh)
      .then((data) => {
        if (isMounted) setWards(data);
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách phường/xã:', error);
        if (isMounted) setWardError('Không thể tải phường/xã. Vui lòng chọn lại tỉnh/thành.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [addressForm.tinhThanh]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((previous) => ({
      ...previous,
      [name]: name === 'soDienThoai' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((previous) => ({
      ...previous,
      [name]: name === 'soDienThoai' ? value.replace(/\D/g, '').slice(0, 10) : value,
      ...(name === 'tinhThanh' ? { phuongXa: '' } : {}),
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileNotice({ type: '', message: '' });
    if (!profile.hoTen.trim()) {
      setProfileNotice({ type: 'error', message: 'Vui lòng nhập họ và tên.' });
      return;
    }
    if (!/^0\d{9}$/.test(profile.soDienThoai)) {
      setProfileNotice({ type: 'error', message: 'Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số.' });
      return;
    }
    if (password.matKhauMoi && password.matKhauMoi.length < 6) {
      setProfileNotice({ type: 'error', message: 'Mật khẩu mới cần có ít nhất 6 ký tự.' });
      return;
    }
    if (password.matKhauMoi !== password.xacNhanMatKhau) {
      setProfileNotice({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSavingProfile(true);
    try {
      const updateData = {
        hoTen: profile.hoTen.trim(),
        soDienThoai: profile.soDienThoai,
      };
      if (password.matKhauMoi) updateData.matKhauMoi = password.matKhauMoi;

      await authService.updateUser(userId, updateData);
      const nextUser = { ...user, hoTen: updateData.hoTen, soDienThoai: updateData.soDienThoai };
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
      window.dispatchEvent(new Event('storage'));
      setPassword({ matKhauMoi: '', xacNhanMatKhau: '' });
      setProfileNotice({ type: 'success', message: 'Thông tin tài khoản đã được cập nhật.' });
    } catch (error) {
      console.error('Lỗi khi cập nhật tài khoản:', error);
      setProfileNotice({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setAddressNotice({ type: '', message: '' });
    if (!addressForm.tenNguoiNhan.trim() || !addressForm.soDienThoai.trim() || !addressForm.diaChi.trim()) {
      setAddressNotice({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin địa chỉ.' });
      return;
    }
    if (!/^0\d{9}$/.test(addressForm.soDienThoai)) {
      setAddressNotice({ type: 'error', message: 'Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số.' });
      return;
    }

    let addressDetails = addressForm.diaChi.trim();
    if (!editingAddressId) {
      const province = provinces.find((item) => String(item.code) === addressForm.tinhThanh);
      const ward = wards.find((item) => String(item.code) === addressForm.phuongXa);
      if (!province || !ward) {
        setAddressNotice({ type: 'error', message: 'Vui lòng chọn tỉnh/thành và phường/xã.' });
        return;
      }
      addressDetails = `${addressDetails}, ${ward.name}, ${province.name}`;
    }

    setSavingAddress(true);
    try {
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) throw new Error('Mã tài khoản không hợp lệ.');

      const data = {
        maNguoiDung: numericUserId,
        tenNguoiNhan: addressForm.tenNguoiNhan.trim(),
        soDienThoai: addressForm.soDienThoai,
        diaChiChiTiet: addressDetails,
      };

      if (editingAddressId) {
        const address = addresses.find((item) => String(getField(item, 'maDiaChi', 'MaDiaChi')) === String(editingAddressId));
        await diaChiNguoiDungService.update(editingAddressId, {
          ...data,
          maDiaChi: Number(editingAddressId),
          laMacDinh: Boolean(address?.laMacDinh ?? address?.LaMacDinh),
        });
      } else {
        await diaChiNguoiDungService.create({
          ...data,
          laMacDinh: addresses.length === 0,
        });
      }

      const list = getList(await diaChiNguoiDungService.getByUser(userId));
      if (!list) throw new Error('Đã lưu địa chỉ nhưng không thể tải lại danh sách địa chỉ.');
      setAddresses(list);
      setAddressForm((previous) => ({ ...previous, diaChi: '', tinhThanh: '', phuongXa: '' }));
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressNotice({ type: 'success', message: editingAddressId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.' });
    } catch (error) {
      console.error('Lỗi khi lưu địa chỉ:', error);
      setAddressNotice({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSavingAddress(false);
    }
  };

  const startNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      tenNguoiNhan: profile.hoTen || '',
      soDienThoai: profile.soDienThoai || '',
      diaChi: '',
      tinhThanh: '',
      phuongXa: '',
    });
    setAddressNotice({ type: '', message: '' });
    setShowAddressForm(true);
  };

  const startEditingAddress = (address) => {
    setEditingAddressId(getField(address, 'maDiaChi', 'MaDiaChi'));
    setAddressForm({
      tenNguoiNhan: getField(address, 'tenNguoiNhan', 'TenNguoiNhan'),
      soDienThoai: getField(address, 'soDienThoai', 'SoDienThoai'),
      diaChi: getField(address, 'diaChiChiTiet', 'DiaChiChiTiet'),
      tinhThanh: '',
      phuongXa: '',
    });
    setAddressNotice({ type: '', message: '' });
    setShowAddressForm(true);
  };

  const refreshAddresses = async () => {
    const list = getList(await diaChiNguoiDungService.getByUser(userId));
    if (!list) throw new Error('Dữ liệu địa chỉ từ máy chủ không hợp lệ.');
    setAddresses(list);
  };

  const handleSetDefault = async (address) => {
    const id = getField(address, 'maDiaChi', 'MaDiaChi');
    setAddressActionId(id);
    setAddressNotice({ type: '', message: '' });
    try {
      await diaChiNguoiDungService.setDefault(id);
      await refreshAddresses();
      setAddressNotice({ type: 'success', message: 'Đã đặt làm địa chỉ mặc định.' });
    } catch (error) {
      console.error('Lỗi khi đặt địa chỉ mặc định:', error);
      setAddressNotice({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setAddressActionId(null);
    }
  };

  const handleDeleteAddress = async (address) => {
    const id = getField(address, 'maDiaChi', 'MaDiaChi');
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setAddressActionId(id);
    setAddressNotice({ type: '', message: '' });
    try {
      await diaChiNguoiDungService.remove(id);
      await refreshAddresses();
      setAddressNotice({ type: 'success', message: 'Đã xóa địa chỉ.' });
    } catch (error) {
      console.error('Lỗi khi xóa địa chỉ:', error);
      setAddressNotice({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setAddressActionId(null);
    }
  };

  const noticeClass = (type) => type === 'error'
    ? 'rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700'
    : 'rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700';

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">Tài khoản của tôi</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Thông tin tài khoản</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Quản lý thông tin cá nhân, mật khẩu và địa chỉ nhận hàng của bạn.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm font-medium text-slate-600">
            <LoaderCircle className="animate-spin text-green-700" size={20} /> Đang tải thông tin tài khoản...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700">
                  <UserRound size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Hồ sơ cá nhân</h2>
                  <p className="mt-1 text-sm text-slate-500">Cập nhật tên hiển thị và bảo mật tài khoản.</p>
                </div>
              </div>

              {profileError && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{profileError}</p>}
              <form className="space-y-5" onSubmit={handleProfileSubmit}>
                <label className={labelClassName}>
                  Họ và tên
                  <input className={inputClassName} name="hoTen" onChange={handleProfileChange} value={profile.hoTen} required maxLength={100} />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Email
                    <span className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
                      {profile.email ? maskEmail(profile.email) : 'Chưa cập nhật'}
                    </span>
                  </label>
                  <label className={labelClassName}>
                    Số điện thoại
                    <input className={inputClassName} inputMode="numeric" maxLength={10} name="soDienThoai" onChange={handleProfileChange} required value={profile.soDienThoai} />
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><KeyRound size={16} className="text-green-700" /> Đổi mật khẩu</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Để trống nếu bạn không muốn thay đổi mật khẩu.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={labelClassName}>
                      Mật khẩu mới
                      <input className={inputClassName} autoComplete="new-password" minLength={6} name="matKhauMoi" onChange={(event) => setPassword((previous) => ({ ...previous, matKhauMoi: event.target.value }))} type="password" value={password.matKhauMoi} />
                    </label>
                    <label className={labelClassName}>
                      Xác nhận mật khẩu mới
                      <input className={inputClassName} autoComplete="new-password" name="xacNhanMatKhau" onChange={(event) => setPassword((previous) => ({ ...previous, xacNhanMatKhau: event.target.value }))} type="password" value={password.xacNhanMatKhau} />
                    </label>
                  </div>
                </div>

                {profileNotice.message && <p className={noticeClass(profileNotice.type)} role="status">{profileNotice.message}</p>}
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={savingProfile}>
                  {savingProfile ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                    <MapPin size={22} />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Địa chỉ nhận hàng</h2>
                    <p className="mt-1 text-sm text-slate-500">Các địa chỉ đã lưu cho đơn hàng của bạn.</p>
                  </div>
                </div>
                {!showAddressForm && (
                  <button className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-green-50" onClick={startNewAddress} type="button">
                    <Plus size={15} /> <span className="hidden sm:inline">Thêm địa chỉ</span>
                  </button>
                )}
              </div>

              {addressError && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{addressError}</p>}
              {addressNotice.message && <p className={`${noticeClass(addressNotice.type)} mb-4`} role="status">{addressNotice.message}</p>}

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address, index) => (
                    <article className="rounded-xl border border-slate-200 p-4" key={getField(address, 'maDiaChi', 'MaDiaChi') || index}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{getField(address, 'tenNguoiNhan', 'TenNguoiNhan') || 'Người nhận'}</h3>
                        {(address.laMacDinh || address.LaMacDinh) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-800">
                            <ShieldCheck size={13} /> Mặc định
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{getField(address, 'soDienThoai', 'SoDienThoai')}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{getField(address, 'diaChiChiTiet', 'DiaChiChiTiet')}</p>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        {!(address.laMacDinh || address.LaMacDinh) && (
                          <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-green-50 disabled:opacity-50" disabled={addressActionId === getField(address, 'maDiaChi', 'MaDiaChi')} onClick={() => handleSetDefault(address)} type="button">
                            Đặt làm mặc định
                          </button>
                        )}
                        <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50" disabled={addressActionId === getField(address, 'maDiaChi', 'MaDiaChi')} onClick={() => startEditingAddress(address)} type="button">
                          <Pencil size={13} /> Sửa
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50" disabled={addressActionId === getField(address, 'maDiaChi', 'MaDiaChi')} onClick={() => handleDeleteAddress(address)} type="button">
                          {addressActionId === getField(address, 'maDiaChi', 'MaDiaChi') ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                !addressError && <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Bạn chưa lưu địa chỉ nhận hàng nào.</p>
              )}

              {showAddressForm && (
                <form className="mt-5 space-y-4 border-t border-slate-100 pt-5" onSubmit={handleAddressSubmit}>
                  <h3 className="text-sm font-bold text-slate-800">{editingAddressId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                  <label className={labelClassName}>
                    Tên người nhận
                    <input className={inputClassName} maxLength={100} name="tenNguoiNhan" onChange={handleAddressChange} required value={addressForm.tenNguoiNhan} />
                  </label>
                  <label className={labelClassName}>
                    Số điện thoại
                    <input className={inputClassName} inputMode="numeric" maxLength={10} name="soDienThoai" onChange={handleAddressChange} required value={addressForm.soDienThoai} />
                  </label>
                  {editingAddressId ? (
                    <label className={labelClassName}>
                      Địa chỉ đầy đủ
                      <textarea className={inputClassName} maxLength={500} name="diaChi" onChange={handleAddressChange} required rows={3} value={addressForm.diaChi} />
                    </label>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className={labelClassName}>
                          Tỉnh / thành phố
                          <select className={inputClassName} disabled={isLoadingProvinces || Boolean(provinceError)} name="tinhThanh" onChange={handleAddressChange} required value={addressForm.tinhThanh}>
                            <option value="">{isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'}</option>
                            {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
                          </select>
                        </label>
                        <label className={labelClassName}>
                          Phường / xã
                          <select className={inputClassName} disabled={!addressForm.tinhThanh || isLoadingWards || Boolean(wardError)} name="phuongXa" onChange={handleAddressChange} required value={addressForm.phuongXa}>
                            <option value="">{isLoadingWards ? 'Đang tải...' : 'Chọn phường/xã'}</option>
                            {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
                          </select>
                        </label>
                      </div>
                      {(provinceError || wardError) && <p className="text-xs text-red-600">{provinceError || wardError}</p>}
                      <label className={labelClassName}>
                        Số nhà, tên đường
                        <input className={inputClassName} maxLength={250} name="diaChi" onChange={handleAddressChange} placeholder="Ví dụ: 12 Nguyễn Trãi" required value={addressForm.diaChi} />
                      </label>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-60" disabled={savingAddress || (!editingAddressId && Boolean(provinceError || wardError))} type="submit">
                      {savingAddress ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                      {savingAddress ? 'Đang lưu...' : editingAddressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                    </button>
                    <button className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressNotice({ type: '', message: '' }); }} type="button">
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
