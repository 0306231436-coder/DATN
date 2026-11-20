import { Search } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-green-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10 sm:w-64">
      <Search className="shrink-0 text-slate-400" size={16} />
      <input aria-label={label} className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}
