import { BadgeCheck, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { useStoreInfo } from '../../context/StoreInfoContext.jsx';

const values = [
  { icon: ShieldCheck, title: 'Sản phẩm chính hãng', text: 'Nguồn gốc rõ ràng, chính sách bảo hành minh bạch.' },
  { icon: HeartHandshake, title: 'Tư vấn tận tâm', text: 'Giúp bạn chọn thiết bị đúng nhu cầu và ngân sách.' },
  { icon: Sparkles, title: 'Trải nghiệm tốt hơn', text: 'Không ngừng cải thiện hành trình mua sắm công nghệ.' },
];

export default function AboutPage() {
  const { storeInfo } = useStoreInfo();
  const storeName = storeInfo?.name?.trim() || 'Care24h';

  return (
    <div>
      <section className="bg-slate-950 px-4 py-16 text-center text-white sm:py-20">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-300">Về chúng tôi</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Công nghệ tốt hơn cho mỗi ngày</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{storeName} được xây dựng với mong muốn giúp mọi người tiếp cận thiết bị công nghệ phù hợp, dễ dàng và đáng tin cậy.</p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">Câu chuyện {storeName}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Đồng hành cùng bạn chọn đúng công nghệ</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">Từ chiếc laptop đầu tiên cho việc học đến bộ PC chuyên nghiệp cho công việc và giải trí, chúng tôi tin rằng lựa chọn phù hợp sẽ mở ra nhiều cơ hội mới.</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{storeName} tập trung vào danh mục máy tính, linh kiện và phụ kiện thiết yếu, cùng thông tin sản phẩm rõ ràng để bạn tự tin đưa ra quyết định.</p>
        </div>
        <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-green-50">
          <img alt="Không gian làm việc hiện đại" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85" />
        </div>
      </section>
      <section className="bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-8 max-w-xl text-center"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">Giá trị cốt lõi</p><h2 className="mt-2 text-3xl font-extrabold text-slate-900">Lý do chọn {storeName}</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => <article className="rounded-xl border border-slate-100 bg-white p-6" key={title}><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Icon size={22} /></span><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><BadgeCheck className="text-emerald-600" size={16} />Giao diện minh họa phục vụ đồ án xây dựng website cửa hàng máy tính.</p>
        </div>
      </section>
    </div>
  );
}
