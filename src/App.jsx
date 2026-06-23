import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AiAssistant from './components/AiAssistant.jsx';
import AnalyticsTracker from './components/AnalyticsTracker.jsx';
import Home from './pages/customer/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Products from './pages/customer/Products.jsx';
import Profile from './pages/customer/Profile.jsx';
import ChangePassword from './pages/customer/ChangePassword.jsx';
import OrderHistory from './pages/customer/OrderHistory.jsx';
import SupportChat from './pages/customer/SupportChat.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ShopDashboard from './pages/shop/ShopDashboard.jsx';
import ProductDetail from './pages/customer/ProductDetail.jsx';
import PaymentResult from './pages/customer/PaymentResult.jsx';
import MyWallet from './pages/customer/MyWallet.jsx';
import PartnerRegister from './pages/auth/PartnerRegister.jsx';
import Cart from './pages/customer/Cart.jsx';
import { getCurrentUser } from './services/auth.js';
import { Toaster } from 'react-hot-toast';
import { usePageTracking } from './hooks/useAnalytics.js';
import FeedbackWidget from './components/FeedbackWidget.jsx';

const getPrimaryRole = (user) => {
  const roles = user?.roles || [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('lender') || roles.includes('both')) return 'lender';
  return roles[0] || null;
};
const hasRole = (user, role) => user?.role === role || user?.roles?.includes(role);
const isAdmin = (user) => hasRole(user, 'admin');
const isLender = (user) => hasRole(user, 'lender') || hasRole(user, 'both');

function App() {
  usePageTracking();
  const user = getCurrentUser();
  const primaryRole = getPrimaryRole(user);
  const isShop = isLender(user);
  const isUserAdmin = isAdmin(user);

  return (
    <div className="app-shell">
      <AnalyticsTracker />
      <Navbar user={user} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={isUserAdmin ? <Navigate to="/admin" replace /> : isShop ? <Navigate to="/shop/dashboard" replace /> : <Home />} />
          <Route path="/login" element={user ? <Navigate to={isUserAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/'} replace /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/partner-register" element={<PartnerRegister />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
          <Route path="/orders/history" element={user ? <OrderHistory /> : <Navigate to="/login" replace />} />
          <Route path="/my-wallet" element={user ? <MyWallet /> : <Navigate to="/login" replace />} />
          <Route path="/support-chat" element={user ? <SupportChat /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Navigate to={isUserAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/'} replace />} />
          <Route path="/shop/dashboard" element={isShop ? <ShopDashboard tab="dashboard" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/costumes" element={isShop ? <ShopDashboard tab="costumes" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/orders" element={isShop ? <ShopDashboard tab="orders" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/revenue" element={isShop ? <ShopDashboard tab="revenue" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/profile" element={isShop ? <ShopDashboard tab="profile" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/reviews" element={isShop ? <ShopDashboard tab="reviews" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/notifications" element={isShop ? <ShopDashboard tab="notifications" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/support" element={isShop ? <ShopDashboard tab="support" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={primaryRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {primaryRole !== 'admin' && <FeedbackWidget />}
      {primaryRole !== 'admin' && <AiAssistant />}
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
