'use client';

import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Theme, CartItem, User } from '../lib/types';
import { THEMES } from '../lib/constants';
import { storageService } from '../lib/storageService';

interface AppContextType {
  theme: Theme;
  setThemeId: (id: 'nature' | 'earth' | 'tech') => void;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isCartOpen: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<'nature' | 'earth' | 'tech'>('nature');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load initial user state only on client
  useEffect(() => {
    setUser(storageService.getCurrentUser());
  }, []);

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', theme.colors.primary);
        root.style.setProperty('--color-secondary', theme.colors.secondary);
        root.style.setProperty('--color-accent', theme.colors.accent);
        root.style.setProperty('--color-bg', theme.colors.bg);
        root.style.setProperty('--color-surface', theme.colors.surface);
        root.style.setProperty('--color-text', theme.colors.text);
        root.style.setProperty('--color-muted', theme.colors.muted);
    }
  }, [theme]);

  const login = (email: string) => {
    const u = storageService.login(email);
    setUser(u);
  };

  const logout = () => {
    storageService.logout();
    setUser(null);
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.variantId === item.variantId);
      if (existing) {
        return prev.map(i => (i.id === existing.id && i.variantId === existing.variantId) ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQ };
      }
      return i;
    }));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ 
      theme, setThemeId, 
      user, login, logout, 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      isCartOpen, toggleCart: () => setIsCartOpen(!isCartOpen) 
    }}>
      {children}
    </AppContext.Provider>
  );
};