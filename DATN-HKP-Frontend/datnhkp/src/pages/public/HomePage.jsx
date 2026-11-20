import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Cpu, Headphones, Keyboard, Laptop, Monitor, PanelsTopLeft, Truck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard.jsx';
import SectionHeading from '../../components/SectionHeading.jsx';
import { productService } from '../../services/productService.js';

const categoryIcons = { Laptop, Monitor, Cpu, PanelsTopLeft, Keyboard };

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  const [latestProducts, setLatestProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Lấy danh sách sản phẩm từ API /api/SanPham
        const res = await productService.getSanPhams({ pageNumber: 1, pageSize: 30 });
        
        // PagedResponse trả về danh sách nằm trong .items / .data hoặc mảng trực tiếp
        const rawProducts = res.items || res.data || (Array.isArray(res) ? res : []);

        // In log ra Console để bạn dễ dàng inspect thuộc tính của sản phẩm trong F12 nếu cần
        console.log('Dữ liệu API sản phẩm:', rawProducts);

        // LỌC SẢN PHẨM: Loại bỏ sản phẩm bị xóa / trạng thái = 0
        const productList = rawProducts.filter((p) => {
          // Lấy giá trị từ tất cả các tên trường trạng thái/đã xóa có thể có
          const statusVal = p.trangThai ?? p.TrangThai ?? p.status ?? p.Status ?? p.daXoa ?? p.DaXoa ?? p.isDeleted ?? p.IsDeleted;
          
          // Trạng thái bằng 0, "0", hoặc false -> Ẩn / Đã xóa
          if (statusVal == 0 || statusVal === '0' || statusVal === false) return false;
          
          // Đã xóa (daXoa / isDeleted = 1 hoặc true) -> Ẩn
          if (p.daXoa == 1 || p.daXoa === true || p.isDeleted == 1 || p.isDeleted === true) return false;
          
          return true;
        });

        // SẢN PHẨM MỚI NHẤT (Sắp xếp theo NgayTao giảm dần) ---
        const getCreatedTime = (p) => {
          const dateVal = p.ngayTao ?? p.NgayTao;
          if (dateVal) {
            const time = new Date(dateVal).getTime();
            if (!isNaN(time)) return time;
          }
          // Trả về maSanPham nếu chưa có ngày tạo
          return p.maSanPham ?? p.MaSanPham ?? 0;
        };

        const sortedByNewest = [...productList].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
        setLatestProducts(sortedByNewest.slice(0, 8));

        // SẢN PHẨM NỔI BẬT (Ưu tiên Lượt bán -> Tồn kho thấp) ---
        const getSalesCount = (p) => p.soLuongDaBan ?? p.luotBan ?? p.daBan ?? p.salesCount ?? 0;
        const getStockCount = (p) => p.soLuongTon ?? p.soLuong ?? p.tonKho ?? p.stock ?? 0;

        const hasSales = productList.some((p) => getSalesCount(p) > 0);

        const sortedByFeatured = [...productList].sort((a, b) => {
          if (hasSales) {
            return getSalesCount(b) - getSalesCount(a);
          } else {
            return getStockCount(a) - getStockCount(b);
          }
        });

        setFeaturedProducts(sortedByFeatured.slice(0, 8));
      } catch (error) {
        console.error('Lỗi kết nối API SanPham:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const subscribe = (event) => {
    event.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <>
      {/* Banner Hero Section */}
      <section className="bg-green-50/60">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="relative isolate min-h-[390px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[430px]">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,rgba(21,128,61,0.65),transparent_42%),linear-gradient(110deg,#102019_5%,#172f22_60%,#14532d_100%)]" />
            <div className="grid min-h-[390px] items-center sm:min-h-[430px] md:grid-cols-2">
              <div className="relative z-10 px-6 py-10 sm:px-10 lg:px-14">
                <p className="mb-4 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.16em] text-green-200">
                  <span className="size-2 rounded-full bg-green-400 shadow-[0_0_12px_#4ade80]" />
                  DEAL CÔNG NGHỆ THÁNG 11
                </p>
                <h1 className="max-w-xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">
                  Nâng tầm trải nghiệm.
                  <span className="mt-1 block text-green-300">Bứt phá mọi giới hạn.</span>
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-green-100/80 sm:text-base">
                  Laptop, PC và linh kiện chính hãng — chọn cấu hình phù hợp, giao hàng tận nơi.
                </p>
                <Link className="mt-7 inline-flex items-center gap-3 rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-green-500" to="/san-pham">
                  Khám phá ngay <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ô 1: SẢN PHẨM MỚI NHẤT */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Cập nhật mới" title="Sản phẩm mới nhất" />
          {loading ? (
            <div className="py-12 text-center text-slate-500">Đang tải danh sách sản phẩm...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {latestProducts.map((product) => (
                <ProductCard key={`latest-${product.maSanPham ?? product.MaSanPham}`} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ô 2: SẢN PHẨM NỔI BẬT / BÁN CHẠY */}
      <section className="border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Lựa chọn HOT" title="Sản phẩm nổi bật" />
          {loading ? (
            <div className="py-12 text-center text-slate-500">Đang tải danh sách sản phẩm...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={`featured-${product.maSanPham ?? product.MaSanPham}`} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}