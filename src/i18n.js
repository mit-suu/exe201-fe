import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Khởi tạo resources ngôn ngữ
const resources = {
  vi: {
    translation: {
      navbar: {
        home: 'Trang chủ',
        costumes: 'Trang phục',
        cart: 'Giỏ hàng',
        orders: 'Đơn của tôi',
        wallet: 'Ví của tôi',
        login: 'Đăng nhập',
        openShop: 'Mở gian hàng',
        dashboard: 'Bảng điều khiển',
        profile: 'Hồ sơ',
        logout: 'Đăng xuất',
        language: 'Ngôn ngữ'
      },
      home: {
        hero: {
          eyebrow: 'BuildLab Costume Rental',
          title: 'Thuê trang phục đẹp cho mọi khoảnh khắc quan trọng',
          text: 'Khám phá catalog áo dài, váy cưới, suit, đầm dạ hội và cosplay. Đặt lịch thuê nhanh, quản lý đơn rõ ràng, chat với admin và nhận tư vấn AI trong một nền tảng.',
          viewCatalog: 'Xem trang phục',
          createAccount: 'Tạo tài khoản'
        },
        category: {
          eyebrow: 'Danh mục nổi bật',
          title: 'Chọn nhanh theo nhu cầu thuê'
        },
        catalog: {
          eyebrow: 'Catalog trang phục',
          title: 'Sản phẩm đang có tại BuildLab',
          searchPlaceholder: 'Tìm áo dài, suit, cosplay...',
          allCategory: 'Tất cả danh mục',
          allSize: 'Tất cả size',
          empty: 'Chưa có sản phẩm hiển thị.',
          loading: 'Đang tải catalog trang phục...'
        }
      }
    }
  },
  en: {
    translation: {
      navbar: {
        home: 'Home',
        costumes: 'Costumes',
        cart: 'Cart',
        orders: 'My Orders',
        wallet: 'My Wallet',
        login: 'Login',
        openShop: 'Open Shop',
        dashboard: 'Dashboard',
        profile: 'Profile',
        logout: 'Logout',
        language: 'Language'
      },
      home: {
        hero: {
          eyebrow: 'BuildLab Costume Rental',
          title: 'Rent beautiful costumes for every important moment',
          text: 'Discover catalogs of Ao Dai, wedding dresses, suits, evening gowns, and cosplay. Book quickly, manage orders clearly, chat with admins, and get AI advice on one platform.',
          viewCatalog: 'View Catalog',
          createAccount: 'Create Account'
        },
        category: {
          eyebrow: 'Featured Categories',
          title: 'Quick select by rental needs'
        },
        catalog: {
          eyebrow: 'Costume Catalog',
          title: 'Products currently at BuildLab',
          searchPlaceholder: 'Search Ao Dai, suits, cosplay...',
          allCategory: 'All Categories',
          allSize: 'All Sizes',
          empty: 'No products to display.',
          loading: 'Loading costume catalog...'
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
