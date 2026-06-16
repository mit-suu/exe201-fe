const fs = require('fs');

const adminDashPath = 'd:/mit-suu-exe201-be1/exe201-fe/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(adminDashPath, 'utf8');

// Add imports
const importsToAdd = `
import ReportsTab from './components/ReportsTab.jsx';
import UsersTab from './components/UsersTab.jsx';
import ShopsTab from './components/ShopsTab.jsx';
import CostumesTab from './components/CostumesTab.jsx';
import OrdersTab from './components/OrdersTab.jsx';
import CategoriesTab from './components/CategoriesTab.jsx';
import ConfigTab from './components/ConfigTab.jsx';
import ComplaintsLogsTab from './components/ComplaintsLogsTab.jsx';
import WithdrawalsTab from './components/WithdrawalsTab.jsx';
import ChatTab from './components/ChatTab.jsx';
`;

// Insert imports after the existing imports
const lastImportIndex = content.lastIndexOf("import ");
const endOfLastImport = content.indexOf("\n", lastImportIndex) + 1;
content = content.slice(0, endOfLastImport) + importsToAdd + content.slice(endOfLastImport);

// Replace Tabs
const startMarker1 = "{/* TAB 1: REPORTS */}";
const endMarker9 = "      </main>";

const startIndex = content.indexOf(startMarker1);
const endIndex = content.indexOf(endMarker9);

const newTabs = `
        {activeTab === 'reports' && <ReportsTab reportData={reportData} />}
        {activeTab === 'users' && <UsersTab customers={customers} handleToggleUserStatus={handleToggleUserStatus} />}
        {activeTab === 'shops' && <ShopsTab shops={shops} handleApproveLender={handleApproveLender} handleToggleUserStatus={handleToggleUserStatus} setSelectedShop={setSelectedShop} />}
        {activeTab === 'costumes' && <CostumesTab costumes={costumes} handleLockProduct={handleLockProduct} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} handleOverrideOrderStatus={handleOverrideOrderStatus} setSelectedOrder={setSelectedOrder} />}
        {activeTab === 'categories' && <CategoriesTab categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} handleAddCategory={handleAddCategory} />}
        {activeTab === 'config' && <ConfigTab platformConfig={platformConfig} setPlatformConfig={setPlatformConfig} adminBankInfo={adminBankInfo} setAdminBankInfo={setAdminBankInfo} handleSaveConfig={handleSaveConfig} />}
        {activeTab === 'complaints_logs' && <ComplaintsLogsTab disputes={disputes} logs={logs} setResolvingDispute={setResolvingDispute} setResolutionForm={setResolutionForm} />}
        {activeTab === 'withdrawals' && <WithdrawalsTab withdrawals={withdrawals} handleProcessWithdrawal={handleProcessWithdrawal} visibleWithdrawalQr={visibleWithdrawalQr} setVisibleWithdrawalQr={setVisibleWithdrawalQr} />}
        {activeTab === 'chat' && <ChatTab conversations={conversations} selectedConvId={selectedConvId} setSelectedConvId={setSelectedConvId} />}
`;

content = content.slice(0, startIndex) + newTabs + content.slice(endIndex);

fs.writeFileSync(adminDashPath, content, 'utf8');
console.log('AdminDashboard.jsx updated');
