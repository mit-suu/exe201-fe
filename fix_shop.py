import re

with open('src/pages/shop/ShopDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

broken_str = """      if (configData) {
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
    }"""

fixed_str = """      if (configData) {
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
        toast.success(`Bạn vừa có đơn thuê mới: ${data.productName} (Đã thanh toán cọc)`);
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
    }"""

if broken_str in content:
    with open('src/pages/shop/ShopDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content.replace(broken_str, fixed_str))
    print("Fixed!")
else:
    print("Not found broken_str")
