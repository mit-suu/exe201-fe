const fs = require('fs');
const path = 'src/hooks/useCart.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('updateCartItem')) {
  const updateFunc = `
  const updateCartItem = useCallback((index, updates) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = { ...newCart[index], ...updates };
      if (updates.startDate !== undefined || updates.endDate !== undefined) {
        const sd = new Date(item.startDate);
        const ed = new Date(item.endDate);
        if (!isNaN(sd) && !isNaN(ed) && ed >= sd) {
          const diff = (ed - sd) / (1000 * 60 * 60 * 24);
          item.rentalDays = diff > 0 ? Math.ceil(diff) : 1;
        } else {
          item.rentalDays = 0;
        }
        item.totalAmount = (item.product.rentalPrice || 0) * item.rentalDays;
      }
      newCart[index] = item;
      localStorage.setItem('buildlab_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart_updated'));
      return newCart;
    });
  }, []);
`;

  content = content.replace('const clearCart', updateFunc + '\n  const clearCart');
  content = content.replace('return { cart, addToCart, removeFromCart, clearCart };', 'return { cart, addToCart, removeFromCart, clearCart, updateCartItem };');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Added updateCartItem to useCart.js');
}
