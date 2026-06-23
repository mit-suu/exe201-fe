import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AiAssistant from './components/AiAssistant.jsx';
import AnalyticsTracker from './components/AnalyticsTracker.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Products from './pages/Products.jsx';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import SupportChat from './pages/SupportChat.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ShopDashboard from './pages/ShopDashboard.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import MyWallet from './pages/MyWallet.jsx';
import PartnerRegister from './pages/PartnerRegister.jsx';
import { getCurrentUser } from './services/auth.js';
import { Toaster } from 'react-hot-toast';

const getPrimaryRole = (user) => user?.role || user?.roles?.[0] || null;
const hasRole = (user, role) => user?.role === role || user?.roles?.includes(role);

function App() {
  const user = getCurrentUser();
  const primaryRole = getPrimaryRole(user);
  const isShop = hasRole(user, 'lender') || hasRole(user, 'both');

  return (
    <div className="app-shell">
      <AnalyticsTracker />
      <Navbar user={user} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={primaryRole === 'admin' ? <Navigate to="/admin" replace /> : isShop ? <Navigate to="/shop/dashboard" replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/partner-register" element={<PartnerRegister />} />
          <Route path="/products" element={<Products />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
          <Route path="/orders/history" element={user ? <OrderHistory /> : <Navigate to="/login" replace />} />
          <Route path="/my-wallet" element={user ? <MyWallet /> : <Navigate to="/login" replace />} />
          <Route path="/support-chat" element={user ? <SupportChat /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Navigate to={primaryRole === 'admin' ? '/admin' : isShop ? '/shop/dashboard' : '/'} replace />} />
          <Route path="/shop/dashboard" element={isShop ? <ShopDashboard tab="dashboard" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/costumes" element={isShop ? <ShopDashboard tab="costumes" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/orders" element={isShop ? <ShopDashboard tab="orders" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/revenue" element={isShop ? <ShopDashboard tab="revenue" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/profile" element={isShop ? <ShopDashboard tab="profile" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/reviews" element={isShop ? <ShopDashboard tab="reviews" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/notifications" element={isShop ? <ShopDashboard tab="notifications" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={primaryRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AiAssistant />
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
