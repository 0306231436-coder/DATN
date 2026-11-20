import { useState } from 'react';
import { Clock3, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

const isSafeWebUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const isSafeMapEmbedUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/embed');
  } catch {
    return false;
  }
};

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { storeInfo, loading, error } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'cửa hàng';

  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto grid min-h-[65vh] max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[.8fr_1.2fr] lg:px-8">
      <section>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">Chúng tôi luôn sẵn sàng</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Liên hệ {storeName}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">Bạn cần tư vấn cấu hình, thông tin sản phẩm hoặc hỗ trợ khác? Hãy gửi lời nhắn, đội ngũ {storeName} sẽ liên hệ với bạn.</p>
        <div className="mt-8 space-y-5">
          {error && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800" role="alert">{error}</p>}
          {loading && !storeInfo && <p className="text-sm text-slate-500" role="status">Đang tải thông tin cửa hàng...</p>}
          {!loading && !error && storeInfo && !storeInfo.hotline && !storeInfo.email && !storeInfo.address && !storeInfo.openingHours && (
            <p className="text-sm text-slate-500">Thông tin liên hệ chưa được cập nhật.</p>
          )}
          {storeInfo?.hotline && <a className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:border-green-200" href={`tel:${storeInfo.hotline.replace(/[^\d+]/g, '')}`}><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Phone size={20} /></span><span><strong className="block text-sm text-slate-800">Hotline</strong><small className="mt-1 block text-sm text-slate-500">{storeInfo.hotline}</small></span></a>}
          {storeInfo?.email && <a className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:border-green-200" href={`mailto:${storeInfo.email}`}><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Mail size={20} /></span><span><strong className="block text-sm text-slate-800">Email</strong><small className="mt-1 block text-sm text-slate-500">{storeInfo.email}</small></span></a>}
          {storeInfo?.address && <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4"><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><MapPin size={20} /></span><span><strong className="block text-sm text-slate-800">Địa chỉ</strong><small className="mt-1 block text-sm text-slate-500">{storeInfo.address}</small></span></div>}
          {storeInfo?.openingHours && <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4"><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Clock3 size={20} /></span><span><strong className="block text-sm text-slate-800">Giờ mở cửa</strong><small className="mt-1 block text-sm text-slate-500">{storeInfo.openingHours}</small></span></div>}
          {storeInfo?.fanpageUrl && isSafeWebUrl(storeInfo.fanpageUrl) && <a className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-900" href={storeInfo.fanpageUrl} rel="noreferrer" target="_blank"><ExternalLink size={16} /> Fanpage cửa hàng</a>}
          {storeInfo?.fanpageUrl && !isSafeWebUrl(storeInfo.fanpageUrl) && <p className="text-sm text-amber-700" role="status">Liên kết fanpage cửa hàng không hợp lệ.</p>}
          {storeInfo?.mapEmbedUrl && isSafeMapEmbedUrl(storeInfo.mapEmbedUrl) && (
            <iframe
              allowFullScreen
              className="h-64 w-full rounded-xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={storeInfo.mapEmbedUrl}
              title={`Bản đồ ${storeName}`}
            />
          )}
          {storeInfo?.mapEmbedUrl && !isSafeMapEmbedUrl(storeInfo.mapEmbedUrl) && (
            <p className="text-sm text-amber-700" role="status">Liên kết bản đồ cửa hàng không hợp lệ.</p>
          )}
        </div>
      </section>
      <form className="h-fit rounded-2xl border border-slate-200 p-5 sm:p-7" onSubmit={submit}>
        <h2 className="text-xl font-bold text-slate-900">Gửi lời nhắn</h2>
        <p className="mt-1 text-sm text-slate-500">Các trường có dấu * là bắt buộc.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Họ và tên *<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-green-500" required placeholder="Nguyễn Văn A" /></label>
          <label className="text-sm font-semibold text-slate-700">Email *<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-green-500" required type="email" placeholder="email@example.com" /></label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Chủ đề<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-green-500" placeholder="Bạn cần tư vấn..." /></label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Nội dung *<textarea className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-green-500" required placeholder="Nhập lời nhắn của bạn..." /></label>
        </div>
        <button className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800" type="submit">{sent ? 'Đã ghi nhận lời nhắn' : 'Gửi liên hệ'}</button>
        {sent && <p className="mt-3 text-sm text-emerald-700" role="status">Cảm ơn bạn! Đây là giao diện demo, biểu mẫu chưa gửi dữ liệu tới máy chủ.</p>}
      </form>
    </div>
  );
}
