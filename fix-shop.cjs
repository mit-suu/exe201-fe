const fs = require('fs');

try {
  let text = fs.readFileSync('src/pages/shop/ShopDashboard.jsx', 'utf8');

  // 1. Add Lock to imports
  text = text.replace(
    /import \{ LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download, AlertTriangle, Clock, Info, AlertCircle \} from 'lucide-react';/,
    "import { LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download, AlertTriangle, Clock, Info, AlertCircle, Lock } from 'lucide-react';"
  );

  // 2. Add shopStatus state
  text = text.replace(
    /const \[activeTab, setActiveTab\] = useState\(tab\);/,
    "const [activeTab, setActiveTab] = useState(tab);\n  const [shopStatus, setShopStatus] = useState(user?.lenderProfile?.status || user?.profiles?.lender?.status || 'Pending');"
  );

  // 3. Update loadData to update shopStatus
  text = text.replace(
    /const lender = userProfile\.profiles\?\.lender \|\| \{\};\n\s*setProfileForm\(\(prev\) => \(\{/,
    "const lender = userProfile.profiles?.lender || {};\n        setShopStatus(lender.status || 'Pending');\n        setProfileForm((prev) => ({"
  );

  // 4. Wrap the main content
  const mainContentRegex = /<main className="admin-content">([\s\S]*?)<\/main>/;
  const match = text.match(mainContentRegex);

  if (match) {
    let mainContent = match[1];
    
    // Remove the old pending alert
    mainContent = mainContent.replace(
      /\{\s*user\?\.lenderProfile\?\.status === 'Pending' && \([\s\S]*?\}\s*\)\s*/,
      ""
    );

    const newMainContent = `<main className="admin-content">
        {shopStatus === 'Pending' ? (
          <div className="card" style={{ textAlign: 'center', padding: '100px 20px', background: 'white', marginTop: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '24px', background: 'var(--surface-soft)', borderRadius: '50%', marginBottom: '24px' }}>
              <Lock size={64} style={{ color: 'var(--muted)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Gian hàng đang bị khóa chờ duyệt</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              Hồ sơ đăng ký mở gian hàng của bạn đã được gửi đến Ban Quản Trị. Vui lòng chờ Admin xem xét và phê duyệt. Bạn sẽ nhận được email thông báo ngay khi gian hàng được kích hoạt để bắt đầu kinh doanh.
            </p>
          </div>
        ) : shopStatus === 'Rejected' ? (
          <div className="card" style={{ textAlign: 'center', padding: '100px 20px', background: '#fef2f2', border: '1px solid #fee2e2', marginTop: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '24px', background: 'white', borderRadius: '50%', marginBottom: '24px' }}>
              <AlertCircle size={64} style={{ color: 'var(--danger)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.8rem', color: 'var(--danger)' }}>Yêu cầu mở gian hàng bị từ chối</h2>
            <p style={{ color: 'var(--danger)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              Hồ sơ của bạn không đáp ứng đủ các tiêu chí của hệ thống hoặc có thông tin không hợp lệ. Vui lòng liên hệ Admin qua kênh Hỗ trợ để biết thêm chi tiết.
            </p>
          </div>
        ) : (
          <>
            ${mainContent}
          </>
        )}
      </main>`;

    text = text.replace(mainContentRegex, newMainContent);
  }

  fs.writeFileSync('src/pages/shop/ShopDashboard.jsx', text);
  console.log('Success');
} catch(e) {
  console.error(e);
}
