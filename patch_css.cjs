const fs = require('fs');
const path = 'src/App.css';
let content = fs.readFileSync(path, 'utf8');

const tableCss = `
/* ─── ADMIN TABLE ─── */
.table-responsive { width: 100%; overflow-x: auto; }
.admin-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; text-align: left; }
.admin-table th { padding: 16px 20px; background: var(--surface-soft); color: var(--muted); font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
.admin-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
.admin-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
.admin-table td { padding: 18px 20px; border-bottom: 1px solid var(--border); font-size: 0.95rem; vertical-align: middle; }
.admin-table tbody tr { transition: background 150ms; }
.admin-table tbody tr:hover { background: var(--surface-soft); }
.admin-table tbody tr:last-child td { border-bottom: none; }

.filters-row { display: flex; gap: 15px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }
.filters-row select, .filters-row input { flex: 1; min-width: 200px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-secondary); outline: none; transition: border-color 200ms; font-family: inherit; color: var(--text); }
.filters-row select:focus, .filters-row input:focus { border-color: var(--primary); }
`;

if (!content.includes('.admin-table th')) {
  content += '\n' + tableCss;
  fs.writeFileSync(path, content, 'utf8');
  console.log('Added table styles to App.css');
}
