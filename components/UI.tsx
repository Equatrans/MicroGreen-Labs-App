'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { ShoppingBag, User as UserIcon, Menu, X, Sun, SunMoon, Cpu, Loader2, Image as ImageIcon, Trash2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTACT_INFO } from '../lib/constants';

export const ImageWithFallback = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800';
    const [imgSrc, setImgSrc] = useState<string>(src && src.trim() !== '' ? src : DEFAULT_IMAGE);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
        const validSrc = (src && src.trim() !== '') ? src : DEFAULT_IMAGE;
        setImgSrc(validSrc);
        setIsLoading(true);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (imgSrc !== DEFAULT_IMAGE) {
            setImgSrc(DEFAULT_IMAGE);
        } else {
            setIsLoading(false);
            setHasError(true);
        }
    };

    const handleLoad = () => setIsLoading(false);

    return (
        <div className={`relative overflow-hidden bg-gray-50 ${className}`}>
            {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
                    <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                 </div>
            )}
            {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-muted p-2">
                    <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider opacity-60">No Image</span>
                </div>
            ) : (
                <img 
                    src={imgSrc} 
                    alt={alt} 
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </div>
    );
};

export const Navbar = () => {
  const { theme, setThemeId, cart, toggleCart, user } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.primary }}>
          <span>MicroGreen<span style={{ color: theme.colors.text }}>Labs</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="hover:text-primary transition-colors font-medium text-text">Главная</Link>
          <Link href="/shop" className="hover:text-primary transition-colors font-medium text-text">Каталог</Link>
          <Link href="/builder" className="hover:text-primary transition-colors font-medium text-text">Конфигуратор</Link>
          <Link href="/reviews" className="hover:text-primary transition-colors font-medium text-text">Отзывы</Link>
          {user?.email === 'm@m.com' && (
             <Link href="/admin" className="text-red-500 font-bold hover:text-red-600 transition-colors">Админ. панель</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex bg-surface rounded-full p-1 border border-gray-200">
            <button onClick={() => setThemeId('nature')} className={`p-1.5 rounded-full ${theme.id === 'nature' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}><Sun className="w-4 h-4" /></button>
            <button onClick={() => setThemeId('earth')} className={`p-1.5 rounded-full ${theme.id === 'earth' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}><SunMoon className="w-4 h-4" /></button>
            <button onClick={() => setThemeId('tech')} className={`p-1.5 rounded-full ${theme.id === 'tech' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}><Cpu className="w-4 h-4" /></button>
          </div>
          
          <button onClick={toggleCart} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-text">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs flex items-center justify-center rounded-full font-bold animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          <Link href={user?.email === 'm@m.com' ? "/admin" : (user ? "/dashboard" : "/login")} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text">
            {user?.email === 'm@m.com' ? <Settings className="w-6 h-6 text-red-500" /> : <UserIcon className="w-6 h-6" />}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-text" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

export const Footer = () => (
    <footer className="bg-surface border-t border-gray-200 pt-16 pb-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-2xl font-bold text-green-500">
                    <span>MicroGreenLabs</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Инновационные технологии для выращивания свежей микрозелени прямо у вас на кухне.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-6">Магазин</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li><Link href="/shop" className="hover:text-green-500">Каталог</Link></li>
                    <li><Link href="/builder" className="hover:text-green-500">Конфигуратор</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-6">Контакты</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li>{CONTACT_INFO.phone}</li>
                    <li>{CONTACT_INFO.email}</li>
                    <li>{CONTACT_INFO.address}</li>
                </ul>
            </div>
        </div>
    </footer>
);

export const CartDrawer = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart, updateQuantity, clearCart } = useAppContext();
  const router = useRouter();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const handleCheckout = () => { toggleCart(); router.push('/checkout'); };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={toggleCart} className="fixed inset-0 bg-black z-[60]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Ваша корзина</h2>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
              {cart.length === 0 ? <div className="text-center py-10 text-gray-400">Корзина пуста</div> : 
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <ImageWithFallback src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-1">{item.name}</h3>
                      <p className="text-green-500 font-bold">{item.price} ₽</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-100 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1">-</button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 ml-auto"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="p-5 border-t">
              <div className="flex justify-between mb-4 text-lg font-bold"><span>Итого:</span><span>{total} ₽</span></div>
              <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full py-4 rounded-xl font-bold text-white bg-green-500 hover:opacity-90 disabled:opacity-50">Оформить заказ</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};