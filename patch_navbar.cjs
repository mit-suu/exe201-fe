const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

const target = `              {isCustomer && (
                <>
                  <NavLink to="/orders/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18} /> Orders</NavLink>
                  <NavLink to="/my-wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Wallet size={18} /> My Wallet</NavLink>
                  <NavLink to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><User size={18} /> Profile</NavLink>
                </>
              )}`;

if(code.includes(target)) {
    code = code.replace(target, '');
    fs.writeFileSync('src/components/Navbar.jsx', code, 'utf8');
    console.log('Successfully removed links!');
} else {
    console.log('Could not find target block! Trying with regex...');
    // regex fallback
    const regex = /\{\s*isCustomer && \(\s*<>\s*<NavLink to="\/orders\/history"[\s\S]*?<NavLink to="\/profile"[\s\S]*?<\/NavLink>\s*<\/>\s*\)\s*\}/;
    if(regex.test(code)) {
        code = code.replace(regex, '');
        fs.writeFileSync('src/components/Navbar.jsx', code, 'utf8');
        console.log('Successfully removed links with regex!');
    } else {
        console.log('Failed to find with regex either.');
    }
}
