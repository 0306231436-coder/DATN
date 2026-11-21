import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, Trash2, Unlock, Users } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { donHangService } from '../../services/donHangService.js';
import {
  formatApiDate,
  getApiField,
  getApiList,
  normalizeOrderStatus,
} from '../../services/adminDataUtils.js';
import { formatCurrency } from './adminData.js';
import { PageHeading, SearchField } from './AdminComponents.jsx';

const getUserId = (user) =>
  getApiField(user, 'maNguoiDung', 'MaNguoiDung', 'id', 'Id', 'userId', 'UserId');

const getUserName = (user) =>
  getApiField(user, 'hoTen', 'HoTen', 'tenDangNhap', 'TenDangNhap', 'name', 'Name') || 'Chưa cập nhật';

const getDateValue = (user) =>
  getApiField(user, 'ngayTao', 'NgayTao', 'ngayDangKy', 'NgayDangKy', 'createdAt', 'CreatedAt');

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Xử lý cả trường hợp axiosClient trả về AxiosResponse ({ data: [...] }) lẫn mảng trực tiếp ([...])
const extractList = (response) => {
  const payload = response?.data !== undefined ? response.data : response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return getApiList(payload);
};

export default function AdminCustomersPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busyUserId, setBusyUserId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, ordersResult] = await Promise.allSettled([
        authService.getUsers(),
        donHangService.getDonHangs(),
      ]);

      if (usersResult.status === 'rejected') {
        throw usersResult.reason;
      }

      const userList = extractList(usersResult.value);
      if (!Array.isArray(userList)) {
        throw new Error('Dữ liệu danh sách người dùng từ GET /api/NguoiDung không hợp lệ.');
      }

      const orderList =
        ordersResult.status === 'fulfilled' ? extractList(ordersResult.value) || [] : [];

      setUsers(userList);
      setOrders(orderList);
    } catch (requestError) {
      console.error('Lỗi khi tải danh sách người dùng:', requestError);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Không thể tải danh sách người dùng.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (user) => {
    if (!user.rawId || busyUserId) return;
    setBusyUserId(user.rawId);
    try {
      const res = await authService.toggleUserStatus(user.rawId);
      const data = res?.data ?? res;
      const nextStatus =
        typeof data?.trangThai === 'boolean' ? data.trangThai : !user.isActive;

      setUsers((prev) =>
        prev.map((item) =>
          getUserId(item) === user.rawId
            ? { ...item, trangThai: nextStatus, TrangThai: nextStatus }
            : item
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user.rawId || busyUserId) return;
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa người dùng "${user.name}" (${user.username || user.email}) không?`
    );
    if (!confirmed) return;

    setBusyUserId(user.rawId);
    try {
      await authService.deleteUser(user.rawId);
      setUsers((prev) => prev.filter((item) => getUserId(item) !== user.rawId));
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể xóa người dùng.');
    } finally {
      setBusyUserId(null);
    }
  };

  const userRows = useMemo(() => {
    const ordersByUser = new Map();
    orders.forEach((order) => {
      const nestedUser =
        getApiField(order, 'nguoiDung', 'NguoiDung', 'khachHang', 'KhachHang', 'user', 'User') || {};
      const userId = getApiField(order, 'maNguoiDung', 'MaNguoiDung') ?? getUserId(nestedUser);
      if (userId === undefined || userId === null) return;

      const key = String(userId);
      const userOrders = ordersByUser.get(key) || [];
      userOrders.push(order);
      ordersByUser.set(key, userOrders);
    });

    return users.map((user) => {
      const rawId = getUserId(user);
      const userOrders =
        rawId !== undefined && rawId !== null ? ordersByUser.get(String(rawId)) || [] : [];
      const completedOrders = userOrders.filter((order) => {
        const status = normalizeOrderStatus(getApiField(order, 'trangThai', 'TrangThai'));
        return !status.includes('huy') && !status.includes('cancel');
      });

      const name = getUserName(user);
      const username = getApiField(user, 'tenDangNhap', 'TenDangNhap') || '';
      const rawRole = getApiField(user, 'vaiTro', 'VaiTro', 'role', 'Role') || 'Customer';
      const rawStatus = getApiField(user, 'trangThai', 'TrangThai');
      const isActive = rawStatus === undefined || rawStatus === null ? true : Boolean(rawStatus);

      const initials = name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();

      return {
        rawId,
        id: rawId ?? getApiField(user, 'email', 'Email') ?? name,
        name,
        username,
        email: getApiField(user, 'email', 'Email') || '—',
        phone: getApiField(user, 'soDienThoai', 'SoDienThoai', 'phone', 'Phone') || '—',
        role: rawRole,
        normalizedRole: normalizeOrderStatus(rawRole),
        isActive,
        joined: getDateValue(user),
        orderCount: userOrders.length,
        spent: completedOrders.reduce(
          (sum, order) =>
            sum +
            (Number(getApiField(order, 'tongTien', 'TongTien', 'tongThanhToan', 'TongThanhToan')) ||
              0),
          0
        ),
        initials: initials || 'ND',
      };
    });
  }, [users, orders]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return userRows.filter((user) => {
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && user.normalizedRole === 'admin') ||
        (roleFilter === 'customer' && user.normalizedRole !== 'admin');

      if (!matchesRole) return false;
      if (!normalizedQuery) return true;

      return `${user.name} ${user.username} ${user.email} ${user.phone}`
        .toLocaleLowerCase('vi')
        .includes(normalizedQuery);
    });
  }, [userRows, query, roleFilter]);

  const newUserCount = useMemo(() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return userRows.filter((user) => {
      const joined = toDate(user.joined);
      return joined && joined >= monthAgo;
    }).length;
  }, [userRows]);

  const activeUserCount = useMemo(
    () => userRows.filter((user) => user.isActive).length,
    [userRows]
  );

  return (
    <>
      <PageHeading
        eyebrow="Hệ thống tài khoản"
        title="Quản lý người dùng"
        description="Tra cứu hồ sơ, vai trò và trạng thái tài khoản từ API hệ thống."
      />

      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Tổng người dùng', value: users.length },
          { label: 'Người dùng mới (30 ngày)', value: newUserCount },
          { label: 'Tài khoản đang hoạt động', value: activeUserCount },
        ].map(({ label, value }) => (
          <article
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <Users size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {loading || error ? '—' : value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Danh sách người dùng</h2>
            <p className="mt-1 text-xs text-slate-500">
              Thông tin tài khoản và lịch sử mua hàng từ máy chủ
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <select
              aria-label="Lọc theo vai trò"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500"
              onChange={(e) => setRoleFilter(e.target.value)}
              value={roleFilter}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="customer">Khách hàng (Customer)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
            <SearchField
              label="Tìm người dùng"
              onChange={setQuery}
              placeholder="Tên, username, email hoặc SĐT..."
              value={query}
            />
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-sm text-rose-700" role="alert">
            <p>{error}</p>
            <button
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              onClick={loadData}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3">Người dùng</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3">Đơn hàng</th>
                    <th className="px-4 py-3">Tổng chi tiêu</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={8}>
                        Đang tải dữ liệu người dùng...
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr className="text-xs hover:bg-slate-50/70" key={user.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                                [
                                  'bg-green-100 text-green-700',
                                  'bg-blue-100 text-blue-700',
                                  'bg-amber-100 text-amber-700',
                                  'bg-violet-100 text-violet-700',
                                ][index % 4]
                              }`}
                            >
                              {user.initials}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800">
                                {user.name}{' '}
                                {user.username && (
                                  <span className="font-normal text-slate-400">
                                    (@{user.username})
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{user.phone}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              user.normalizedRole === 'admin'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              user.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                          {formatApiDate(user.joined, { dateStyle: 'short' })}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {user.orderCount}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">
                          {formatCurrency(user.spent)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          {user.rawId !== undefined && user.rawId !== null && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                disabled={busyUserId === user.rawId}
                                onClick={() => handleToggleStatus(user)}
                                title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                type="button"
                              >
                                {user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>
                              <button
                                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                disabled={busyUserId === user.rawId}
                                onClick={() => handleDeleteUser(user)}
                                title="Xóa người dùng"
                                type="button"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={8}>
                        Không tìm thấy người dùng phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              Hiển thị {loading ? '—' : filteredUsers.length} / {loading ? '—' : userRows.length}{' '}
              người dùng
            </div>
          </>
        )}
      </section>
    </>
  );
}