import { useCallback, useEffect, useRef, useState } from 'react';
import { Edit3, Image as ImageIcon, Layers, LoaderCircle, Package, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';
import { PageHeading, SearchField } from './AdminComponents.jsx';
import { formatCurrency } from './adminData.js';
import { productService } from '../../services/productService.js';
import { getProductImageUrl, handleProductImageError } from '../../services/imageUtils.js';

// CÁC Ô THÔNG SỐ CÓ SẴN ĐỂ NGHƯỜI DÙNG BẤM CHỌN
const PRESET_OPTIONS = {
  rams: ['8GB RAM', '16GB RAM', '32GB RAM', '64GB RAM'],
  ssds: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
  colors: ['Màu Đen', 'Màu Bạc', 'Màu Xám', 'Màu Trắng', 'Màu Xanh'],
};

function ProductModal({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [quickAddingCategory, setQuickAddingCategory] = useState(false);
  const [quickAddingBrand, setQuickAddingBrand] = useState(false);

  // Builder để thêm từng biến thể cụ thể (không dùng Cartesian product)
  const [builder, setBuilder] = useState({
    ram: '',
    ssd: '',
    color: '',
    customName: '',
  });
  const [manualVariant, setManualVariant] = useState({ name: '', price: '', stock: '' });

  const [formData, setFormData] = useState({
    tenSanPham: '',
    gia: '',
    soLuong: '',
    maDanhMuc: '',
    maThuongHieu: '',
    hinhAnh: '',
    thongSoKyThuat: '',
    moTa: '',
    danhSachHinhAnh: [],
    danhSachBienThe: [],
  });

  // Tải danh mục & thương hiệu
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          productService.getCategories(),
          productService.getBrands(),
        ]);

        const catList = Array.isArray(catRes.data || catRes) ? (catRes.data || catRes) : [];
        const brandList = Array.isArray(brandRes.data || brandRes) ? (brandRes.data || brandRes) : [];

        setCategories(catList);
        setBrands(brandList);

        if (!initialData) {
          setFormData((prev) => ({
            ...prev,
            maDanhMuc: prev.maDanhMuc || (catList[0]?.maDanhMuc ?? catList[0]?.MaDanhMuc ?? ''),
            maThuongHieu: prev.maThuongHieu || (brandList[0]?.maThuongHieu ?? brandList[0]?.MaThuongHieu ?? ''),
          }));
        }
      } catch (err) {
        console.error('Lỗi nạp danh mục/thương hiệu:', err);
      }
    };

    fetchOptions();
  }, [isOpen, initialData]);

  // Nạp thông tin sản phẩm khi mở modal
  useEffect(() => {
    if (initialData) {
      setFormData({
        tenSanPham: initialData.tenSanPham || '',
        gia: initialData.gia || '',
        soLuong: initialData.soLuong ?? initialData.stock ?? 0,
        maDanhMuc: initialData.maDanhMuc || '',
        maThuongHieu: initialData.maThuongHieu || '',
        hinhAnh: initialData.hinhAnh || '',
        thongSoKyThuat: initialData.thongSoKyThuat || '',
        moTa: initialData.moTa || '',
        danhSachHinhAnh: (initialData.hinhAnhSanPhams || []).map((img, idx) => ({
          duongDanAnh: img.duongDanAnh || img.DuongDanAnh || '',
          laAnhChinh: idx === 0,
          thuTuHienThi: idx + 1,
        })),
        danhSachBienThe: (initialData.bienTheSanPhams || []).map((b) => ({
          tenBienThe: b.tenBienThe || b.TenBienThe || '',
          sku: b.sku || b.SKU || '',
          gia: b.gia || b.Gia || 0,
          soLuongTon: b.soLuongTon ?? b.SoLuongTon ?? 0,
        })),
      });
    } else {
      setFormData({
        tenSanPham: '',
        gia: '',
        soLuong: '',
        maDanhMuc: categories[0]?.maDanhMuc ?? categories[0]?.MaDanhMuc ?? '',
        maThuongHieu: brands[0]?.maThuongHieu ?? brands[0]?.MaThuongHieu ?? '',
        hinhAnh: '',
        thongSoKyThuat: '',
        moTa: '',
        danhSachHinhAnh: [],
        danhSachBienThe: [],
      });
    }

    // Reset builder mỗi khi mở modal
    setBuilder({ ram: '', ssd: '', color: '', customName: '' });
    setManualVariant({ name: '', price: '', stock: '' });
  }, [initialData, isOpen, categories, brands]);

  if (!isOpen) return null;

  // Xây tên biến thể từ builder
  const buildVariantName = () => {
    if (builder.customName.trim()) return builder.customName.trim();
    const parts = [builder.ram, builder.ssd, builder.color].filter(Boolean);
    return parts.join(' - ') || '';
  };

  const setBuilderField = (field, value) => {
    setBuilder((prev) => ({ ...prev, [field]: value }));
  };

  // Thêm một biến thể cụ thể
  const handleAddVariant = () => {
    const name = buildVariantName();
    if (!name) {
      alert('Vui lòng chọn ít nhất một thuộc tính hoặc nhập tên biến thể.');
      return;
    }

    if (formData.danhSachBienThe.some((v) => v.tenBienThe === name)) {
      alert('Biến thể này đã tồn tại.');
      return;
    }

    const basePrice = formData.gia ? Number(formData.gia) : 0;
    const baseStock = formData.soLuong ? Number(formData.soLuong) : 10;

    const newVariant = {
      tenBienThe: name,
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      gia: basePrice,
      soLuongTon: baseStock,
    };

    setFormData((prev) => ({
      ...prev,
      danhSachBienThe: [...prev.danhSachBienThe, newVariant],
    }));

    // Reset builder sau khi thêm
    setBuilder({ ram: '', ssd: '', color: '', customName: '' });
  };

  const handleAddManualVariant = () => {
    const name = manualVariant.name.trim();
    if (!name) {
      alert('Vui lòng nhập tên hoặc cấu hình biến thể.');
      return;
    }

    if (formData.danhSachBienThe.some((variant) => variant.tenBienThe.trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      alert('Biến thể này đã tồn tại.');
      return;
    }

    const basePrice = formData.gia ? Number(formData.gia) : 0;
    const baseStock = formData.soLuong ? Number(formData.soLuong) : 0;
    setFormData((prev) => ({
      ...prev,
      danhSachBienThe: [...prev.danhSachBienThe, {
        tenBienThe: name,
        sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        gia: manualVariant.price === '' ? basePrice : Number(manualVariant.price),
        soLuongTon: manualVariant.stock === '' ? baseStock : Number(manualVariant.stock),
      }],
    }));
    setManualVariant({ name: '', price: '', stock: '' });
  };

  const handleUpdateVariant = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.danhSachBienThe];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, danhSachBienThe: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      danhSachBienThe: prev.danhSachBienThe.filter((_, i) => i !== index),
    }));
  };

  // Upload hình ảnh
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const res = await productService.uploadImages(files);
      const uploadedUrls = res.data?.urls || res.urls || [];

      const newImages = uploadedUrls.map((url, idx) => ({
        duongDanAnh: url,
        laAnhChinh: false,
        thuTuHienThi: formData.danhSachHinhAnh.length + idx + 1,
      }));

      setFormData((prev) => {
        const updatedList = [...prev.danhSachHinhAnh, ...newImages];
        const reindexed = updatedList.map((item, index) => ({
          ...item,
          laAnhChinh: index === 0,
          thuTuHienThi: index + 1,
        }));

        return {
          ...prev,
          hinhAnh: reindexed.length > 0 ? reindexed[0].duongDanAnh : '',
          danhSachHinhAnh: reindexed,
        };
      });
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
      alert('Không thể tải hình ảnh lên server.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => {
      const filtered = prev.danhSachHinhAnh.filter((_, idx) => idx !== indexToRemove);
      const reindexed = filtered.map((item, index) => ({
        ...item,
        laAnhChinh: index === 0,
        thuTuHienThi: index + 1,
      }));

      return {
        ...prev,
        hinhAnh: reindexed.length > 0 ? reindexed[0].duongDanAnh : '',
        danhSachHinhAnh: reindexed,
      };
    });
  };

  const handleQuickAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      setQuickAddingCategory(true);
      const res = await productService.createCategory({ tenDanhMuc: name });
      const created = res.data || res;
      const id = created.maDanhMuc ?? created.MaDanhMuc;
      setCategories((prev) => [...prev, created]);
      if (id) setFormData((prev) => ({ ...prev, maDanhMuc: String(id) }));
      setNewCategoryName('');
    } catch (err) {
      console.error('Lỗi thêm danh mục:', err);
      alert(err.response?.data?.message || 'Không thể thêm danh mục mới.');
    } finally {
      setQuickAddingCategory(false);
    }
  };

  const handleQuickAddBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    try {
      setQuickAddingBrand(true);
      const res = await productService.createBrand({ tenThuongHieu: name });
      const created = res.data || res;
      const id = created.maThuongHieu ?? created.MaThuongHieu;
      setBrands((prev) => [...prev, created]);
      if (id) setFormData((prev) => ({ ...prev, maThuongHieu: String(id) }));
      setNewBrandName('');
    } catch (err) {
      console.error('Lỗi thêm thương hiệu:', err);
      alert(err.response?.data?.message || 'Không thể thêm thương hiệu mới.');
    } finally {
      setQuickAddingBrand(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      gia: Number(formData.gia),
      soLuong: Number(formData.soLuong),
      maDanhMuc: Number(formData.maDanhMuc),
      maThuongHieu: Number(formData.maThuongHieu),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? `Chỉnh sửa sản phẩm #${initialData.maSanPham}` : 'Thêm sản phẩm mới'}
          </h3>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          {/* Tên sản phẩm */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Tên sản phẩm *</label>
            <input
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, tenSanPham: e.target.value })}
              placeholder="VD: Laptop Asus ROG Strix G16..."
              value={formData.tenSanPham}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Giá bán (VNĐ) *</label>
            <input
              required
              min="0"
              type="number"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, gia: e.target.value })}
              placeholder="VD: 25000000"
              value={formData.gia}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Số lượng tồn kho tổng *</label>
            <input
              required
              min="0"
              type="number"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, soLuong: e.target.value })}
              placeholder="VD: 50"
              value={formData.soLuong}
            />
          </div>

          {/* Danh mục & Thương hiệu */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Danh mục *</label>
            <select
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, maDanhMuc: e.target.value })}
              value={formData.maDanhMuc}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => {
                const id = cat.maDanhMuc ?? cat.MaDanhMuc;
                const name = cat.tenDanhMuc ?? cat.TenDanhMuc;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-green-500"
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddCategory();
                  }
                }}
                placeholder="Thêm danh mục nhanh..."
                value={newCategoryName}
              />
              <button
                className="rounded-xl border border-green-200 px-3 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-50"
                disabled={quickAddingCategory}
                onClick={handleQuickAddCategory}
                type="button"
              >
                {quickAddingCategory ? '...' : '+ Thêm'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Thương hiệu *</label>
            <select
              required
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, maThuongHieu: e.target.value })}
              value={formData.maThuongHieu}
            >
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map((brand) => {
                const id = brand.maThuongHieu ?? brand.MaThuongHieu;
                const name = brand.tenThuongHieu ?? brand.TenThuongHieu;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-green-500"
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddBrand();
                  }
                }}
                placeholder="Thêm thương hiệu nhanh..."
                value={newBrandName}
              />
              <button
                className="rounded-xl border border-green-200 px-3 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-50"
                disabled={quickAddingBrand}
                onClick={handleQuickAddBrand}
                type="button"
              >
                {quickAddingBrand ? '...' : '+ Thêm'}
              </button>
            </div>
          </div>

          {/* ========== PHẦN THÊM BIẾN THỂ (CẢI TIẾN) ========== */}
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <h4 className="mb-1 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Thêm biến thể sản phẩm
            </h4>
            <p className="mb-4 text-[10px] text-slate-500">
              Chọn các thuộc tính bên dưới rồi bấm “Thêm biến thể”. Bạn có thể thêm từng tổ hợp riêng biệt (không bắt buộc tạo tất cả tổ hợp).
            </p>

            {/* Builder form */}
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">RAM</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold outline-none focus:border-green-500"
                  value={builder.ram}
                  onChange={(e) => setBuilderField('ram', e.target.value)}
                >
                  <option value="">-- Chọn RAM --</option>
                  {PRESET_OPTIONS.rams.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">SSD</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold outline-none focus:border-green-500"
                  value={builder.ssd}
                  onChange={(e) => setBuilderField('ssd', e.target.value)}
                >
                  <option value="">-- Chọn SSD --</option>
                  {PRESET_OPTIONS.ssds.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Màu sắc</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold outline-none focus:border-green-500"
                  value={builder.color}
                  onChange={(e) => setBuilderField('color', e.target.value)}
                >
                  <option value="">-- Chọn màu --</option>
                  {PRESET_OPTIONS.colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                  Tên tùy chỉnh (tùy chọn)
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold outline-none focus:border-green-500"
                  placeholder="VD: Bản Gaming 2024"
                  value={builder.customName}
                  onChange={(e) => setBuilderField('customName', e.target.value)}
                />
              </div>
            </div>

            {/* Quick chips */}
            <div className="mb-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="mr-1 self-center text-[10px] font-bold text-slate-500">RAM nhanh:</span>
                {PRESET_OPTIONS.rams.map((ram) => (
                  <button
                    key={ram}
                    type="button"
                    onClick={() => setBuilderField('ram', ram)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      builder.ram === ram
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-green-400'
                    }`}
                  >
                    {ram}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="mr-1 self-center text-[10px] font-bold text-slate-500">SSD nhanh:</span>
                {PRESET_OPTIONS.ssds.map((ssd) => (
                  <button
                    key={ssd}
                    type="button"
                    onClick={() => setBuilderField('ssd', ssd)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      builder.ssd === ssd
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {ssd}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="mr-1 self-center text-[10px] font-bold text-slate-500">Màu nhanh:</span>
                {PRESET_OPTIONS.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBuilderField('color', color)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      builder.color === color
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview + Add button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[200px] flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {buildVariantName() || <span className="text-slate-400">Chưa chọn thuộc tính…</span>}
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700"
              >
                + Thêm biến thể
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <h5 className="text-xs font-extrabold text-slate-900">Biến thể khác</h5>
              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                Thêm biến thể chưa có sẵn
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">Tên / cấu hình biến thể *</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-green-500"
                    onChange={(e) => setManualVariant((prev) => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualVariant();
                      }
                    }}
                    placeholder="VD: RX 570 - RAM 4GB - SSD 128GB"
                    value={manualVariant.name}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">Giá bán (VNĐ)</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-green-500"
                    min="0"
                    onChange={(e) => setManualVariant((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder={formData.gia ? `Mặc định ${Number(formData.gia).toLocaleString('vi-VN')}` : 'Giá Bán'}
                    type="number"
                    value={manualVariant.price}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">Tồn kho</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-green-500"
                    min="0"
                    onChange={(e) => setManualVariant((prev) => ({ ...prev, stock: e.target.value }))}
                    placeholder={formData.soLuong !== '' ? `Mặc định ${formData.soLuong}` : 'Số lượng tồn'}
                    type="number"
                    value={manualVariant.stock}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                  onClick={handleAddManualVariant}
                  type="button"
                >
                  + Thêm biến thể
                </button>
              </div>
            </div>
          </div>

          {/* ========== DANH SÁCH BIẾN THỂ ĐÃ THÊM ========== */}
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Danh sách biến thể ({formData.danhSachBienThe.length})
            </h4>

            {formData.danhSachBienThe.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Chưa có biến thể nào. Hãy chọn thuộc tính ở trên rồi bấm “Thêm biến thể”.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-12 gap-2 px-2 text-[10px] font-extrabold uppercase text-slate-400 sm:grid">
                  <span className="col-span-6">Tên biến thể</span>
                  <span className="col-span-3">Giá bán (VNĐ)</span>
                  <span className="col-span-2">Tồn kho</span>
                  <span className="col-span-1 text-right">Xóa</span>
                </div>

                {formData.danhSachBienThe.map((variant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-6">
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-green-500"
                        value={variant.tenBienThe}
                        onChange={(e) => handleUpdateVariant(index, 'tenBienThe', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        required
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-green-700 focus:border-green-500 focus:outline-none"
                        value={variant.gia}
                        onChange={(e) => handleUpdateVariant(index, 'gia', Number(e.target.value))}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        required
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 focus:border-green-500 focus:outline-none"
                        value={variant.soLuongTon}
                        onChange={(e) => handleUpdateVariant(index, 'soLuongTon', Number(e.target.value))}
                      />
                    </div>

                    <div className="flex justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Xóa biến thể"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HÀNG HÌNH ẢNH */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Hình ảnh sản phẩm * (Ảnh đầu tiên là Ảnh chính)
              </label>
              <span className="text-[10px] text-slate-400">Tự động chọn ảnh #1 làm đại diện</span>
            </div>

            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              multiple
              onChange={handleFileSelect}
              type="file"
            />

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-3">
              {formData.danhSachHinhAnh.map((img, idx) => (
                <div
                  className="group relative size-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  key={idx}
                >
                  <img
                    alt={`Product ${idx}`}
                    className="size-full object-cover"
                    src={getProductImageUrl(img.duongDanAnh)}
                    onError={handleProductImageError}
                  />

                  {idx === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-green-600 py-0.5 text-center text-[9px] font-black text-white">
                      Ảnh chính
                    </span>
                  )}

                  <button
                    className="absolute right-1 top-1 rounded-full bg-red-600/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleRemoveImage(idx)}
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <button
                disabled={uploading}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 transition-colors hover:border-green-500 hover:text-green-600 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {uploading ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <>
                    <Upload size={18} />
                    <span className="text-[10px] font-bold">Tải ảnh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Thông số kỹ thuật chung / Mô tả
            </label>
            <textarea
              rows="3"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-green-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              placeholder="Mô tả hoặc thông số chung của sản phẩm..."
              value={formData.moTa}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Hủy
            </button>
            <button
              disabled={isSubmitting || uploading}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50"
              type="submit"
            >
              {isSubmitting ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getSanPhams({
        pageNumber: 1,
        pageSize: 100,
        search: query.trim(),
        includeInactive: true,
      });

      const data = res.data || res;
      const itemsList = data.items || data.data || (Array.isArray(data) ? data : []);

      setProducts(itemsList);
      setTotalItems(data.totalItems || itemsList.length);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setError('Không thể kết nối với máy chủ API. Vui lòng kiểm tra lại backend!');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) => {
    const isTrangThai = p.trangThai ?? p.TrangThai ?? p.isActive ?? p.IsActive ?? true;
    const ngayXoaVal = p.ngayXoa ?? p.NgayXoa ?? null;
    const isDeleted = isTrangThai === false || ngayXoaVal !== null;

    if (statusFilter === 'Đang bán') return !isDeleted;
    if (statusFilter === 'Đã xóa') return isDeleted;
    return true;
  });

  const activeCount = products.filter(
    (p) => (p.trangThai ?? p.isActive ?? true) && (p.ngayXoa ?? null) === null
  ).length;
  const deletedCount = products.length - activeCount;

  const handleSaveProduct = async (data) => {
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await productService.updateSanPham(editingProduct.maSanPham, data);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await productService.createSanPham(data);
        alert('Thêm sản phẩm thành công!');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi lưu sản phẩm:', err);
      alert('Không thể lưu thông tin sản phẩm. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm #${id}?`)) return;
    try {
      await productService.softDeleteSanPham(id);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      alert('Không thể xóa sản phẩm.');
    }
  };

  const handleRestoreProduct = async (id) => {
    try {
      await productService.restoreSanPham(id);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi khôi phục sản phẩm:', err);
      alert('Không thể khôi phục sản phẩm.');
    }
  };

  return (
    <>
      <PageHeading
        description="Theo dõi danh sách, giá bán, số lượng tồn kho và quản lý trạng thái sản phẩm."
        eyebrow="Danh mục cửa hàng"
        title="Quản lý sản phẩm"
      />

      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng sản phẩm', value: totalItems, icon: Package, style: 'bg-blue-50 text-blue-700' },
          { label: 'Đang bán', value: activeCount, icon: Package, style: 'bg-green-50 text-green-700' },
          { label: 'Đã xóa', value: deletedCount, icon: Trash2, style: 'bg-red-50 text-red-700' },
        ].map(({ label, value, icon: Icon, style }) => (
          <article
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <span className={`grid size-11 place-items-center rounded-xl ${style}`}>
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Danh sách sản phẩm từ CSDL</h2>
            <p className="mt-1 text-xs text-slate-500">
              Thêm mới, chỉnh sửa thông tin hoặc xóa/khôi phục sản phẩm
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchField
              label="Tìm sản phẩm"
              onChange={setQuery}
              placeholder="Tên hoặc mô tả..."
              value={query}
            />

            <select
              aria-label="Lọc trạng thái"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-green-500"
              onChange={(e) => setStatusFilter(e.target.value)}
              value={statusFilter}
            >
              <option>Tất cả</option>
              <option>Đang bán</option>
              <option>Đã xóa</option>
            </select>

            <button
              className="flex h-10 items-center gap-1.5 rounded-xl bg-green-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-green-700"
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              type="button"
            >
              <Plus size={16} />
              Thêm sản phẩm
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-8 text-center text-xs font-semibold text-red-500">{error}</div>
          ) : (
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Mã & Tên sản phẩm</th>
                  <th className="px-4 py-3">Danh mục / Thương hiệu</th>
                  <th className="px-4 py-3">Giá bán</th>
                  <th className="px-4 py-3">Tồn kho</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-10 text-center text-xs text-slate-400" colSpan={6}>
                      Đang tải dữ liệu từ server...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      <Search className="mx-auto mb-2 text-slate-400" size={20} />
                      Không tìm thấy sản phẩm phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stock = p.soLuong ?? p.stock ?? 0;
                    const isTrangThai = p.trangThai ?? p.TrangThai ?? p.isActive ?? p.IsActive ?? true;
                    const ngayXoaVal = p.ngayXoa ?? p.NgayXoa ?? null;
                    const isDeleted = isTrangThai === false || ngayXoaVal !== null;
                    const variantCount = p.bienTheSanPhams?.length || 0;

                    return (
                      <tr
                        className={`text-xs hover:bg-slate-50/70 ${isDeleted ? 'bg-slate-50/50 opacity-60' : ''}`}
                        key={p.maSanPham}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.hinhAnh ? (
                              <img
                                alt={p.tenSanPham}
                                className="size-10 rounded-lg border border-slate-100 object-cover"
                                src={getProductImageUrl(p.hinhAnh)}
                                onError={handleProductImageError}
                              />
                            ) : (
                              <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-400">
                                <ImageIcon size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800">{p.tenSanPham}</p>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                                <span>Mã SP: #{p.maSanPham}</span>
                                {variantCount > 0 && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 font-bold text-blue-600">
                                    <Layers size={10} /> {variantCount} biến thể
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <p className="font-semibold">{p.tenDanhMuc || 'Chưa phân loại'}</p>
                          <p className="text-[10px] text-slate-400">{p.tenThuongHieu || 'Chưa có TH'}</p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">
                          {formatCurrency(p.gia)}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-700">{stock}</td>

                        <td className="px-4 py-4">
                          {isDeleted ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                              Đã xóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                              Đang bán
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsModalOpen(true);
                              }}
                              title="Chỉnh sửa sản phẩm"
                              type="button"
                            >
                              <Edit3 size={16} />
                            </button>

                            {isDeleted ? (
                              <button
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleRestoreProduct(p.maSanPham)}
                                title="Khôi phục sản phẩm"
                                type="button"
                              >
                                <RotateCcw size={16} />
                              </button>
                            ) : (
                              <button
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDeleteProduct(p.maSanPham)}
                                title="Xóa mềm sản phẩm"
                                type="button"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
          Hiển thị {filteredProducts.length} / {totalItems} sản phẩm từ hệ thống
        </div>
      </section>

      <ProductModal
        initialData={editingProduct}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
      />
    </>
  );
}