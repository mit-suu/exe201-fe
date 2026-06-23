import { useState, useEffect, useCallback } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem('buildlab_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('buildlab_cart');
        if (stored) {
          setCart(JSON.parse(stored));
        } else {
          setCart([]);
        }
      } catch (e) {
        setCart([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart_updated', handleStorageChange);
    };
  }, []);

  const saveCart = useCallback((newCart) => {
    localStorage.setItem('buildlab_cart', JSON.stringify(newCart));
    setCart(newCart);
    window.dispatchEvent(new Event('cart_updated'));
  }, []);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const exists = prev.findIndex(i => 
        i.product._id === item.product._id && 
        i.size === item.size &&
        i.startDate === item.startDate &&
        i.endDate === item.endDate
      );
      if (exists > -1) return prev;
      
      const newCart = [...prev, item];
      localStorage.setItem('buildlab_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart_updated'));
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setCart(prev => {
      const newCart = prev.filter((_, i) => i !== index);
      localStorage.setItem('buildlab_cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart_updated'));
      return newCart;
    });
  }, []);

  
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

  const clearCart = useCallback(() => {
    localStorage.setItem('buildlab_cart', JSON.stringify([]));
    setCart([]);
    window.dispatchEvent(new Event('cart_updated'));
  }, []);

  return { cart, addToCart, removeFromCart, clearCart, updateCartItem };
};
