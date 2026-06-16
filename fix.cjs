const fs = require('fs');

const content = `    monthlyRevenue: []
  });
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [platformConfig, setPlatformConfig] = useState({ platformFeePercent: 10, banners: [] });
  const [adminBankInfo, setAdminBankInfo] = useState({ bin: '', accountNumber: '', accountName: '' });
  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [visibleWithdrawalQr, setVisibleWithdrawalQr] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 });

  const loadData = async () => {
    try {
      const [rep, custs, shps, prods, ords, config, bankInfo, disps, withds, activity, cats] = await Promise.all([
        getAdminReports(),
        getAdminUsers('customer'),
        getAdminUsers('shop'),
        getAdminProducts(),
        getAdminOrders(),
        getPlatformConfig(),
        getAdminBankInfo().catch(() => null),
        getAllDisputes(),
        getAllWithdrawals(),
        getActivityLogs(),
        listCategories().catch(() => [])
      ]);

      if (rep) setReportData(rep);
      setCustomers(custs || []);
      setShops(shps || []);
      setCostumes(prods?.items || []);
      setOrders((ords || []).map(normalizeOrder));
      if (config) setPlatformConfig(config);
      if (bankInfo) setAdminBankInfo(bankInfo);
      setDisputes(disps || []);
      setWithdrawals(withds || []);
      setLogs(activity || []);
      setCategories(cats || []);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu hệ thống.');
    }
  };

  useEffect(() => { loadData(); }, []);

  // WebSocket cho realtime updates
  useEffect(() => {
    const socket = connectSocket();
    
    if (socket) {
      console.log('[Admin] WebSocket đã kết nối');
      
      // Lắng nghe cập nhật ví (nạp/rút tiền)
      socket.on('wallet_updated', (data) => {
        console.log('[Admin] wallet_updated:', data);
        
        if (data.type === 'withdrawal') {
          if (data.status === 'completed') {
            toast.success(\`Rút tiền \${money(data.amount)}đ đã hoàn tất\`);
            loadData();
          } else if (data.status === 'failed') {
            toast.error(\`Yêu cầu rút tiền \${money(data.amount)}đ đã thất bại\`);
            loadData();
          } else if (data.status === 'processing') {
            toast.loading(\`Đang xử lý rút tiền \${money(data.amount)}đ...\`, { duration: 2000 });
            loadData();
          }
        }
        
        if (data.type === 'deposit' && data.status === 'completed') {
          toast.success(\`Nạp tiền \${money(data.amount)}đ thành công\`);
          loadData();
        }
      });
      
      // Lắng nghe đơn hàng mới
      socket.on('new_order', (data) => {
        toast.info(\`Có đơn hàng mới: \${data.productName || 'Trang phục'}\`);
        loadData();
      });
      
      // Lắng nghe cập nhật đơn hàng
      socket.on('order_updated', (data) => {
        toast.info(\`Đơn hàng #\${data.orderId?.slice(-6)} đã được cập nhật\`);
        loadData();
      });

      // Lắng nghe khi có tranh chấp mới
      socket.on('new_dispute', (data) => {
        toast.error(\`Tranh chấp mới từ đơn hàng #\${data.orderId?.slice(-6)}\`);
        loadData();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('wallet_updated');
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('new_dispute');
        console.log('[Admin] WebSocket đã ngắt kết nối');
      }
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      const fetchConvs = () => {
        getConversations().then(data => setConversations(data || [])).catch(err => console.error(err));
      };
      fetchConvs();
      const timer = setInterval(fetchConvs, 3000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      await setUserStatus(userId, !currentActive);
      toast.success('Đã cập nhật trạng thái tài khoản.');
      loadData();
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái người dùng.');
    }
  };

  const handleApproveLender = async (lenderId, approved) => {
    try {
      await approveLender(lenderId, approved);
      toast.success(approved ? 'Đã duyệt phê duyệt lender đăng ký.' : 'Đã từ chối lender đăng ký.');
      setSelectedShop(null);
      loadData();
    } catch (err) {
      toast.error('Lỗi xử lý duyệt lender.');
    }
  };

  const handleLockProduct = async (productId, isLocked) => {
    try {
      await updateProduct(productId, { status: isLocked ? 'hidden' : 'available' });
      toast.success(isLocked ? 'Đã khóa trang phục vi phạm thành công.' : 'Đã mở khóa trang phục.');
      loadData();
    } catch (err) {
      toast.error('Không thể khóa trang phục.');
    }
  };

  const handleOverrideOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Đã cập nhật trạng thái đơn hàng (Admin override).');
      if (selectedOrder) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      loadData();
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái đơn đặt.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await createCategory({ name: newCategory.trim() });
      toast.success('Đã thêm danh mục mới.');
      setNewCategory('');
      loadData();
    } catch (err) {
      toast.error('Lỗi thêm danh mục: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await updatePlatformConfig(platformConfig);`;

let text = fs.readFileSync('src/pages/admin/AdminDashboard.jsx', 'utf8');
text = text.replace(/topProducts:\s*\[\],\r?\n\s*await updatePlatformConfig\(platformConfig\);/, 'topProducts: [],\n' + content);
fs.writeFileSync('src/pages/admin/AdminDashboard.jsx', text);
