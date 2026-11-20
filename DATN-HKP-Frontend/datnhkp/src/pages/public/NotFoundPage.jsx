import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[55vh] place-items-center px-4 py-16 text-center">
      <div>
        <p className="text-7xl font-black tracking-tight text-green-700">404</p>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-500">Đường dẫn này không tồn tại hoặc sản phẩm đã được gỡ.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800" to="/">Về trang chủ</Link>
      </div>
    </div>
  );
}
