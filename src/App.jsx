import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AiAssistant from './components/AiAssistant.jsx';
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
import { getCurrentUser } from './services/auth.js';

function App() {
  const user = getCurrentUser();
  const isShop = user && ['lender', 'both'].includes(user.role);

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : isShop ? <Navigate to="/shop/dashboard" replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to="/login" replace />} />
          <Route path="/orders/history" element={user ? <OrderHistory /> : <Navigate to="/login" replace />} />
          <Route path="/support-chat" element={user ? <SupportChat /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Navigate to={user?.role === 'admin' ? '/admin' : isShop ? '/shop/dashboard' : '/'} replace />} />
          <Route path="/shop/dashboard" element={isShop ? <ShopDashboard tab="dashboard" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/costumes" element={isShop ? <ShopDashboard tab="costumes" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/orders" element={isShop ? <ShopDashboard tab="orders" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/revenue" element={isShop ? <ShopDashboard tab="revenue" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/profile" element={isShop ? <ShopDashboard tab="profile" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/reviews" element={isShop ? <ShopDashboard tab="reviews" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/shop/notifications" element={isShop ? <ShopDashboard tab="notifications" user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
}

export default App;
