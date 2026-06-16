const fs = require('fs');

const path = 'src/pages/shop/ShopDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find tab sections
const tabs = [
  { id: 'dashboard', name: 'DashboardTab' },
  { id: 'costumes', name: 'CostumesTab' },
  { id: 'orders', name: 'OrdersTab' },
  { id: 'revenue', name: 'RevenueTab' },
  { id: 'profile', name: 'ProfileTab' },
  { id: 'reviews', name: 'ReviewsTab' },
  { id: 'notifications', name: 'NotificationsTab' }
];

let importsToAdd = '';
let newContent = content;

for (const tab of tabs) {
  const startTag = `{activeTab === '${tab.id}' && (`;
  const startIndex = newContent.indexOf(startTag);
  if (startIndex === -1) continue;

  let braceCount = 0;
  let endIndex = -1;
  let inJSX = false;

  for (let i = startIndex + startTag.length - 1; i < newContent.length; i++) {
    if (newContent[i] === '(') braceCount++;
    if (newContent[i] === ')') braceCount--;

    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }

  if (endIndex !== -1) {
    const sectionBody = newContent.substring(startIndex + startTag.length, endIndex - 1).trim();
    
    // We pass all state as a massive single prop "props" to save time on extracting exact dependencies
    // Or we spread a generic `props` object.
    const componentCode = `
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const ${tab.name} = (props) => {
  const {
    products, orders, reviews, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleUpdateBank,
    withdrawalAmount, setWithdrawalAmount, handleWithdraw,
    handlePrintReport,
    replyText, setReplyText, handleReplySubmit,
    handleMarkNotifRead,
    handleProductEdit, handleProductDelete,
    newBusyDate, setNewBusyDate, handleAddBusyDate, handleRemoveBusyDate,
    selectedOrder, setSelectedOrder,
    checkingInOrder, setCheckingInOrder, checkInImages, setCheckInImages,
    checkingOutOrder, setCheckingOutOrder, checkOutImages, setCheckOutImages,
    disputingOrder, setDisputingOrder, disputeReason, setDisputeReason, disputeAmount, setDisputeAmount,
    handleStatusChange,
    navigate,
    setShowProductForm
  } = props;

  return (
    ${sectionBody}
  );
};

export default ${tab.name};
`;

    fs.writeFileSync(`src/components/shop/${tab.name}.jsx`, componentCode);
    importsToAdd += `import ${tab.name} from '../../components/shop/${tab.name}.jsx';\n`;
    
    newContent = newContent.substring(0, startIndex) + `{activeTab === '${tab.id}' && <${tab.name} {...props} />}` + newContent.substring(endIndex);
  }
}

// Add the props object creation right before `return (` in ShopDashboard.jsx
const returnIndex = newContent.indexOf('return (');
const propsObj = `
  const props = {
    products, orders, reviews, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleUpdateBank,
    withdrawalAmount, setWithdrawalAmount, handleWithdraw,
    handlePrintReport,
    replyText, setReplyText, handleReplySubmit,
    handleMarkNotifRead,
    handleProductEdit, handleProductDelete,
    newBusyDate, setNewBusyDate, handleAddBusyDate, handleRemoveBusyDate,
    selectedOrder, setSelectedOrder,
    checkingInOrder, setCheckingInOrder, checkInImages, setCheckInImages,
    checkingOutOrder, setCheckingOutOrder, checkOutImages, setCheckOutImages,
    disputingOrder, setDisputingOrder, disputeReason, setDisputeReason, disputeAmount, setDisputeAmount,
    handleStatusChange,
    navigate,
    setShowProductForm
  };

  `;
newContent = newContent.substring(0, returnIndex) + propsObj + newContent.substring(returnIndex);

// Add imports
const lastImportIndex = newContent.lastIndexOf("import ");
const endOfLastImport = newContent.indexOf("\n", lastImportIndex) + 1;
newContent = newContent.slice(0, endOfLastImport) + importsToAdd + newContent.slice(endOfLastImport);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Done extracting ShopDashboard components!');
