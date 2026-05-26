import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AiAssistant from './components/AiAssistant.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import { getCurrentUser } from './services/auth.js';

function App() {
  const user = getCurrentUser();
  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
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
