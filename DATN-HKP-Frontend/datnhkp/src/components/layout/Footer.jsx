import { Link } from 'react-router-dom';
import { Clock3, Laptop, Mail, MapPin, Phone } from 'lucide-react';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

const isSafeWebUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export default function Footer() {
  const { storeInfo, error } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link className="mb-4 inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-white" to="/">
            <span className="grid size-9 place-items-center rounded-xl bg-green-700">
              {storeInfo?.logo
                ? <img alt="" className="size-full rounded-xl object-contain" src={storeInfo.logo} />
                : <Laptop size={20} />}
            </span>
            {storeName}
          </Link>
          <p className="max-w-xs text-sm leading-6 text-slate-400">Đồng hành cùng bạn chinh phục công nghệ. Sản phẩm chính hãng, tư vấn tận tâm.</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold text-white">Khám phá</h2>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <Link className="hover:text-white" to="/san-pham">Tất cả sản phẩm</Link>
            <Link className="hover:text-white" to="/san-pham?danh-muc=Laptop">Laptop</Link>
            <Link className="hover:text-white" to="/san-pham?danh-muc=PC">PC</Link>
            <Link className="hover:text-white" to="/san-pham?danh-muc=Macbook">Macbook</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold text-white">Hỗ trợ khách hàng</h2>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <Link className="hover:text-white" to="/gioi-thieu">Về {storeName}</Link>
            <Link className="hover:text-white" to="/lien-he">Liên hệ với chúng tôi</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold text-white">Liên hệ</h2>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            {storeInfo?.address && <p className="flex items-start gap-2"><MapPin className="shrink-0 text-green-400" size={17} /> {storeInfo.address}</p>}
            {storeInfo?.hotline && <a className="flex items-center gap-2 hover:text-white" href={`tel:${storeInfo.hotline.replace(/[^\d+]/g, '')}`}><Phone className="text-green-400" size={17} /> {storeInfo.hotline}</a>}
            {storeInfo?.email && <a className="flex items-center gap-2 hover:text-white" href={`mailto:${storeInfo.email}`}><Mail className="text-green-400" size={17} /> {storeInfo.email}</a>}
            {storeInfo?.openingHours && <p className="flex items-start gap-2"><Clock3 className="shrink-0 text-green-400" size={17} /> {storeInfo.openingHours}</p>}
            {storeInfo?.fanpageUrl && isSafeWebUrl(storeInfo.fanpageUrl) && <a className="hover:text-white" href={storeInfo.fanpageUrl} rel="noreferrer" target="_blank">Fanpage</a>}
            {error && <p className="text-amber-300" role="status">{error}</p>}
            {!error && !storeInfo?.address && !storeInfo?.hotline && !storeInfo?.email && !storeInfo?.openingHours && (
              <p>{storeInfo ? 'Thông tin liên hệ chưa được cập nhật.' : 'Đang tải thông tin cửa hàng...'}</p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:px-6 md:flex-row md:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
          <span></span>
        </div>
      </div>
    </footer>
  );
}
