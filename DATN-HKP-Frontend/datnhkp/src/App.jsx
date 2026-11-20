import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import HomePage from './pages/public/HomePage.jsx';
import ProductsPage from './pages/public/ProductsPage.jsx';
import ProductDetailPage from './pages/public/ProductDetailPage.jsx';
import CartPage from './pages/public/CartPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import CheckoutPage from './pages/public/CheckoutPage.jsx';
import OrderHistoryPage from './pages/public/OrderHistoryPage.jsx';
import AccountPage from './pages/public/AccountPage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminBrandsPage from './pages/admin/AdminBrandsPage.jsx';
import AdminPagesPage from './pages/admin/AdminPagesPage.jsx';
import { StoreInfoProvider } from './context/StoreInfoContext.jsx';
import { getStoredUser, isAdminUser } from './services/authUtils.js';

function RequireAdmin({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/dang-nhap" />;
  }

  if (!isAdminUser(user)) {
    return <Navigate replace to="/" />;
  }

  return children;
}

function RequireUser({ children }) {
  const location = useLocation();

  if (!getStoredUser()) {
    return <Navigate replace state={{ from: location.pathname }} to="/dang-nhap" />;
  }

  return children;
}

export default function App() {
  return (
    <StoreInfoProvider>
      <Routes>
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminPage />} />
          <Route path="san-pham" element={<AdminProductsPage />} />
          <Route path="danh-muc" element={<AdminCategoriesPage />} />
          <Route path="thuong-hieu" element={<AdminBrandsPage />} />
          <Route path="trang" element={<AdminPagesPage />} />
          <Route path="don-hang" element={<AdminOrdersPage />} />
          <Route path="khach-hang" element={<AdminCustomersPage />} />
          <Route path="bao-cao" element={<AdminReportsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham" element={<ProductsPage />} />
          <Route path="/san-pham/:productId" element={<ProductDetailPage />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/don-hang" element={<RequireUser><OrderHistoryPage /></RequireUser>} />
          <Route path="/tai-khoan" element={<RequireUser><AccountPage /></RequireUser>} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </StoreInfoProvider>
  );
}
