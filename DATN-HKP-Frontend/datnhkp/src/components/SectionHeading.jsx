import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionHeading({ eyebrow, title, action = 'Xem tất cả', to = '/san-pham' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      </div>
      <Link className="mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-green-700 transition hover:gap-3" to={to}>
        {action}<ArrowRight size={16} />
      </Link>
    </div>
  );
}
