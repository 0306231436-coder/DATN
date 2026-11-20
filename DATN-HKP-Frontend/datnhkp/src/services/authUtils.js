export function getStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Lỗi đọc thông tin người dùng:', error);
    return null;
  }
}

export function isAdminUser(user) {
  const role = user?.vaiTro ?? user?.VaiTro ?? user?.role ?? user?.Role;
  return typeof role === 'string' && role.trim().toLowerCase() === 'admin';
}
