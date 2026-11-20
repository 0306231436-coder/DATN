import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WalletCards,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.jsx';
import { donHangService } from '../../services/donHangService.js';
import { diaChiNguoiDungService } from '../../services/diaChiNguoiDungService.js';
import { provinceService } from '../../services/provinceService.js';
import { getStoredUser } from '../../services/authUtils.js';
import { getProductImageUrl, handleProductImageError } from '../../services/imageUtils.js';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, loadingCart, user, clearCart, refreshCart } = useStore();

  // Dọn dẹp sessionStorage cũ
  useEffect(() => {
    try {
      sessionStorage.removeItem('buy_now_item');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isBuyNow = Boolean(!location.state?.fromCart && location.state?.buyNowItem);
  const buyNowItem = isBuyNow ? location.state.buyNowItem : null;

  useEffect(() => {
    if (!isBuyNow && typeof refreshCart === 'function') {
      refreshCart();
    }
  }, [isBuyNow]);

  const checkoutItems = useMemo(() => {
    return isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cart;
  }, [isBuyNow, buyNowItem, cart]);

  // ==================== STATE ====================
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tỉnh / Phường
  const [provinces, setProvinces] = useState([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [provinceError, setProvinceError] = useState('');
  const [wards, setWards] = useState([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [wardError, setWardError] = useState('');

  // Địa chỉ đã lưu
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // null = đang thêm mới
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    tenNguoiNhan: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    tinhThanh: '',
    phuongXa: '',
    ghiChu: '',
  });

  // ==================== LOAD TỈNH ====================
  useEffect(() => {
    let isMounted = true;

    provinceService
      .getProvinces()
      .then((data) => {
        if (isMounted) setProvinces(data);
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách tỉnh/thành phố:', error);
        if (isMounted) setProvinceError('Không thể tải danh sách tỉnh/thành phố. Vui lòng tải lại trang.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ==================== LOAD PHƯỜNG/XÃ ====================
  useEffect(() => {
    if (!formData.tinhThanh) {
      setWards([]);
      setIsLoadingWards(false);
      setWardError('');
      return undefined;
    }

    let isMounted = true;
    setWards([]);
    setIsLoadingWards(true);
    setWardError('');

    provinceService
      .getWards(formData.tinhThanh)
      .then((data) => {
        if (isMounted) setWards(data);
      })
      .catch((error) => {
        console.error('Lỗi khi tải danh sách phường/xã:', error);
        if (isMounted) setWardError('Không thể tải danh sách phường/xã. Vui lòng chọn lại tỉnh/thành.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.tinhThanh]);

  // ==================== LOAD ĐỊA CHỈ ĐÃ LƯU ====================
  useEffect(() => {
    const activeUser = user || getStoredUser();
    if (!activeUser) {
      setIsAddingNew(true);
      return;
    }

    const userId = activeUser.maNguoiDung ?? activeUser.MaNguoiDung;
    if (!userId) {
      setIsAddingNew(true);
      return;
    }

    setIsLoadingAddresses(true);

    diaChiNguoiDungService
      .getByUser(userId)
      .then((list) => {
        const addresses = Array.isArray(list) ? list : list?.data || [];
        setSavedAddresses(addresses);

        if (addresses.length === 0) {
          // Chưa có địa chỉ nào → hiện form thêm mới
          setIsAddingNew(true);
          setSelectedAddressId(null);
          // Prefill thông tin cơ bản từ user
          setFormData((prev) => ({
            ...prev,
            tenNguoiNhan: activeUser.HoTen ?? activeUser.hoTen ?? prev.tenNguoiNhan,
            soDienThoai: activeUser.SoDienThoai ?? activeUser.soDienThoai ?? prev.soDienThoai,
            email: activeUser.Email ?? activeUser.email ?? prev.email,
          }));
        } else {
          // Có địa chỉ → ưu tiên địa chỉ mặc định
          const defaultAddr = addresses.find((a) => a.laMacDinh || a.LaMacDinh) || addresses[0];
          setSelectedAddressId(defaultAddr.maDiaChi ?? defaultAddr.MaDiaChi);
          setIsAddingNew(false);
          fillFormFromAddress(defaultAddr, activeUser);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải địa chỉ:', err);
        setIsAddingNew(true);
      })
      .finally(() => {
        setIsLoadingAddresses(false);
      });
  }, [user]);

  // ==================== HELPER ====================
  const fillFormFromAddress = (addr, activeUser = null) => {
    const userInfo = activeUser || user || getStoredUser();

    setFormData((prev) => ({
      ...prev,
      tenNguoiNhan: addr.tenNguoiNhan ?? addr.TenNguoiNhan ?? prev.tenNguoiNhan,
      soDienThoai: addr.soDienThoai ?? addr.SoDienThoai ?? prev.soDienThoai,
      email: userInfo?.Email ?? userInfo?.email ?? prev.email,
      // Vì DiaChiChiTiet đã là địa chỉ đầy đủ (số nhà + phường + tỉnh)
      // nên ta đưa vào ô "Số nhà, tên đường" để hiển thị
      diaChi: addr.diaChiChiTiet ?? addr.DiaChiChiTiet ?? '',
      tinhThanh: '',
      phuongXa: '',
      ghiChu: prev.ghiChu,
    }));
  };

  const handleSelectAddress = (addr) => {
    const id = addr.maDiaChi ?? addr.MaDiaChi;
    setSelectedAddressId(id);
    setIsAddingNew(false);
    fillFormFromAddress(addr);
    setNotice({ type: '', message: '' });
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setIsAddingNew(true);

    const activeUser = user || getStoredUser();
    setFormData((prev) => ({
      ...prev,
      tenNguoiNhan: activeUser?.HoTen ?? activeUser?.hoTen ?? '',
      soDienThoai: activeUser?.SoDienThoai ?? activeUser?.soDienThoai ?? '',
      email: activeUser?.Email ?? activeUser?.email ?? prev.email,
      diaChi: '',
      tinhThanh: '',
      phuongXa: '',
    }));
    setNotice({ type: '', message: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.price ?? item.donGia ?? 0) * (item.quantity ?? item.soLuong ?? 1),
    0
  );

  // ==================== SUBMIT ====================
  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: '', message: '' });

    if (!checkoutItems.length) {
      setNotice({ type: 'error', message: 'Không có sản phẩm nào để đặt hàng.' });
      return;
    }

    const activeUser = user || getStoredUser();
    const currentUserId = activeUser
      ? activeUser.maNguoiDung ?? activeUser.MaNguoiDung ?? activeUser.tenDangNhap ?? 'guest'
      : 'guest';
    const isGuest = !activeUser;

    let diaChiHoanChinh = '';

    // ----- Trường hợp chọn địa chỉ đã lưu -----
    if (!isAddingNew && selectedAddressId) {
      const selected = savedAddresses.find(
        (a) => (a.maDiaChi ?? a.MaDiaChi) === selectedAddressId
      );

      if (!selected) {
        setNotice({ type: 'error', message: 'Địa chỉ đã chọn không hợp lệ. Vui lòng chọn lại.' });
        return;
      }

      diaChiHoanChinh = selected.diaChiChiTiet ?? selected.DiaChiChiTiet ?? '';
    }
    // ----- Trường hợp thêm địa chỉ mới -----
    else {
      const selectedProvince = provinces.find(
        (province) => String(province.code) === formData.tinhThanh
      );
      if (!selectedProvince) {
        setNotice({ type: 'error', message: 'Vui lòng chọn tỉnh/thành phố từ danh sách.' });
        return;
      }

      const selectedWard = wards.find((ward) => String(ward.code) === formData.phuongXa);
      if (!selectedWard) {
        setNotice({ type: 'error', message: 'Vui lòng chọn phường/xã từ danh sách.' });
        return;
      }

      if (!formData.diaChi.trim()) {
        setNotice({ type: 'error', message: 'Vui lòng nhập số nhà, tên đường.' });
        return;
      }

      diaChiHoanChinh = `${formData.diaChi.trim()}, ${selectedWard.name}, ${selectedProvince.name}`;
    }

    setIsSubmitting(true);

    try {
      // Chỉ tạo địa chỉ mới khi user đang ở chế độ "Thêm mới" và đã login
      if (!isGuest && isAddingNew) {
        await diaChiNguoiDungService.create({
          maNguoiDung: Number(currentUserId), // Backend đã đổi thành int
          tenNguoiNhan: formData.tenNguoiNhan.trim(),
          soDienThoai: formData.soDienThoai.trim(),
          diaChiChiTiet: diaChiHoanChinh,
          laMacDinh: savedAddresses.length === 0, // Địa chỉ đầu tiên → mặc định
        });
      }

      const payload = {
        maNguoiDung: String(currentUserId),
        tenNguoiNhan: formData.tenNguoiNhan.trim(),
        soDienThoai: formData.soDienThoai.trim(),
        diaChiGiaoHang: diaChiHoanChinh,
        tongTien: subtotal,
        phuongThucThanhToan: paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản ngân hàng',
        ghiChu: formData.ghiChu.trim(),
        chiTietDonHangs: checkoutItems.map((item) => ({
          maSanPham: item.maSanPham ?? item.MaSanPham ?? item.id,
          maBienThe: item.maBienThe ?? item.MaBienThe ?? item.variantId ?? null,
          soLuong: item.quantity ?? item.soLuong ?? 1,
          donGia: item.price ?? item.donGia ?? 0,
        })),
      };

      const res = await donHangService.createDonHang(payload);
      const createdOrder = res?.data || res;

      if (!isBuyNow && typeof clearCart === 'function') {
        clearCart();
      }

      setNotice({
        type: 'success',
        message: `Đặt hàng thành công! Mã đơn hàng của bạn là #${createdOrder?.maDonHang || createdOrder?.MaDonHang || ''}.`,
      });

      setTimeout(() => {
        navigate(isGuest ? '/san-pham' : '/don-hang');
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setNotice({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER ====================
  if (!isBuyNow && loadingCart) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-4 text-sm text-slate-500">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (!checkoutItems.length && !notice.message) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-4 py-16 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-700">
            <ShoppingBag size={27} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Chưa có sản phẩm để thanh toán</h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng chọn sản phẩm để mua ngay hoặc kiểm tra lại giỏ hàng.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
            to="/san-pham"
          >
            <ArrowLeft size={16} /> Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const activeUser = user || getStoredUser();
  const isGuest = !activeUser;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Link className="hover:text-green-700" to="/">
            Trang chủ
          </Link>
          <ChevronRight size={15} />
          {isBuyNow ? (
            <span className="font-semibold text-slate-900">Mua ngay</span>
          ) : (
            <>
              <Link className="hover:text-green-700" to="/gio-hang">
                Giỏ hàng
              </Link>
              <ChevronRight size={15} />
              <span className="font-semibold text-slate-900">Thanh toán</span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {isBuyNow ? 'Mua ngay & Đặt hàng' : 'Thanh toán đơn hàng'}
              </h1>
              {isBuyNow && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Sparkles size={12} /> Mua ngay
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {isBuyNow
                ? 'Hoàn tất thông tin giao hàng cho sản phẩm bạn đã chọn mua ngay.'
                : 'Hoàn tất thông tin giao hàng để chúng tôi xử lý đơn sớm nhất.'}
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
            to={isBuyNow && buyNowItem?.maSanPham ? `/san-pham/${buyNowItem.maSanPham}` : '/gio-hang'}
          >
            <ArrowLeft size={16} /> {isBuyNow ? 'Quay lại sản phẩm' : 'Quay lại giỏ hàng'}
          </Link>
        </div>

        <form className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_390px]" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* ==================== THÔNG TIN NHẬN HÀNG ==================== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-green-700">
                  <MapPin size={20} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">Thông tin nhận hàng</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Chọn hoặc thêm địa chỉ giao hàng</p>
                </div>
              </div>

              {/* ----- Danh sách địa chỉ đã lưu (chỉ hiện khi đã login) ----- */}
              {!isGuest && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Địa chỉ đã lưu</p>
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
                    >
                      <Plus size={14} /> Thêm địa chỉ mới
                    </button>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="animate-spin" size={16} /> Đang tải địa chỉ...
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedAddresses.map((addr) => {
                        const id = addr.maDiaChi ?? addr.MaDiaChi;
                        const isSelected = !isAddingNew && selectedAddressId === id;
                        const isDefault = addr.laMacDinh || addr.LaMacDinh;

                        return (
                          <label
                            key={id}
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              isSelected
                                ? 'border-green-500 bg-green-50/60 ring-2 ring-green-500/10'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleSelectAddress(addr)}
                            />
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 size-4 shrink-0 rounded-full border-2 ${
                                  isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800">
                                  {addr.tenNguoiNhan ?? addr.TenNguoiNhan}
                                  {isDefault && (
                                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                      Mặc định
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {addr.soDienThoai ?? addr.SoDienThoai}
                                </p>
                                <p className="mt-1 text-xs leading-4 text-slate-600 line-clamp-2">
                                  {addr.diaChiChiTiet ?? addr.DiaChiChiTiet}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới bên dưới.
                    </p>
                  )}
                </div>
              )}

              {/* ----- Form nhập thông tin ----- */}
              {/* Luôn hiện form, nhưng khi chọn địa chỉ cũ thì disable một số field */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Họ và tên người nhận
                  <input
                    autoComplete="name"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:bg-slate-50 disabled:text-slate-500"
                    name="tenNguoiNhan"
                    onChange={handleChange}
                    placeholder="Nguyễn Văn An"
                    required
                    value={formData.tenNguoiNhan}
                    disabled={!isAddingNew && !isGuest}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Số điện thoại
                  <input
                    autoComplete="tel"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:bg-slate-50 disabled:text-slate-500"
                    inputMode="tel"
                    name="soDienThoai"
                    onChange={handleChange}
                    placeholder="0912 345 678"
                    required
                    value={formData.soDienThoai}
                    disabled={!isAddingNew && !isGuest}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Địa chỉ email
                  <input
                    autoComplete="email"
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                    name="email"
                    onChange={handleChange}
                    placeholder="ban@email.com"
                    required
                    type="email"
                    value={formData.email}
                  />
                </label>

                {/* Chỉ hiện phần địa chỉ chi tiết + tỉnh/phường khi đang thêm mới hoặc là guest */}
                {(isAddingNew || isGuest) && (
                  <>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                      Số nhà, tên đường
                      <input
                        autoComplete="street-address"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                        name="diaChi"
                        onChange={handleChange}
                        placeholder="Ví dụ: 12 Nguyễn Trãi"
                        required
                        value={formData.diaChi}
                      />
                    </label>

                    <label className="text-sm font-semibold text-slate-700">
                      Tỉnh / Thành phố
                      <select
                        autoComplete="address-level1"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                        name="tinhThanh"
                        onChange={(event) => {
                          setFormData((prev) => ({
                            ...prev,
                            tinhThanh: event.target.value,
                            phuongXa: '',
                          }));
                        }}
                        required
                        value={formData.tinhThanh}
                        disabled={isLoadingProvinces || provinces.length === 0}
                      >
                        <option value="">
                          {isLoadingProvinces ? 'Đang tải tỉnh/thành phố...' : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      {provinceError && (
                        <span className="mt-1 block text-xs font-normal text-red-600" role="alert">
                          {provinceError}
                        </span>
                      )}
                    </label>

                    <label className="text-sm font-semibold text-slate-700">
                      Phường / Xã
                      <select
                        autoComplete="address-level2"
                        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 font-normal outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                        name="phuongXa"
                        onChange={handleChange}
                        required
                        value={formData.phuongXa}
                        disabled={!formData.tinhThanh || isLoadingWards || wards.length === 0}
                      >
                        <option value="">
                          {!formData.tinhThanh
                            ? 'Chọn tỉnh/thành phố trước'
                            : isLoadingWards
                              ? 'Đang tải phường/xã...'
                              : 'Chọn phường/xã'}
                        </option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                      {wardError && (
                        <span className="mt-1 block text-xs font-normal text-red-600" role="alert">
                          {wardError}
                        </span>
                      )}
                    </label>
                  </>
                )}

                {/* Khi chọn địa chỉ cũ → hiện địa chỉ đầy đủ dạng text (readonly) */}
                {!isAddingNew && !isGuest && selectedAddressId && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold text-slate-700">Địa chỉ giao hàng</p>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
                      {formData.diaChi}
                    </div>
                  </div>
                )}

                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Ghi chú giao hàng <span className="font-normal text-slate-400">(không bắt buộc)</span>
                  <textarea
                    className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                    name="ghiChu"
                    onChange={handleChange}
                    placeholder="Ví dụ: giao trong giờ hành chính..."
                    rows="3"
                    value={formData.ghiChu}
                  />
                </label>
              </div>
            </section>

            {/* ==================== VẬN CHUYỂN ==================== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Truck size={20} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">Vận chuyển</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Thời gian giao dự kiến 2–4 ngày</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-white text-green-700">
                    <Truck size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Giao hàng tiêu chuẩn</p>
                    <p className="mt-1 text-xs text-slate-500">Giao tận nơi toàn quốc</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-700">Miễn phí</span>
              </div>
            </section>

            {/* ==================== PHƯƠNG THỨC THANH TOÁN ==================== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                  <WalletCards size={20} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900">Phương thức thanh toán</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Chọn cách thanh toán phù hợp</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'cod',
                    title: 'Thanh toán khi nhận hàng',
                    description: 'COD — trả tiền mặt khi nhận',
                    icon: Truck,
                  },
                  {
                    id: 'bank',
                    title: 'Chuyển khoản ngân hàng',
                    description: 'Quét mã QR hoặc chuyển khoản',
                    icon: CreditCard,
                  },
                ].map(({ id, title, description, icon: Icon }) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      paymentMethod === id
                        ? 'border-green-500 bg-green-50/50 ring-2 ring-green-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    key={id}
                  >
                    <input
                      checked={paymentMethod === id}
                      className="mt-1 accent-green-700"
                      name="payment"
                      onChange={() => setPaymentMethod(id)}
                      type="radio"
                      value={id}
                    />
                    <Icon className={paymentMethod === id ? 'text-green-700' : 'text-slate-400'} size={19} />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* ==================== SIDEBAR ĐƠN HÀNG ==================== */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                {isBuyNow ? 'Sản phẩm mua ngay' : 'Đơn hàng của bạn'}
              </h2>
              {isBuyNow ? (
                <Link
                  className="text-xs font-semibold text-green-700 hover:underline"
                  to={buyNowItem?.maSanPham ? `/san-pham/${buyNowItem.maSanPham}` : '/san-pham'}
                >
                  Xem sản phẩm
                </Link>
              ) : (
                <Link className="text-xs font-semibold text-green-700 hover:underline" to="/gio-hang">
                  Chỉnh sửa
                </Link>
              )}
            </div>

            <div className="mt-5 max-h-72 space-y-4 overflow-auto pr-1">
              {checkoutItems.map((item) => (
                <div className="flex gap-3" key={item.id || item.maSanPham}>
                  <div className="relative size-16 shrink-0">
                    <img
                      alt={item.name || item.tenSanPham}
                      className="size-full rounded-lg bg-slate-100 object-cover"
                      src={getProductImageUrl(item.image || item.hinhAnh)}
                      onError={handleProductImageError}
                    />
                    <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                      {item.quantity ?? item.soLuong ?? 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                      {item.name || item.tenSanPham}
                    </p>
                    {item.variantName && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Phiên bản: {item.variantName}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatPrice(
                        (item.price ?? item.donGia ?? 0) * (item.quantity ?? item.soLuong ?? 1)
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-5 border-t border-dashed border-slate-200" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  Tạm tính (
                  {checkoutItems.reduce((acc, i) => acc + (i.quantity ?? i.soLuong ?? 1), 0)} sản phẩm)
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-green-700">Miễn phí</span>
              </div>
            </div>
            <div className="my-5 border-t border-slate-100" />
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-slate-700">Tổng thanh toán</span>
              <span className="text-xl font-black text-green-700">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-2 text-right text-xs text-slate-400">Đã bao gồm thuế VAT (nếu có)</p>

            {notice.message && (
              <p
                aria-live="polite"
                className={`mt-4 rounded-lg border p-3 text-xs leading-5 ${
                  notice.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {notice.message}
              </p>
            )}

            <button
              disabled={
                isSubmitting ||
                isLoadingProvinces ||
                (isAddingNew && provinces.length === 0) ||
                isLoadingAddresses
              }
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={17} /> Đang xử lý...
                </>
              ) : (
                <>
                  Đặt hàng ngay <Check size={17} />
                </>
              )}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck size={14} /> Thông tin của bạn được bảo mật tuyệt đối
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}