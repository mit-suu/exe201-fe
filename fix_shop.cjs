const fs = require('fs');

const path = 'src/pages/shop/ShopDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const broken_str = `      if (configData) {
        setPlatformConfig(configData);
      }
      if (txData) {
        setTransactions(txData.data || []);
      }
          setPendingTxId(null);
          toast.success('Ting ting! Số dư ví của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
          getTransactions().then(txData => setTransactions(txData?.data || []));
        }
      });
    }`;

const fixed_str = `      if (configData) {
        setPlatformConfig(configData);
      }
      if (txData) {
        setTransactions(txData.data || []);
      }
      if (userProfile) {
        localStorage.setItem('exe201-user', JSON.stringify(userProfile));
        const lender = userProfile.profiles?.lender || {};
        setProfileForm((prev) => ({
          ...prev,
          fullName: userProfile.fullName || '',
          email: userProfile.email || '',
          bio: lender.lenderDescription || lender.bio || '',
          logoUrl: lender.logoUrl || '',
          address: lender.pickupAddress?.addressLine1 || lender.address || '',
          phone: lender.pickupAddress?.phone || lender.phone || '',
          rentalPolicy: lender.rentalPolicy || '',
          latePenaltyPolicy: lender.latePenaltyPolicy || '',
          city: lender.pickupAddress?.city || '',
          district: lender.pickupAddress?.district || '',
          ward: lender.pickupAddress?.ward || '',
          latitude: lender.location?.coordinates?.[1] || '',
          longitude: lender.location?.coordinates?.[0] || '',
          formattedAddress: lender.location?.formattedAddress || '',
          googlePlaceId: lender.location?.googlePlaceId || ''
        }));
        setShopStatus(lender.status || 'Pending');
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu cửa hàng.');
    }
  };

  useEffect(() => {
    loadData();

    // Khởi tạo Socket
    const socket = connectSocket();
    if (socket) {
      socket.on('new_order', (data) => {
        toast.success(\`Bạn vừa có đơn thuê mới: \${data.productName} (Đã thanh toán cọc)\`);
        loadData(); // Cập nhật lại dữ liệu Dashboard tự động
      });
      socket.on('wallet_updated', (data) => {
        setWallet(prev => ({ ...prev, balance: data.balance, frozenBalance: data.frozenBalance }));
        if (data.status === 'completed') {
          setQrCode(null);
          setPendingTxId(null);
          toast.success('Ting ting! Số dư ví của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
          getTransactions().then(txData => setTransactions(txData?.data || []));
        }
      });
    }`;

if (content.includes(broken_str)) {
    fs.writeFileSync(path, content.replace(broken_str, fixed_str));
    console.log("Fixed!");
} else {
    console.log("Not found broken_str");
}
