import { useEffect, useMemo, useState } from 'react';
import { Edit3, Layers3, Plus, Trash2, X } from 'lucide-react';
import { PageHeading, SearchField } from './AdminComponents.jsx';
import { productService } from '../../services/productService.js';

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productService.getCategories();
      const data = res.data || res;
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const key = query.trim().toLocaleLowerCase('vi');
    return items.filter((item) => (item.tenDanhMuc ?? item.TenDanhMuc ?? '').toLocaleLowerCase('vi').includes(key));
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setName(item.tenDanhMuc ?? item.TenDanhMuc ?? '');
    setModalOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing) {
        const id = editing.maDanhMuc ?? editing.MaDanhMuc;
        await productService.updateCategory(id, { tenDanhMuc: name.trim() });
      } else {
        await productService.createCategory({ tenDanhMuc: name.trim() });
      }
      setModalOpen(false);
      await load();
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Không thể lưu danh mục.');
    }
  };

  const remove = async (item) => {
    const id = item.maDanhMuc ?? item.MaDanhMuc;
    if (!window.confirm(`Xóa danh mục "${item.tenDanhMuc ?? item.TenDanhMuc}"?`)) return;
    try {
      await productService.deleteCategory(id);
      await load();
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Không thể xóa danh mục.');
    }
  };

  return (
    <>
      <PageHeading eyebrow="Cấu trúc cửa hàng" title="Quản lý danh mục" description="Thêm, sửa và xóa các danh mục sản phẩm." />
      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><Layers3 size={20} /></span>
          <div><p className="text-xs font-semibold text-slate-500">Tổng danh mục</p><p className="mt-1 text-xl font-black text-slate-900">{items.length}</p></div>
        </article>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div><h2 className="text-sm font-extrabold text-slate-900">Danh sách danh mục</h2><p className="mt-1 text-xs text-slate-500">Dữ liệu danh mục sản phẩm</p></div>
          <div className="flex gap-2">
            <SearchField label="Tìm danh mục" onChange={setQuery} placeholder="Tên danh mục..." value={query} />
            <button className="flex h-10 items-center gap-1.5 rounded-xl bg-green-600 px-4 text-xs font-bold text-white" onClick={openCreate} type="button"><Plus size={16} />Thêm danh mục</button>
          </div>
        </div>
        {error ? <p className="p-8 text-center text-sm text-rose-700">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead><tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-6 py-3">Mã</th><th className="px-4 py-3">Tên danh mục</th><th className="px-6 py-3 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={3}>Đang tải...</td></tr> : filtered.map((item, index) => (
                  <tr className="text-xs hover:bg-slate-50" key={item.maDanhMuc ?? item.MaDanhMuc ?? index}>
                    <td className="px-6 py-4 font-bold text-green-800">#{item.maDanhMuc ?? item.MaDanhMuc}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{item.tenDanhMuc ?? item.TenDanhMuc}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(item)} title="Sửa" type="button"><Edit3 size={16} /></button>
                        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => remove(item)} title="Xóa" type="button"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={3}>Không có danh mục phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={save}>
            <div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-slate-900">{editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h3><button className="text-slate-400" onClick={() => setModalOpen(false)} type="button"><X size={20} /></button></div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Tên danh mục *</label>
            <input autoFocus className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" onChange={(event) => setName(event.target.value)} required value={name} />
            <div className="mt-5 flex justify-end gap-2"><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold" onClick={() => setModalOpen(false)} type="button">Hủy</button><button className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white" type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
