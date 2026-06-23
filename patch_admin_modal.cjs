const fs = require('fs');
const path = 'src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{activeTab === 'chat' && <ChatTab conversations=\{conversations\} selectedConvId=\{selectedConvId\} setSelectedConvId=\{setSelectedConvId\} \/>\}[\s\S]*?<p style=\{\{ margin: '4px 0 0', color: 'var\(--muted\)', fontSize: '0.88rem' \}\}>\{selectedShop.email\}<\/p>/m;

const replacement = `{activeTab === 'chat' && <ChatTab conversations={conversations} selectedConvId={selectedConvId} setSelectedConvId={setSelectedConvId} />}
      </main>

      {/* MODAL: SHOP DETAIL */}
      {selectedShop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '26px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setSelectedShop(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
              {selectedShop.lenderProfile?.logoUrl
                ? <img src={selectedShop.lenderProfile.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover' }} />
                : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}>
                    <Store size={28} style={{ color: '#9ca3af' }} />
                  </div>
                )
              }
              <div>
                <h2 style={{ margin: 0 }}>{selectedShop.fullName}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{selectedShop.email}</p>`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed modal');
