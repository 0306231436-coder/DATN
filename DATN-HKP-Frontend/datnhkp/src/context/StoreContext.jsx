import { createContext, useContext, useEffect, useState } from 'react';
import { cartService } from '../services/cartService';
import { getStoredUser } from '../services/authUtils';
import { getProductImageUrl } from '../services/imageUtils.js';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);

  // Lấy thông tin người dùng đăng nhập hiện tại từ localStorage
  const getLoggedInUser = () => {
    return getStoredUser();
  };

  const getLoggedInUserId = (currentUser) => {
    const user = currentUser !== undefined ? currentUser : getStoredUser();
    if (!user) return null;
    const userId = user.maNguoiDung ?? user.MaNguoiDung ?? user.tenDangNhap;
    return userId ? String(userId) : null;
  };

  const [user, setUser] = useState(getLoggedInUser);
  const [maNguoiDung, setMaNguoiDung] = useState(() => getLoggedInUserId(getLoggedInUser()));

  // Dọn dẹp mã khách ngẫu nhiên (nếu còn sót lại từ phiên trước)
  useEffect(() => {
    const oldGuestId = localStorage.getItem('user_id');
    if (oldGuestId && oldGuestId.startsWith('guest_')) {
      localStorage.removeItem('user_id');
    }
  }, []);

  // Lắng nghe sự kiện storage để đồng bộ trạng thái đăng nhập / đăng xuất
  useEffect(() => {
    const syncUser = () => {
      const activeUser = getLoggedInUser();
      const activeUserId = getLoggedInUserId(activeUser);
      setUser(activeUser);
      setMaNguoiDung(activeUserId);

      // Nếu đã đăng xuất, dọn sạch giỏ hàng trong state
      if (!activeUserId) {
        setCart([]);
      }
    };

    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const mapCartItem = (item) => {
    const sp = item.sanPham || item.SanPham || {};
    const bt = item.bienThe || item.BienThe || {};

    const maChiTietGioHang = item.maChiTietGioHang ?? item.MaChiTietGioHang;
    const maSanPham = item.maSanPham ?? item.MaSanPham;
    const maBienThe = item.maBienThe ?? item.MaBienThe;
    const soLuong = item.soLuong ?? item.SoLuong ?? 1;

    // Lấy số lượng tồn kho: Ưu tiên Biến thể -> Sản phẩm
    const stock = bt.soLuongTon ?? bt.SoLuongTon ?? sp.soLuong ?? sp.SoLuong ?? 0;

    const price =
      bt.giaKhuyenMai && bt.giaKhuyenMai > 0
        ? bt.giaKhuyenMai
        : bt.gia || sp.gia || sp.Gia || 0;

    const image = getProductImageUrl(
      bt.hinhAnh || bt.HinhAnh || sp.hinhAnh || sp.HinhAnh
    );

    return {
      id: maChiTietGioHang,
      maSanPham,
      maBienThe,
      name: sp.tenSanPham || sp.TenSanPham || 'Sản phẩm',
      variantName: bt.tenBienThe || bt.TenBienThe || '',
      specs: sp.thongSoKyThuat || sp.ThongSoKyThuat || '',
      price: price,
      image: image,
      quantity: soLuong,
      stock: stock,
    };
  };

  // Tải giỏ hàng từ API (chỉ khi người dùng đã đăng nhập)
  const fetchCart = async () => {
    if (!maNguoiDung) {
      setCart([]);
      setLoadingCart(false);
      return;
    }

    try {
      setLoadingCart(true);
      const data = await cartService.getCartByUser(maNguoiDung);
      const items = Array.isArray(data) ? data : data?.data || [];
      setCart(items.map(mapCartItem));
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng từ API:', error);
      if (error.response?.status === 401) {
        setCart([]);
      }
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    if (maNguoiDung) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [maNguoiDung]);

  // Hàm Thêm vào giỏ hàng - BẮT BUỘC ĐÃ ĐĂNG NHẬP
  const addToCart = async (product, variant = null, quantity = 1) => {
    const activeUserId = maNguoiDung || getLoggedInUserId();
    if (!activeUserId) {
      const authErr = new Error('Vui lòng đăng nhập tài khoản để thêm sản phẩm vào giỏ hàng.');
      authErr.isAuthRequired = true;
      throw authErr;
    }

    const maSanPham = product.maSanPham ?? product.MaSanPham ?? product.id;
    const maBienThe =
      variant?.maBienThe ??
      variant?.MaBienThe ??
      product.selectedVariant?.maBienThe ??
      product.selectedVariant?.MaBienThe ??
      product.maBienThe ??
      product.MaBienThe ??
      null;

    try {
      await cartService.addToCart({
        maNguoiDung: activeUserId,
        maSanPham,
        maBienThe,
        soLuong: quantity,
      });
      await fetchCart();
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
      throw error;
    }
  };

  // Thay đổi số lượng sản phẩm (+1 / -1)
  const changeQuantity = async (cartItemId, delta) => {
    if (!maNguoiDung) return;

    const currentItem = cart.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + delta;

    try {
      if (newQuantity <= 0) {
        await cartService.removeFromCart(cartItemId);
      } else {
        await cartService.updateQuantity(cartItemId, newQuantity);
      }
      await fetchCart();
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng giỏ hàng:', error);
    }
  };

  // Xóa một sản phẩm khỏi giỏ
  const removeFromCart = async (cartItemId) => {
    if (!maNguoiDung) return;

    try {
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
    } catch (error) {
      console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
    }
  };

  // Xóa toàn bộ giỏ hàng (sau khi đặt hàng thành công)
  const clearCart = async () => {
    try {
      if (maNguoiDung) {
        await cartService.clearCart(maNguoiDung);
      }
    } catch (error) {
      console.error('Lỗi khi dọn dẹp giỏ hàng:', error);
    } finally {
      setCart([]);
    }
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        maNguoiDung,
        cart,
        loadingCart,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        favorites,
        toggleFavorite,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
