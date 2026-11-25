import { useEffect, useState } from 'react';
import { LoaderCircle, Save, Store, Upload } from 'lucide-react';
import { PageHeading } from './AdminComponents.jsx';
import { thongTinCuaHangService } from '../../services/thongTinCuaHangService.js';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';
import { API_BASE_URL } from '../../api/axiosClient.js';

const API_ORIGIN = new URL(API_BASE_URL).origin;

const emptyForm = {
  tenCuaHang: '',
  hotline: '',
  email: '',
  diaChi: '',
  gioMoCua: '',
  fanpageUrl: '',
  mapEmbedUrl: '',
  logo: '',
  qrThanhToan: '',
  tenNganHang: '',
  tenChuTaiKhoan: '',
  soTaiKhoan: '',
};

const getField = (record, camelCase, pascalCase) => record?.[camelCase] ?? record?.[pascalCase] ?? '';

const getRecord = (response) => response?.data?.data ?? response?.data ?? response;

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Không thể lưu thông tin cửa hàng.';

export default function AdminPagesPage() {
  const { refreshStoreInfo } = useStoreInfo();
  const [form, setForm] = useState(emptyForm);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    let active = true;

    thongTinCuaHangService.getPrimary()
      .then((response) => {
        const record = getRecord(response);
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          throw new Error('Dữ liệu thông tin cửa hàng không hợp lệ.');
        }

        if (active) {
          setRecordId(getField(record, 'id', 'Id') || null);
          setForm({
            tenCuaHang: getField(record, 'tenCuaHang', 'TenCuaHang'),
            hotline: getField(record, 'hotline', 'Hotline'),
            email: getField(record, 'email', 'Email'),
            diaChi: getField(record, 'diaChi', 'DiaChi'),
            gioMoCua: getField(record, 'gioMoCua', 'GioMoCua'),
            fanpageUrl: getField(record, 'fanpageUrl', 'FanpageUrl'),
            mapEmbedUrl: getField(record, 'mapEmbedUrl', 'MapEmbedUrl'),
            logo: getField(record, 'logo', 'Logo'),
            qrThanhToan: getField(record, 'qrThanhToan', 'QrThanhToan'),
            tenNganHang: getField(record, 'tenNganHang', 'TenNganHang'),
            tenChuTaiKhoan: getField(record, 'tenChuTaiKhoan', 'TenChuTaiKhoan'),
            soTaiKhoan: getField(record, 'soTaiKhoan', 'SoTaiKhoan'),
          });
        }
      })
      .catch((requestError) => {
        if (!active || requestError.response?.status === 404) return;
        console.error('Lỗi khi tải thông tin cửa hàng quản trị:', requestError);
        setLoadError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setActionError('');
    setSuccess('');
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setSuccess('');

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    try {
      const response = recordId
        ? await thongTinCuaHangService.update(recordId, payload)
        : await thongTinCuaHangService.create(payload);
      const savedRecord = getRecord(response);
      const savedId = getField(savedRecord, 'id', 'Id');
      if (savedId) setRecordId(savedId);
      if (savedId && qrFile) {
        setUploadingQr(true);
        const qrResponse = await thongTinCuaHangService.uploadQr(savedId, qrFile);
        const qrRecord = getRecord(qrResponse);
        const qrUrl = getField(qrRecord, 'qrThanhToan', 'QrThanhToan');
        if (qrUrl) setForm((current) => ({ ...current, qrThanhToan: qrUrl }));
        setQrFile(null);
      }
      const updatedStoreInfo = await refreshStoreInfo();
      if (updatedStoreInfo) {
        setSuccess('Đã lưu thông tin cửa hàng.');
      } else {
        setActionError('Thông tin đã lưu nhưng chưa thể cập nhật layout. Vui lòng kiểm tra kết nối API.');
      }
    } catch (requestError) {
      console.error('Lỗi khi lưu thông tin cửa hàng:', requestError);
      setActionError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
      setUploadingQr(false);
    }
  };

  const inputClassName = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500 disabled:bg-slate-50';
  const fields = [
    { name: 'tenCuaHang', label: 'Tên cửa hàng', required: true },
    { name: 'hotline', label: 'Hotline', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'diaChi', label: 'Địa chỉ' },
    { name: 'gioMoCua', label: 'Giờ mở cửa' },
    { name: 'logo', label: 'Đường dẫn logo' },
    { name: 'tenNganHang', label: 'Tên ngân hàng' },
    { name: 'tenChuTaiKhoan', label: 'Tên chủ tài khoản' },
    { name: 'soTaiKhoan', label: 'Số tài khoản' },
    { name: 'fanpageUrl', label: 'Đường dẫn fanpage', type: 'url' },
    { name: 'mapEmbedUrl', label: 'Đường dẫn nhúng bản đồ', type: 'url' },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Thiết lập website"
        title="Thông tin cửa hàng"
        description="Cập nhật thông tin liên hệ và hiển thị trên website."
      />
      {loadError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{loadError}</p>}
      {actionError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{actionError}</p>}
      {success && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{success}</p>}

      <form className="max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" onSubmit={save}>
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-green-700"><Store size={19} /></span>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Thiết lập thông tin</h2>
            <p className="mt-1 text-xs text-slate-500">Thông tin này được sử dụng ở đầu trang, cuối trang và trang liên hệ.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={17} />Đang tải thông tin cửa hàng...</div>
        ) : (
          <>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {fields.map(({ name, label, type = 'text', required = false }) => (
                <div className={name === 'diaChi' || name === 'mapEmbedUrl' ? 'sm:col-span-2' : ''} key={name}>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor={name}>{label}{required ? ' *' : ''}</label>
                  <input
                    className={inputClassName}
                    disabled={Boolean(loadError) || saving}
                    id={name}
                    name={name}
                    onChange={updateField}
                    required={required}
                    type={type}
                    value={form[name]}
                  />
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-900">Thanh toán chuyển khoản</h3>
                <p className="mt-1 text-xs text-slate-500">Cập nhật mã QR và tài khoản duy nhất dùng cho thanh toán của cửa hàng.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="grid min-h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {form.qrThanhToan ? (
                    <img
                      alt="QR thanh toán hiện tại"
                      className="max-h-44 max-w-full object-contain p-2"
                      src={form.qrThanhToan.startsWith('http') ? form.qrThanhToan : `${API_ORIGIN}${form.qrThanhToan}`}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Chưa có mã QR</span>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="qrThanhToanFile">Tải mã QR mới</label>
                  <input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-green-800"
                    disabled={saving || uploadingQr}
                    id="qrThanhToanFile"
                    onChange={(event) => setQrFile(event.target.files?.[0] || null)}
                    type="file"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">JPG, PNG hoặc WebP; tối đa 5 MB.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={Boolean(loadError) || saving}
                type="submit"
              >
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </>
        )}
      </form>
    </>
  );
}
