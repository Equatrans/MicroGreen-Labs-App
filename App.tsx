
import React, { useState, useEffect, createContext, useContext, useMemo, useRef, Suspense, Component } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, Menu, X, Plus, Minus, Trash2, Star, Leaf as LucideLeaf, Box, Phone, Mail, MapPin, CheckCircle, ArrowRight, ChevronRight, ChevronLeft, Layers, Sun, SunMoon, Cpu, Quote, Filter, ArrowUpRight, Loader2, CreditCard, Banknote, Wallet, Map as MapIcon, Sparkles, RefreshCcw, HelpCircle, Settings, Search, Edit, Save, XCircle, LogOut, Image as ImageIcon, Battery, Radio, Fan, Camera, Droplets, Thermometer, Upload, Unplug, LayoutGrid, ArrowDownToLine, ArrowRightFromLine, Zap, AlertCircle, Info, FileDown, Ruler, CheckSquare, Square, ChefHat, Palette, Baby, Activity, Timer, Calendar, ListFilter, Package, Truck, CheckCircle2, XOctagon, RotateCcw, Wind, Maximize2, Minimize2, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Cylinder, Float, Text, Environment, ContactShadows, SoftShadows, AccumulativeShadows, RandomizedLight, useTexture, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { jsPDF } from 'jspdf';
import { Product, Theme, CartItem, Order, Review, CustomKitConfig, ProductVariant, User, Equipment } from './types';
import { THEMES, CONTACT_INFO, INITIAL_PRODUCTS } from './constants';
import { storageService } from './services/storageService';

// --- Constants ---

const STATUS_DETAILS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  pending: { 
      label: 'Принят', 
      color: 'bg-blue-100 text-blue-700 border-blue-200', 
      icon: CheckCircle2,
      desc: 'Заказ принят и ожидает обработки.' 
  },
  processing: { 
      label: 'Сборка', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      icon: Package,
      desc: 'Заказ собирается. Сборка и тестирование персонализированных наборов может длиться 5-7 дней. Проявите терпение и следите за прогрессом.' 
  },
  shipped: { 
      label: 'В пути', 
      color: 'bg-purple-100 text-purple-700 border-purple-200', 
      icon: Truck,
      desc: 'Заказ собран и отправлен по указанному вами адресу.' 
  },
  delivered: { 
      label: 'Доставлен', 
      color: 'bg-green-100 text-green-700 border-green-200', 
      icon: CheckCircle,
      desc: 'Получите ваш заказ!' 
  },
  cancelled: { 
      label: 'Отменен', 
      color: 'bg-red-100 text-red-700 border-red-200', 
      icon: XOctagon,
      desc: 'Заказ отменен администратором или покупателем. Свяжитесь с нами для уточнения подробностей.' 
  },
  returned: { 
      label: 'Возврат', 
      color: 'bg-gray-100 text-gray-700 border-gray-200', 
      icon: RotateCcw,
      desc: 'Покупатель оформил возврат заказа. Товар будет возвращен.' 
  },
};

// --- Contexts ---

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

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// --- Utilities ---

const ImageWithFallback = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
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

    const handleLoad = () => {
        setIsLoading(false);
    };

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

const EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  'Освещение': <Sun className="w-5 h-5 text-yellow-500" />,
  'Вентиляция и циркуляция воздуха': <Fan className="w-5 h-5 text-blue-400" />,
  'Автоматический полив': <Droplets className="w-5 h-5 text-blue-500" />,
  'Подогрев субстрата': <Thermometer className="w-5 h-5 text-red-400" />,
  'Автоматизация и управление': <Cpu className="w-5 h-5 text-purple-500" />,
  'Акустическая стимуляция': <Radio className="w-5 h-5 text-pink-500" />,
  'Мониторинг климата': <Thermometer className="w-5 h-5 text-orange-400" />,
  'Мониторинг влажности': <Droplets className="w-5 h-5 text-cyan-500" />,
  'Контроль освещенности': <Sun className="w-5 h-5 text-yellow-400" />,
  'Автономное питание': <Battery className="w-5 h-5 text-green-500" />,
  'Питание от сети': <Zap className="w-5 h-5 text-yellow-600" />,
};

const getEquipmentIcon = (purpose: string) => {
    return EQUIPMENT_ICONS[purpose] || <Box className="w-5 h-5 text-gray-400" />;
};

// --- Components ---

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<'nature' | 'earth' | 'tech'>('nature');
  const [user, setUser] = useState<User | null>(storageService.getCurrentUser());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-bg', theme.colors.bg);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-muted', theme.colors.muted);
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

const Navbar = () => {
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
        <Link to="/" className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.primary }}>
          <LucideLeaf className="h-8 w-8" />
          <span>MicroGreen<span style={{ color: theme.colors.text }}>Labs</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="hover:text-primary transition-colors font-medium text-text">Главная</Link>
          <Link to="/shop" className="hover:text-primary transition-colors font-medium text-text">Каталог</Link>
          <Link to="/builder" className="hover:text-primary transition-colors font-medium text-text">Конфигуратор</Link>
          <Link to="/reviews" className="hover:text-primary transition-colors font-medium text-text">Отзывы</Link>
          {user?.email === 'm@m.com' && (
             <Link to="/admin" className="text-red-500 font-bold hover:text-red-600 transition-colors">Админ. панель</Link>
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

          <Link to={user?.email === 'm@m.com' ? "/admin" : (user ? "/dashboard" : "/login")} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text">
            {user?.email === 'm@m.com' ? <Settings className="w-6 h-6 text-red-500" /> : <UserIcon className="w-6 h-6" />}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-text" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-surface border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
               <Link to="/" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-text">Главная</Link>
               <Link to="/shop" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-text">Каталог</Link>
               <Link to="/builder" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-text">Конфигуратор</Link>
               <Link to="/reviews" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-text">Отзывы</Link>
               {user?.email === 'm@m.com' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-red-500">Админ. панель</Link>
               )}
               <Link to={user ? (user.email === 'm@m.com' ? "/admin" : "/dashboard") : "/login"} onClick={() => setMenuOpen(false)} className="text-lg font-medium text-text">
                   {user ? 'Личный кабинет' : 'Войти'}
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const ProductDetailModal = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const { addToCart } = useAppContext();
  const allEquipment = useMemo(() => storageService.getEquipment(), []);
  const includedEquipment = useMemo(() => {
    if (!product.equipmentIds) return [];
    return allEquipment.filter(e => product.equipmentIds!.includes(e.id));
  }, [product.equipmentIds, allEquipment]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }} 
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-surface w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors">
          <X className="w-6 h-6 text-gray-800" />
        </button>
        <div className="md:w-2/5 bg-gray-100 relative h-64 md:h-auto">
          <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
             <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                 {product.category === 'kit' ? 'Готовый набор' : product.category === 'seeds' ? 'Семена' : 'Аксессуар'}
             </span>
             {product.isHit && (
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ХИТ
                </span>
             )}
          </div>
        </div>
        <div className="md:w-3/5 p-6 md:p-10 overflow-y-auto flex flex-col bg-surface">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-text mb-2 leading-tight">{product.name}</h2>
                <div className="flex items-center gap-4 mb-4">
                   <div className="flex flex-col">
                        {product.oldPrice && (
                            <span className="text-muted line-through text-lg">{product.oldPrice} ₽</span>
                        )}
                        <span className="text-2xl text-primary font-bold">{product.price} ₽</span>
                   </div>
                   {product.difficulty && (
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                         product.difficulty === 'Easy' ? 'border-green-200 bg-green-50 text-green-600' : 
                         product.difficulty === 'Medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-600' : 
                         'border-red-200 bg-red-50 text-red-600'
                     }`}>
                         {product.difficulty === 'Easy' ? 'Легко' : product.difficulty === 'Medium' ? 'Средне' : 'Сложно'}
                     </span>
                   )}
                </div>
                <p className="text-lg text-muted leading-relaxed">{product.description}</p>
            </div>
            <div className="space-y-8 mb-8">
                <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-primary"/> Описание</h3>
                    <p className="text-text/80 leading-relaxed">{product.details}</p>
                </div>
                {product.dimensions && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Ruler className="w-5 h-5 text-primary"/> Технические характеристики</h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <span className="text-xs text-muted uppercase block mb-1">Габариты (ВxШxД)</span>
                                 <span className="font-medium">{product.dimensions}</span>
                             </div>
                             {product.growthTime && (
                                 <div>
                                    <span className="text-xs text-muted uppercase block mb-1">Время роста</span>
                                    <span className="font-medium">{product.growthTime}</span>
                                 </div>
                             )}
                         </div>
                    </div>
                )}
                {includedEquipment.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-primary"/> Оборудование в комплекте</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {includedEquipment.map(eq => (
                                <div key={eq.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-primary">
                                        {getEquipmentIcon(eq.purpose)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm leading-tight mb-1">{eq.name}</div>
                                        <div className="text-xs text-muted leading-tight">{eq.purpose}</div>
                                        {eq.powerConsumption && eq.powerConsumption !== 'N/A' && (
                                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                <Zap className="w-3 h-3" /> {eq.powerConsumption}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-4 bg-surface sticky bottom-0">
                <button 
                    onClick={() => { addToCart({...product, quantity: 1}); onClose(); }}
                    className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Добавить в корзину
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

const CartDrawer = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart, updateQuantity, clearCart, user } = useAppContext();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const handleCheckout = () => { toggleCart(); navigate('/checkout'); };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={toggleCart} className="fixed inset-0 bg-black z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-5 border-b flex items-center justify-between bg-surface">
              <h2 className="text-xl font-bold text-text">Ваша корзина</h2>
              <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                      <button onClick={clearCart} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 text-xs font-medium text-muted" title="Очистить корзину">
                          <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Очистить</span>
                      </button>
                  )}
                  <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full"><X className="text-text" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bg/50">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Корзина пуста</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-surface p-3 rounded-xl shadow-sm border border-gray-100">
                    {item.image ? (
                      <ImageWithFallback src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"><Box className="text-gray-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text line-clamp-1">{item.name}</h3>
                      {item.variantName && <span className="inline-block bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-xs text-muted mb-1">{item.variantName}</span>}
                      <p className="text-primary font-bold">{item.price} ₽</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-bg rounded-lg border border-gray-200">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-white rounded-l-lg transition-colors">-</button>
                          <span className="px-2 text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-white rounded-r-lg transition-colors">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 ml-auto transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t bg-surface">
              <div className="flex justify-between mb-4 text-lg font-bold text-text">
                <span>Итого:</span>
                <span>{total} ₽</span>
              </div>
              <button 
                onClick={handleCheckout} disabled={cart.length === 0}
                className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Оформить заказ
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- 3D Components ---

interface TextureErrorBoundaryProps {
  children?: React.ReactNode;
  fallback: React.ReactNode;
}

interface TextureErrorBoundaryState {
  hasError: boolean;
}

class TextureErrorBoundary extends Component<TextureErrorBoundaryProps, TextureErrorBoundaryState> {
  state: TextureErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Texture loading failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const CanvasLoader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <div className="text-sm font-bold text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
};

const MusicVisualizer = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 3;
    groupRef.current.children.forEach((child, i) => {
       const mesh = child as THREE.Mesh;
       const material = mesh.material as THREE.MeshBasicMaterial;
       const offset = i * 1.5;
       const cycle = (t + offset) % 5; 
       const scale = 0.5 + (cycle / 5) * 1.5; 
       mesh.scale.setScalar(scale);
       const opacity = Math.max(0, 1.0 - (cycle / 5));
       material.opacity = opacity * 0.6; 
    });
  });
  return (
    <group ref={groupRef} rotation={[Math.PI/2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}><torusGeometry args={[0.15, 0.02, 16, 32]} /><meshBasicMaterial color="#4ade80" transparent toneMapped={false} /></mesh>
      ))}
    </group>
  );
};
const SeedsVisualizer = () => {
    const positions = useMemo(() => {
        const arr = [];
        for(let i=0; i<80; i++) {
            arr.push([(Math.random() - 0.5) * 3.5, 0.78, (Math.random() - 0.5) * 2.5] as [number, number, number]);
        }
        return arr;
    }, []);
    return (
        <group>
            {positions.map((pos, i) => (
                <mesh key={i} position={pos} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.02, 0.05, 4]} /><meshStandardMaterial color="#f59e0b" roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
};
const FanVisualizer = () => {
    const bladesRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += delta * 10; });
    return (
        <group>
            {/* Frame */}
            <RoundedBox args={[0.6, 0.6, 0.15]} radius={0.05} castShadow receiveShadow>
                <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </RoundedBox>
            {/* Inner hole mask */}
            <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.08]}>
                <circleGeometry args={[0.28, 32]} />
                <meshBasicMaterial color="#0f172a" />
            </mesh>
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -0.08]}>
                <circleGeometry args={[0.28, 32]} />
                <meshBasicMaterial color="#0f172a" />
            </mesh>
            
            {/* Blades */}
            <group ref={bladesRef} position={[0, 0, 0]}>
                 <Cylinder args={[0.1, 0.1, 0.1]} rotation={[Math.PI/2, 0, 0]}>
                     <meshStandardMaterial color="#334155" />
                 </Cylinder>
                 {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]} position={[0, 0, 0]}>
                        <boxGeometry args={[0.25, 0.05, 0.02]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                 ))}
            </group>
        </group>
    );
};
const PumpVisualizer = () => {
    return (
        <group>
            <RoundedBox args={[0.5, 0.6, 0.4]} radius={0.05} castShadow receiveShadow><meshStandardMaterial color="#3b82f6" roughness={0.4} /></RoundedBox>
            <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.1, 0.2]} castShadow><meshStandardMaterial color="#1d4ed8" /></Cylinder>
            <group position={[0, 0.3, 0]}>
                <Cylinder args={[0.04, 0.04, 0.8]} position={[0, 0.4, 0]} castShadow><meshPhysicalMaterial color="#93c5fd" transmission={0.5} roughness={0.2} transparent opacity={0.8} /></Cylinder>
                <Cylinder args={[0.04, 0.04, 1.0]} rotation={[0, 0, Math.PI/2]} position={[0.5, 0.8, 0]} castShadow><meshPhysicalMaterial color="#93c5fd" transmission={0.5} roughness={0.2} transparent opacity={0.8} /></Cylinder>
                 <Cylinder args={[0.04, 0.04, 0.6]} position={[1.0, 0.5, 0]} castShadow><meshPhysicalMaterial color="#93c5fd" transmission={0.5} roughness={0.2} transparent opacity={0.8} /></Cylinder>
            </group>
        </group>
    );
};

const HeaterVisualizer = () => (
    <group position={[0, 0.02, 0]}>
        <RoundedBox args={[3.6, 0.05, 2.6]} radius={0.1} receiveShadow>
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </RoundedBox>
        {/* Heat coils visual */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}>
            <planeGeometry args={[3.4, 2.4]} />
            <meshBasicMaterial color="#dc2626" transparent opacity={0.1} />
        </mesh>
        {/* Connector */}
        <RoundedBox args={[0.3, 0.08, 0.2]} position={[1.6, 0.04, 0]} radius={0.02}>
            <meshStandardMaterial color="#000" />
        </RoundedBox>
    </group>
);

const ControllerVisualizer = () => (
    <group>
         <RoundedBox args={[0.6, 0.9, 0.25]} radius={0.05} castShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </RoundedBox>
        {/* Screen with glow */}
        <mesh position={[0, 0.2, 0.13]}>
            <planeGeometry args={[0.4, 0.3]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
         {/* Buttons */}
        <group position={[0, -0.2, 0.13]}>
             <circleGeometry args={[0.05, 16]} />
             <meshStandardMaterial color="#cbd5e1" />
        </group>
         <group position={[-0.15, -0.2, 0.13]}>
             <circleGeometry args={[0.05, 16]} />
             <meshStandardMaterial color="#cbd5e1" />
        </group>
        <group position={[0.15, -0.2, 0.13]}>
             <circleGeometry args={[0.05, 16]} />
             <meshStandardMaterial color="#cbd5e1" />
        </group>
        {/* Antenna */}
        <Cylinder args={[0.01, 0.01, 0.3]} position={[0.2, 0.45, 0]}>
            <meshStandardMaterial color="#1e293b" />
        </Cylinder>
    </group>
);

const CameraVisualizer = () => (
    <group>
        <RoundedBox args={[0.4, 0.3, 0.2]} radius={0.05} castShadow>
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </RoundedBox>
        <Cylinder args={[0.12, 0.12, 0.1]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.11]}>
            <meshStandardMaterial color="#1e293b" />
        </Cylinder>
        <mesh position={[0, 0, 0.165]} rotation={[Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.08, 0.1, 32]} />
            <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI/2, 0, 0]}>
             <circleGeometry args={[0.06, 32]} />
             <meshPhysicalMaterial color="#000" roughness={0} metalness={1} />
        </mesh>
        {/* Antenna */}
        <Cylinder args={[0.01, 0.01, 0.5]} position={[0.15, 0.3, 0]}>
            <meshStandardMaterial color="#000" />
        </Cylinder>
    </group>
);

const TempSensorVisualizer = () => (
  <group>
    <Cylinder args={[0.01, 0.01, 0.5]} position={[0, 0.25, 0]} castShadow>
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </Cylinder>
    <RoundedBox args={[0.08, 0.12, 0.08]} position={[0, 0.5, 0]} castShadow radius={0.02}>
      <meshStandardMaterial color="#f87171" />
    </RoundedBox>
    <mesh position={[0, 0.5, 0.041]}>
         <circleGeometry args={[0.02, 16]} />
         <meshBasicMaterial color="#fff" />
    </mesh>
  </group>
);

const HumiditySensorVisualizer = () => (
  <group>
    <RoundedBox args={[0.12, 0.25, 0.04]} position={[0, 0.3, 0]} castShadow radius={0.02}>
       <meshStandardMaterial color="#0ea5e9" />
    </RoundedBox>
    <group position={[0, 0.1, 0]}>
       <Cylinder args={[0.006, 0.002, 0.3]} position={[-0.03, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.5} /></Cylinder>
       <Cylinder args={[0.006, 0.002, 0.3]} position={[0.03, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.5} /></Cylinder>
    </group>
    <Text position={[0, 0.35, 0.021]} fontSize={0.06} color="white" rotation={[0, 0, 0]}>H₂O</Text>
  </group>
);

const LightSensorVisualizer = () => (
    <group>
        <Cylinder args={[0.08, 0.08, 0.04]} rotation={[Math.PI/2, 0, 0]} castShadow>
            <meshStandardMaterial color="#facc15" />
        </Cylinder>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.021]}>
             <circleGeometry args={[0.06, 16]} />
             <meshBasicMaterial color="#ffffff" />
        </mesh>
    </group>
);

const TimerVisualizer = () => (
    <group>
        <RoundedBox args={[0.15, 0.25, 0.05]} radius={0.02} castShadow>
             <meshStandardMaterial color="#94a3b8" />
        </RoundedBox>
        <mesh position={[0, 0.05, 0.026]}>
             <circleGeometry args={[0.05, 16]} />
             <meshBasicMaterial color="#000" />
        </mesh>
         <mesh position={[0, 0.05, 0.027]}>
             <planeGeometry args={[0.01, 0.04]} />
             <meshBasicMaterial color="#ef4444" />
        </mesh>
        <group position={[0, -0.06, 0.03]}>
             <planeGeometry args={[0.08, 0.04]} />
             <meshBasicMaterial color="#1e293b" />
        </group>
    </group>
);

const VentVisualizer = ({ isDomed }: { isDomed: boolean }) => {
    const ventColor = "#334155";
    const yPos = isDomed ? 1.0 : 0.1;
    return (
      <group>
        {/* Left Wall Vents */}
        <group position={[-2.01, yPos, 0]} rotation={[0, 0, Math.PI/2]}>
           <Cylinder args={[isDomed ? 0.3 : 0.05, isDomed ? 0.3 : 0.05, 0.05]} rotation={[0,0,0]}>
               <meshStandardMaterial color={ventColor} />
           </Cylinder>
           {isDomed && (
               <>
               <Cylinder args={[0.3, 0.3, 0.05]} position={[0, 0.8, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               <Cylinder args={[0.3, 0.3, 0.05]} position={[0, -0.8, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               </>
           )}
           {!isDomed && (
               <>
               <Cylinder args={[0.05, 0.05, 0.05]} position={[0, 0.5, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               <Cylinder args={[0.05, 0.05, 0.05]} position={[0, -0.5, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               </>
           )}
        </group>
        {/* Right Wall Vents */}
        <group position={[2.01, yPos, 0]} rotation={[0, 0, Math.PI/2]}>
           <Cylinder args={[isDomed ? 0.3 : 0.05, isDomed ? 0.3 : 0.05, 0.05]} rotation={[0,0,0]}>
               <meshStandardMaterial color={ventColor} />
           </Cylinder>
           {isDomed && (
               <>
               <Cylinder args={[0.3, 0.3, 0.05]} position={[0, 0.8, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               <Cylinder args={[0.3, 0.3, 0.05]} position={[0, -0.8, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               </>
           )}
           {!isDomed && (
               <>
               <Cylinder args={[0.05, 0.05, 0.05]} position={[0, 0.5, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               <Cylinder args={[0.05, 0.05, 0.05]} position={[0, -0.5, 0]}><meshStandardMaterial color={ventColor} /></Cylinder>
               </>
           )}
        </group>
      </group>
    );
};

const SubstrateLayer: React.FC<{ type: string }> = ({ type }) => {
    const textureUrl = type === 'coco' 
        ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=512' 
        : 'https://images.unsplash.com/photo-1523293836414-f04e712e1f3b?auto=format&fit=crop&q=80&w=512';
    
    const texture = useTexture(textureUrl);
    
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);

    return (
        <RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.7, 0]} receiveShadow>
             <meshStandardMaterial 
                map={texture} 
                color={type === 'coco' ? '#6d4c41' : '#e0e0e0'} 
                roughness={0.9} 
                bumpMap={texture}
                bumpScale={0.05}
            />
        </RoundedBox>
    );
};

const GrowBoxUnit: React.FC<{ config: CustomKitConfig; position?: [number, number, number] }> = ({ config, position = [0, 0, 0] }) => {
    const leafShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.5, 0.5, 0, 1);
        shape.quadraticCurveTo(-0.5, 0.5, 0, 0);
        return shape;
    }, []);
    const substrateColor = config.substrate === 'coco' ? '#4e342e' : config.substrate === 'linen' ? '#d6d3d1' : '#f1f5f9';
    
    const isDomed = config.lidType.includes('domed');
    const hasVents = config.lidType.includes('vent');

    return (
        <group position={position}>
            {/* Tray with realistic plastic PBR */}
            <RoundedBox args={[4, 1.5, 3]} radius={0.1} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
                <meshPhysicalMaterial 
                    color={config.trayColor} 
                    roughness={0.3} 
                    metalness={0.1} 
                    clearcoat={0.8} 
                    clearcoatRoughness={0.2}
                    reflectivity={0.5}
                />
            </RoundedBox>
            
            <group position={[-1.2, 0.4, 1.51]}>
                <mesh position={[-0.3, 0.05, 0]} rotation={[0, 0, -0.5]} scale={0.25}><shapeGeometry args={[leafShape]} /><meshStandardMaterial color="#4ade80" /></mesh>
                <Text position={[0, 0, 0]} fontSize={0.175} color="#4ade80" anchorX="left" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">MicroGreen</Text>
                <Text position={[1.05, 0, 0]} fontSize={0.175} color="#0f172a" anchorX="left" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">Labs</Text>
            </group>
            
            {/* Heater Visualizer */}
            {config.hasHeater && (
                <group position={[0, 0.2, 0]}>
                    <HeaterVisualizer />
                </group>
            )}

            {/* Substrate with Texture and Error Boundary */}
            <Suspense fallback={<RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.7, 0]} receiveShadow><meshStandardMaterial color={substrateColor} roughness={0.9} /></RoundedBox>}>
                <TextureErrorBoundary fallback={<RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.7, 0]} receiveShadow><meshStandardMaterial color={substrateColor} roughness={0.9} /></RoundedBox>}>
                    <SubstrateLayer type={config.substrate} />
                </TextureErrorBoundary>
            </Suspense>

            {config.seeds.length > 0 && <SeedsVisualizer />}
            
            {/* Lid with realistic glass/acrylic PBR */}
            {isDomed ? (
                    <RoundedBox args={[4, 2, 3]} radius={0.1} position={[0, 1.7, 0]} castShadow={false}>
                    <meshPhysicalMaterial 
                        color="#ffffff" 
                        transmission={0.98} 
                        opacity={0.5} 
                        transparent 
                        roughness={0.05} 
                        thickness={0.5} 
                        ior={1.5}
                        clearcoat={1}
                    />
                    </RoundedBox>
            ) : (
                <RoundedBox args={[4, 0.2, 3]} radius={0.1} position={[0, 0.85, 0]} castShadow={false}>
                        <meshPhysicalMaterial 
                            color="#ffffff" 
                            transmission={0.98} 
                            opacity={0.5} 
                            transparent 
                            roughness={0.05} 
                            thickness={0.1} 
                            ior={1.5}
                            clearcoat={1}
                        />
                </RoundedBox>
            )}

            {hasVents && <VentVisualizer isDomed={isDomed} />}

            {config.powerType === 'battery' && (
                <RoundedBox args={[0.8, 0.4, 0.2]} position={[2.1, 0, 0]} rotation={[0, 0, 0]} castShadow>
                        <meshStandardMaterial color="#22c55e" /><mesh position={[0, 0, 0.11]}><planeGeometry args={[0.6, 0.2]} /><meshBasicMaterial color="#15803d" /></mesh>
                </RoundedBox>
            )}
            {config.hasLight && (
                <group position={[0, isDomed ? 3.5 : 2.5, 0]}>
                     {config.lidType.includes('flat') && (<><Cylinder args={[0.05, 0.05, 1.5]} position={[-1.8, -0.75, 0]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.05, 0.05, 1.5]} position={[1.8, -0.75, 0]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder></>)}
                    <RoundedBox args={[4.0, 0.15, 0.6]} position={[0, 0, 0]} radius={0.05} castShadow><meshStandardMaterial color="#f8fafc" roughness={0.2} /></RoundedBox>
                    <mesh position={[0, -0.08, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[3.8, 0.4]} /><meshStandardMaterial color="#ffffff" emissive="#c084fc" emissiveIntensity={4} toneMapped={false} /></mesh>
                    <spotLight position={[0, -0.1, 0]} angle={1.1} penumbra={0.3} intensity={4} color="#e9d5ff" distance={10} castShadow />
                    <pointLight position={[0, -0.3, 0]} intensity={2} color="#d8b4fe" distance={4} decay={2} />
                    
                    {config.hasLightSensor && (
                         <group position={[1.5, -0.1, 0]}>
                             <LightSensorVisualizer />
                         </group>
                    )}
                </group>
            )}
            
            {config.hasTimer && !config.hasController && (
                 <group position={[2.05, 0.8, 0]} rotation={[0, Math.PI/2, 0]}>
                     <TimerVisualizer />
                 </group>
            )}

            {config.hasController && (
                <group position={[-2.1, 0.2, 1]}>
                    <ControllerVisualizer />
                </group>
            )}
            {config.hasPump && (<group position={[-2.3, -0.5, -0.8]}><PumpVisualizer /></group>)}
            {(config.hasSensors || config.hasTempSensor || config.hasHumiditySensor) && (
                <group>
                     {/* Display Unit on Left Wall */}
                    <group position={[-2.02, 0.4, 0]} rotation={[0, -Math.PI/2, 0]}>
                        <RoundedBox args={[0.8, 0.4, 0.1]} radius={0.05} castShadow>
                            <meshStandardMaterial color="#1e293b" />
                        </RoundedBox>
                        <mesh position={[0, 0, 0.055]}>
                            <planeGeometry args={[0.6, 0.25]} />
                            <meshBasicMaterial color="#10b981" toneMapped={false} />
                        </mesh>
                        <Text position={[-0.15, 0, 0.06]} fontSize={0.08} color="#064e3b" anchorX="center" anchorY="middle">
                            {config.hasTempSensor ? "24.5°C" : "--"}
                        </Text>
                        <Text position={[0.15, 0, 0.06]} fontSize={0.08} color="#064e3b" anchorX="center" anchorY="middle">
                            {config.hasHumiditySensor ? "58%" : "--"}
                        </Text>
                    </group>
                    
                    {config.hasTempSensor && (
                        <group position={[1.4, 0.7, 0.8]}>
                            <TempSensorVisualizer />
                        </group>
                    )}
                    {config.hasHumiditySensor && (
                        <group position={[-1.4, 0.7, 0.8]}>
                            <HumiditySensorVisualizer />
                        </group>
                    )}
                </group>
            )}
            {config.hasCamera && (
                <group position={[0, isDomed ? 2.8 : 1.2, 0]}>
                    <CameraVisualizer />
                </group>
            )}
            {config.hasFan && (
                <group position={[1.5, isDomed ? 1.5 : 0.8, 0]} rotation={[0, Math.PI/2, 0]}>
                    <FanVisualizer />
                </group>
            )}
            {config.hasMusic && (
                <group position={[1.0, -0.2, 1.55]} rotation={[0, 0, 0]}><RoundedBox args={[0.8, 0.5, 0.2]} radius={0.05} castShadow><meshStandardMaterial color="#334155" roughness={0.4} /></RoundedBox><group position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><Cylinder args={[0.2, 0.2, 0.02, 32]}><meshStandardMaterial color="#0f172a" /></Cylinder><mesh position={[0, 0.02, 0]}><ringGeometry args={[0.18, 0.2, 32]} /><meshBasicMaterial color="#94a3b8" /></mesh></group><group position={[0, 0, 0.15]}><MusicVisualizer /></group><mesh position={[0.3, 0.15, 0.11]}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="#f472b6" toneMapped={false} /></mesh></group>
            )}
        </group>
    );
};
const FarmAssembly: React.FC<{ config: CustomKitConfig }> = ({ config }) => {
    const Connector = ({ position }: { position: [number, number, number] }) => (<group position={position}><RoundedBox args={[0.4, 0.1, 0.3]} radius={0.02} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#475569" /></RoundedBox></group>);
    const stackOffset = config.lidType.includes('domed') ? 3.5 : 2.5;
    if (config.layout === 'single') return <GrowBoxUnit config={config} />;
    if (config.layout === 'double-h') return (<group><GrowBoxUnit config={config} position={[-2.1, 0, 0]} /><Connector position={[0, 0, 0]} /><GrowBoxUnit config={config} position={[2.1, 0, 0]} /></group>);
    if (config.layout === 'double-v') { return (<group position={[0, -1.5, 0]}><GrowBoxUnit config={config} position={[0, 0, 0]} /><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group>); }
    if (config.layout === 'quad') { return (<group position={[0, -1.5, 0]}><group position={[-2.1, 0, 0]}><GrowBoxUnit config={config} /><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group><Connector position={[0, 0, 0]} /><Connector position={[0, stackOffset, 0]} /><group position={[2.1, 0, 0]}><GrowBoxUnit config={config} /><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, 1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[-1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><Cylinder args={[0.1, 0.1, stackOffset]} position={[1.9, stackOffset/2 - 0.5, -1.4]} castShadow><meshStandardMaterial color="#94a3b8"/></Cylinder><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group></group>); }
    return <GrowBoxUnit config={config} />;
};
const Kit3DBuilder = () => {
  const { addToCart, theme } = useAppContext();
  const [config, setConfig] = useState<CustomKitConfig>({ trayColor: '#e2e8f0', substrate: 'linen', seeds: [], lidType: 'flat', layout: 'single', powerType: 'grid', hasLight: false, hasFan: false, hasPump: false, hasHeater: false, hasSensors: false, hasTempSensor: false, hasHumiditySensor: false, hasController: false, hasCamera: false, hasMusic: false, autoMode: false, hasLightSensor: false, hasTimer: false });
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const availableSeeds = useMemo(() => storageService.getProducts().filter(p => p.category === 'seeds'), []);
  useEffect(() => { 
      if (config.autoMode) { 
          setConfig(prev => ({ 
              ...prev, 
              hasController: true,
              hasTempSensor: true,
              hasHumiditySensor: true,
              hasLightSensor: true,
              hasFan: true,
              hasLight: true,
              hasPump: true
          })); 
      }
  }, [config.autoMode]);
  const calculatePrice = () => { let base = 1500; if (config.hasLight) base += 1200; if (config.hasFan) base += 600; if (config.hasPump) base += 800; if (config.hasHeater) base += 900; if (config.hasSensors) base += 1500; if (config.hasTempSensor) base += 300; if (config.hasHumiditySensor) base += 350; if (config.hasCamera) base += 2000; if (config.hasMusic) base += 1800; if (config.hasController) base += 2500; if (config.powerType === 'battery') base += 1000; if (config.hasLightSensor) base += 250; if (config.hasTimer) base += 450; let multiplier = 1; if (config.layout === 'double-h' || config.layout === 'double-v') multiplier = 2; if (config.layout === 'quad') multiplier = 4; let total = base * multiplier; if (multiplier > 1) total *= 0.9; return Math.round(total); };
  const price = calculatePrice();
  const handleAddToCart = () => { addToCart({ id: `custom-${Date.now()}`, name: `Smart Farm (${config.layout} / ${config.autoMode ? 'Auto' : 'Manual'})`, price: price, quantity: 1, customConfig: config, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400' }); };
  const handleDownloadPDF = () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF();
          pdf.setFontSize(20); pdf.text("MicroGreenLabs Specification", 20, 20);
          pdf.addImage(imgData, 'PNG', 20, 30, 170, 100);
          pdf.setFontSize(12); let y = 140;
          pdf.text(`Configuration: ${config.layout.toUpperCase()}`, 20, y); y += 10; pdf.text(`Tray Color: ${config.trayColor}`, 20, y); y += 10; pdf.text(`Substrate: ${config.substrate}`, 20, y); y += 10; pdf.text(`Lid Type: ${config.lidType}`, 20, y); y += 10; pdf.text(`Power: ${config.powerType}`, 20, y); y += 10; pdf.text("Included Hardware:", 20, y); y += 10;
          if(config.hasLight) { pdf.text("- LED Grow Light", 30, y); y += 7; } if(config.hasFan) { pdf.text("- Ventilation Fan", 30, y); y += 7; } if(config.hasPump) { pdf.text("- Auto Watering Pump", 30, y); y += 7; } if(config.hasTempSensor) { pdf.text("- Temperature Sensor", 30, y); y += 7; } if(config.hasHumiditySensor) { pdf.text("- Humidity Sensor", 30, y); y += 7; } if(config.hasController) { pdf.text("- Smart Controller", 30, y); y += 7; } if(config.hasMusic) { pdf.text("- Music Box Module", 30, y); y += 7; } if(config.hasLightSensor) { pdf.text("- Light Sensor", 30, y); y += 7; } if(config.hasTimer) { pdf.text("- Timer/Dimmer", 30, y); y += 7; }
          y += 10; pdf.setFontSize(16); pdf.text(`Total Price: ${price} RUB`, 20, y); pdf.save("my-growbox-config.pdf");
      }
  };
  const tabs = [ { id: 'base', icon: <Box />, label: 'Основа' }, { id: 'power', icon: <Battery />, label: 'Питание' }, { id: 'hardware', icon: <Cpu />, label: 'Оборудование' }, ];
  const hardwareOptions = [ { key: 'hasLight', label: 'Фитолампа', icon: <Sun />, desc: 'Ускоряет фотосинтез в 2 раза. Имитирует солнечный свет.' }, { key: 'hasFan', label: 'Вентиляция', icon: <Fan />, desc: 'Предотвращает плесень, укрепляет стебли растений.' }, { key: 'hasPump', label: 'Автополив', icon: <Droplets />, desc: 'Автоматический полив по расписанию. Экономит время.' }, { key: 'hasHeater', label: 'Подогрев', icon: <Thermometer />, desc: 'Поддерживает темп. 22-25°C для быстрой всхожести.' }, { key: 'hasTempSensor', label: 'Датчик темп.', icon: <Thermometer className="text-orange-400"/>, desc: 'Внутренний датчик для точного контроля климата.' }, { key: 'hasHumiditySensor', label: 'Датчик влажн.', icon: <Droplets className="text-cyan-400"/>, desc: 'Датчик влажности почвы для идеального полива.' }, { key: 'hasCamera', label: 'Камера', icon: <Camera />, desc: 'Наблюдайте за ростом через смартфон из любой точки.' }, { key: 'hasMusic', label: 'Music Box', icon: <Radio />, desc: 'Акустическая стимуляция роста. Экспериментальная технология.' }, { key: 'hasLightSensor', label: 'Датчик света', icon: <Sun className="text-yellow-600"/>, desc: 'Авто-регулировка яркости лампы.' }, { key: 'hasTimer', label: 'Таймер', icon: <Timer />, desc: 'Простой таймер для управления светом (без контроллера).' }, { key: 'hasController', label: 'Smart Controller', icon: <Cpu className="text-purple-500" />, desc: 'Центр умного дома для вашей фермы.' } ];
  const hoveredItem = useMemo(() => hardwareOptions.find(opt => opt.key === hoveredOption), [hoveredOption]);
  return (
    <div className="relative h-[85vh] md:h-[600px] bg-bg rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200">
      <div className="flex-1 relative cursor-move bg-gradient-to-b from-gray-50 to-gray-100 touch-none">
         <Canvas shadows camera={{ position: [8, 5, 8], fov: 45 }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true }} >
             <Suspense fallback={<CanvasLoader />}>
                 <Environment preset="city" /><ambientLight intensity={0.4} /><spotLight position={[10, 10, 5]} angle={0.5} penumbra={1} intensity={2} castShadow shadow-bias={-0.0001} /><directionalLight position={[-5, 5, 5]} intensity={0.5} />
                 <group position={[0, -1, 0]}><FarmAssembly config={config} /></group>
                 <ContactShadows position={[0, -1.01, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                 <OrbitControls makeDefault target={[0, 0, 0]} minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} enableDamping={true} dampingFactor={0.05} rotateSpeed={0.6} zoomSpeed={0.8} panSpeed={0.8} enablePan={false} minDistance={5} maxDistance={25} />
             </Suspense>
         </Canvas>
         <motion.div className="absolute top-6 right-6 z-10">
             <motion.div 
                key={price} // Triggers animation on price change
                initial={{ backgroundColor: "rgba(255,255,255,0.8)", scale: 1 }}
                animate={{ 
                    backgroundColor: ["rgba(255,255,255,0.8)", "rgba(250, 204, 21, 0.3)", "rgba(255,255,255,0.8)"],
                    scale: [1, 1.05, 1]
                }}
                transition={{ duration: 0.4 }}
                className="backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4"
             >
                 <div className="flex flex-col items-end">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">Итого</div>
                    <motion.div 
                        key={price + 'val'}
                        initial={{ opacity: 0.5, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-2xl font-bold tabular-nums text-primary"
                    >
                        {price} ₽
                    </motion.div>
                 </div>
                 <button 
                    onClick={handleAddToCart}
                    className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center text-primary transition-all duration-300 shadow-sm"
                    title="Добавить в корзину"
                >
                    <motion.div 
                        key={price + 'btn'} 
                        initial={{ rotate: -45, scale: 0.8 }} 
                        animate={{ rotate: 0, scale: 1 }}
                    >
                         <ShoppingBag className="w-5 h-5" />
                    </motion.div>
                 </button>
             </motion.div>
         </motion.div>
         <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
             <button onClick={() => setConfig({...config, autoMode: !config.autoMode})} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all font-bold ${config.autoMode ? 'bg-primary text-white' : 'bg-surface text-text hover:bg-gray-50'}`}><Sparkles className={`w-5 h-5 ${config.autoMode ? 'animate-pulse' : ''}`} /><span>{config.autoMode ? 'Авто-режим ВКЛ' : 'Авто-режим ВЫКЛ'}</span></button>
             <button onClick={() => setConfig({...config, hasLight: !config.hasLight})} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all font-bold ${config.hasLight ? 'bg-yellow-400 text-black' : 'bg-surface text-text hover:bg-gray-50'}`}><Sun className={`w-5 h-5 ${config.hasLight ? 'fill-current' : ''}`} /><span>{config.hasLight ? 'Свет ВКЛ' : 'Свет ВЫКЛ'}</span></button>
             {config.hasLight && (
                <div className="absolute top-0 left-full ml-4 p-2 bg-white rounded-xl shadow-lg flex flex-col gap-2">
                    <button onClick={() => setConfig(p => ({...p, hasLightSensor: !p.hasLightSensor}))} title="Датчик света" className={`p-2 rounded-lg ${config.hasLightSensor ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}><Sun className="w-4 h-4"/></button>
                </div>
             )}
         </div>
         <AnimatePresence>{hoveredItem && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute z-20 pointer-events-none bottom-[55%] left-4 right-4 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 md:w-72 p-4 bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50"><div className="font-bold text-primary mb-1 flex items-center gap-2">{hoveredItem.icon}{hoveredItem.label}</div><p className="text-sm text-muted leading-relaxed">{hoveredItem.desc}</p><div className="absolute md:hidden bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-gray-200 rotate-45"></div><div className="hidden md:block absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-surface border-l border-b border-gray-200 rotate-45"></div></motion.div>)}</AnimatePresence>
      </div>
      <AnimatePresence>{activeTab && (<motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", bounce: 0.2 }} className="absolute bottom-20 left-0 right-0 bg-surface/95 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-gray-200 p-6 z-30 h-auto"><div className="flex justify-between items-center mb-4 sticky top-0 bg-surface/95 py-2 z-10"><h3 className="font-bold text-lg">{tabs.find(t => t.id === activeTab)?.label}</h3><button onClick={() => setActiveTab(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div><div className="pb-2">
      {activeTab === 'base' && (
        <div className="flex flex-col gap-5">
            {/* Top Row: Compact Grid for Settings */}
            <div className="grid grid-cols-12 gap-4">
                {/* Left: Layout Grid (15-puzzle style) */}
                <div className="col-span-12 md:col-span-4">
                    <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Конфигурация</label>
                    <div className="grid grid-cols-2 gap-2 aspect-square">
                        {[{id: 'single', icon: <Box className="w-5 h-5" />, label: '1'},{id: 'double-h', icon: <ArrowRightFromLine className="w-5 h-5" />, label: '2H'},{id: 'double-v', icon: <ArrowDownToLine className="w-5 h-5" />, label: '2V'},{id: 'quad', icon: <LayoutGrid className="w-5 h-5" />, label: '4X'}].map(l => (
                            <button key={l.id} onClick={() => setConfig({...config, layout: l.id as any})} className={`flex flex-col items-center justify-center p-1 rounded-xl border text-[10px] font-bold transition-all ${config.layout === l.id ? 'border-primary bg-primary text-white shadow-md scale-105' : 'border-gray-200 hover:bg-gray-50 text-muted'}`}>
                                {l.icon}
                                <span className="mt-1">{l.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Center: Lid Config (4 options Grid) */}
                <div className="col-span-12 md:col-span-4">
                     <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Крышка</label>
                     <div className="grid grid-cols-2 gap-2 aspect-square">
                        {[{id: 'flat', label: 'Плоская', icon: <Minimize2 className="w-5 h-5"/>},
                          {id: 'flat-vent', label: 'Пл.+Вент', icon: <div className="flex items-center"><Minimize2 className="w-4 h-4"/><Wind className="w-3 h-3 -ml-1 text-blue-400"/></div>},
                          {id: 'domed', label: 'Купол', icon: <Maximize2 className="w-5 h-5"/>},
                          {id: 'domed-vent', label: 'Куп.+Вент', icon: <div className="flex items-center"><Maximize2 className="w-4 h-4"/><Wind className="w-3 h-3 -ml-1 text-blue-400"/></div>}
                        ].map(t => (
                            <button key={t.id} onClick={() => setConfig({...config, lidType: t.id as any})} className={`flex flex-col items-center justify-center p-1 rounded-xl border text-[10px] font-bold transition-all ${config.lidType === t.id ? 'border-primary bg-primary text-white shadow-md scale-105' : 'border-gray-200 hover:bg-gray-50 text-muted'}`}>
                                {t.icon}
                                <span className="mt-1">{t.label}</span>
                            </button>
                        ))}
                     </div>
                </div>

                {/* Right: Styles (Colors & Substrate) */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-5 justify-center">
                     <div>
                        <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Цвет лотка</label>
                        <div className="flex gap-3 items-center flex-wrap">
                            {['#ffffff', '#e2e8f0', '#1e293b', '#fca5a5', '#86efac'].map(c => (
                                <button key={c} onClick={() => setConfig({...config, trayColor: c})} className={`w-10 h-10 rounded-full shadow-sm transition-transform ${config.trayColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none' }} />
                            ))}
                        </div>
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Субстрат</label>
                         <div className="flex flex-col gap-2">
                            {[{id: 'coco', label: 'Кокосовый'}, {id: 'linen', label: 'Льняной'}, {id: 'wool', label: 'Агровата'}].map(s => (
                                <button key={s.id} onClick={() => setConfig({...config, substrate: s.id as any})} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${config.substrate === s.id ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-muted hover:bg-gray-50'}`}>
                                    {s.label}
                                </button>
                            ))}
                         </div>
                     </div>
                </div>
            </div>

            {/* Bottom: Horizontal Scrollable Seeds */}
            <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-2 block">Семена в наборе</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {availableSeeds.map(s => (
                        <button key={s.id} onClick={() => { const newSeeds = config.seeds.includes(s.id) ? config.seeds.filter(id => id !== s.id) : [...config.seeds, s.id]; setConfig({...config, seeds: newSeeds}); }} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${config.seeds.includes(s.id) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                            {s.name.replace('Семена ', '')}
                        </button>
                    ))}
                    {availableSeeds.length === 0 && <span className="text-xs text-muted italic">Нет доступных семян</span>}
                </div>
            </div>
        </div>
      )}
      {activeTab === 'power' && (<div className="grid grid-cols-2 gap-4">{[{id: 'grid', label: 'От сети', icon: <Zap />}, {id: 'battery', label: 'Аккумулятор', icon: <Battery />}, {id: 'mixed', label: 'Гибрид', icon: <RefreshCcw />},{id: 'none', label: 'Без подкл.', icon: <Unplug />}].map(p => (<button key={p.id} onClick={() => setConfig({...config, powerType: p.id as any})} className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 ${config.powerType === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 hover:bg-gray-50'}`}>{p.icon}<span className="text-sm font-medium">{p.label}</span></button>))}</div>)}
      {activeTab === 'hardware' && (<div className="grid grid-cols-2 gap-3">{hardwareOptions.map(item => (<div key={item.key} className="relative" onMouseEnter={() => setHoveredOption(item.key)} onMouseLeave={() => setHoveredOption(null)}><button onClick={() => setConfig({...config, [item.key]: !config[item.key as keyof CustomKitConfig]})} className={`w-full p-3 rounded-xl border flex items-center gap-3 ${config[item.key as keyof CustomKitConfig] ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 hover:bg-gray-50 text-muted'}`}>{item.icon}<span className="text-sm font-medium">{item.label}</span></button></div>))}</div>)}</div></motion.div>)}</AnimatePresence>
      <div className="bg-surface border-t border-gray-200 p-2 md:p-4 z-40 relative shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center gap-2 md:justify-center md:gap-8">
              {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)} className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl flex-1 md:flex-none transition-colors ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text hover:bg-gray-100'}`}>{tab.icon}<span className="text-xs font-medium">{tab.label}</span></button>))}
               <button onClick={handleDownloadPDF} className="bg-surface border border-gray-200 text-text px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold hover:bg-gray-50 ml-2" title="Скачать PDF"><ArrowDownToLine className="w-5 h-5" /></button>
              <button onClick={handleAddToCart} className="bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 ml-2 flex items-center gap-2 whitespace-nowrap"><ShoppingBag className="w-5 h-5" /><span className="hidden sm:inline">В корзину</span></button>
          </div>
      </div>
    </div>
  );
};

const TopRatedPromo = () => {
    const products = useMemo(() => storageService.getProducts().filter(p => p.isHit), []);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addToCart } = useAppContext();

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-12 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Star className="text-yellow-400 fill-current" /> Хиты продаж
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white shadow-sm hover:shadow-md border border-gray-100"><ChevronLeft className="w-5 h-5" /></button>
                         <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white shadow-sm hover:shadow-md border border-gray-100"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
                    {products.map(product => (
                        <div key={product.id} className="min-w-[280px] w-[280px] snap-start bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="relative h-48 overflow-hidden">
                                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Хит
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg mb-1 leading-tight">{product.name}</h3>
                                <div className="flex items-baseline gap-2 mb-3">
                                    {product.oldPrice && <span className="text-xs text-gray-400 line-through">{product.oldPrice} ₽</span>}
                                    <span className="text-primary font-bold">{product.price} ₽</span>
                                </div>
                                <div className="mt-auto">
                                    <button onClick={() => addToCart({...product, quantity: 1})} className="w-full py-2 rounded-xl border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors text-sm">
                                        В корзину
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const RecommendationQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const products = useMemo(() => storageService.getProducts(), []);

  const questions = [
    { 
        id: 'exp', 
        question: 'Ваш опыт в выращивании?', 
        options: [
            { id: 'new', label: 'Я новичок', icon: <Baby className="w-5 h-5"/> }, 
            { id: 'pro', label: 'Есть опыт', icon: <ChefHat className="w-5 h-5"/> }
        ] 
    },
    { 
        id: 'goal', 
        question: 'Ваша главная цель?', 
        options: [
            { id: 'eat', label: 'Еда и Витамины', icon: <Activity className="w-5 h-5"/> }, 
            { id: 'decor', label: 'Хобби и Декор', icon: <Palette className="w-5 h-5"/> }
        ] 
    },
    { 
        id: 'time', 
        question: 'Сколько времени готовы уделять?', 
        options: [
            { id: 'min', label: 'Минимум', icon: <Timer className="w-5 h-5"/> }, 
            { id: 'med', label: 'Иногда', icon: <Calendar className="w-5 h-5"/> }
        ] 
    },
  ];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
        setSearching(true);
        setTimeout(() => {
            let rec = 'kit-001'; // Default
            if (newAnswers.includes('new')) rec = 'kit-001';
            if (newAnswers.includes('pro') && newAnswers.includes('eat')) rec = 'kit-006';
            if (newAnswers.includes('decor')) rec = 'kit-004';
            if (newAnswers.includes('min')) rec = 'kit-003';
            setResult(rec);
            setSearching(false);
        }, 1500);
    }
  };

  const recProduct = products.find(p => p.id === result);

  return (
    <div className="my-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-2xl mx-auto bg-surface/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Подберем идеальный набор?</h2>
            <p className="text-muted">Ответьте на 3 простых вопроса</p>
        </div>

        <AnimatePresence mode="wait">
            {searching ? (
                <motion.div 
                    key="searching"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-primary animate-pulse">Анализируем ваши ответы...</p>
                </motion.div>
            ) : !result ? (
                <motion.div 
                    key={step}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                >
                    <h3 className="text-xl font-bold mb-6 text-center">{questions[step].question}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {questions[step].options.map(opt => (
                            <button 
                                key={opt.id} 
                                onClick={() => handleAnswer(opt.id)}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-transparent bg-gray-50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                    {opt.icon}
                                </div>
                                <span className="font-bold text-text group-hover:text-primary">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                     <div className="mt-8 flex justify-center gap-2">
                        {questions.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </motion.div>
            ) : (
                 <motion.div 
                    key="result"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                 >
                    <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold mb-4">
                        Мы нашли идеальный вариант!
                    </div>
                    {recProduct && (
                        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row items-center gap-6 text-left">
                            <ImageWithFallback src={recProduct.image} alt={recProduct.name} className="w-full md:w-1/3 h-48 object-cover rounded-xl" />
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">{recProduct.name}</h3>
                                <p className="text-muted mb-4 line-clamp-2">{recProduct.description}</p>
                                <Link to={`/shop?product=${recProduct.id}`} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                                    Посмотреть набор <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                    <button onClick={() => { setStep(0); setAnswers([]); setResult(null); }} className="mt-6 text-muted hover:text-text underline text-sm">
                        Пройти тест заново
                    </button>
                 </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ReviewsCarousel = () => {
  const reviews = useMemo(() => storageService.getReviews().filter(r => r.rating >= 4).slice(0, 5), []);
  return (
    <div className="py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Отзывы счастливых фермеров</h2>
        <div className="flex gap-6 overflow-x-auto px-4 pb-8 snap-x scrollbar-hide">
            {reviews.map(review => (
                <div key={review.id} className="min-w-[300px] bg-white p-6 rounded-2xl shadow-sm border border-gray-100 snap-center">
                    <div className="flex items-center gap-1 mb-3 text-yellow-400">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{review.comment}"</p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                            {review.userName.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{review.userName}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const Reviews = () => {
    const { user } = useAppContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    
    useEffect(() => {
        setReviews(storageService.getReviews());
    }, []);

    return (
        <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Отзывы покупателей</h1>
            
            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map(rev => (
                    <div key={rev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-primary">
                                    {rev.userName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold">{rev.userName}</div>
                                    <div className="text-xs text-gray-400">{new Date(rev.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FAQ = () => {
    const faqs = [
        { q: "Сложно ли выращивать?", a: "Очень просто! Наши наборы созданы для новичков. Нужно лишь поливать и ждать 7-10 дней." },
        { q: "Нужна ли земля?", a: "Нет, мы используем чистые льняные или кокосовые коврики. Никакой грязи на кухне." },
        { q: "Это безопасно для детей?", a: "Абсолютно. Все материалы экологичны, семена не обработаны химикатами." }
    ];
    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
             <h2 className="text-2xl font-bold text-center mb-8">Частые вопросы</h2>
             <div className="space-y-4">
                 {faqs.map((faq, i) => (
                     <details key={i} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                         <summary className="p-4 font-bold cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                             {faq.q}
                             <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90 text-gray-400" />
                         </summary>
                         <div className="p-4 pt-0 text-gray-600 leading-relaxed">
                             {faq.a}
                         </div>
                     </details>
                 ))}
             </div>
        </div>
    );
};

const ConfiguratorPromo = () => {
  return (
    <section className="py-20 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white -z-10" />
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm mb-6 flex items-center gap-2 w-max">
            <Cpu className="w-4 h-4" /> 3D Конфигуратор
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">Создайте ферму своей мечты</h2>
          <p className="text-lg text-muted mb-8 leading-relaxed">
            Используйте наш уникальный 3D-конструктор, чтобы спроектировать идеальную систему для вашего дома. Выбирайте цвета, добавляйте модули, датчики и умную электронику.
          </p>
          
          <div className="space-y-4 mb-8">
            {[
              "Визуализация в реальном времени",
              "Подбор оборудования и расчет стоимости",
              "Проверка совместимости модулей",
              "Скачивание PDF-спецификации"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <Link to="/builder" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all">
            <Box className="w-5 h-5" />
            Запустить конфигуратор
          </Link>
        </div>

        <div className="order-1 lg:order-2 relative">
           <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white group">
              <img 
                src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800" 
                alt="3D Configurator Preview" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                 <div className="w-20 h-20 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Settings className="w-10 h-10 text-primary animate-spin-slow" />
                 </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Cpu className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-gray-400">Конфигурация</div>
                        <div className="font-bold text-sm">Smart Farm 4X</div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-gray-400">Стоимость</div>
                    <div className="font-bold text-primary">12 450 ₽</div>
                 </div>
              </div>
           </div>
           {/* Decorative Blobs */}
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />
           <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
};


const AdminDashboard = () => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reviews' | 'equipment'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  
  // State for forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);

  useEffect(() => {
    setProducts(storageService.getProducts());
    setOrders(storageService.getOrders());
    setReviews(storageService.getReviews());
    setAllEquipment(storageService.getEquipment());
  }, []);

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const handleLogout = () => {
      logout();
      navigate('/');
  };

  const handleDeleteProduct = (id: string) => {
    storageService.deleteProducts([id]);
    setProducts(storageService.getProducts());
  };
  
  const handleProductSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const equipmentIds = allEquipment.filter(eq => formData.get(`equip-${eq.id}`) === 'on').map(eq => eq.id);
      
      const productData: Product = {
          id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          details: formData.get('details') as string,
          price: Number(formData.get('price')),
          oldPrice: formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined,
          isHit: formData.get('isHit') === 'on',
          image: formData.get('image') as string,
          category: formData.get('category') as any,
          difficulty: formData.get('difficulty') as any,
          growthTime: formData.get('growthTime') as string,
          dimensions: formData.get('dimensions') as string,
          equipmentIds: equipmentIds
      };

      if (editingProduct) {
          storageService.updateProduct(productData);
      } else {
          storageService.addProduct(productData);
      }
      setProducts(storageService.getProducts());
      setEditingProduct(null);
      setIsAddingProduct(false);
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          const updatedOrder = { ...order, status: newStatus };
          storageService.updateOrder(updatedOrder);
          setOrders(storageService.getOrders());
      }
  };

  // --- Equipment Handlers ---
  const handleDeleteEquipment = (id: string) => {
      storageService.deleteEquipment([id]);
      setAllEquipment(storageService.getEquipment());
  };

  const handleEquipmentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const eqData: Equipment = {
          id: editingEquipment ? editingEquipment.id : `eq-${Date.now()}`,
          name: formData.get('name') as string,
          price: Number(formData.get('price')),
          purpose: formData.get('purpose') as string,
          description: formData.get('description') as string,
          image: formData.get('image') as string,
          powerConsumption: formData.get('powerConsumption') as string,
          powerRating: formData.get('powerRating') as string,
      };

      if (editingEquipment) {
          storageService.updateEquipment(eqData);
      } else {
          storageService.addEquipment(eqData);
      }
      setAllEquipment(storageService.getEquipment());
      setEditingEquipment(null);
      setIsAddingEquipment(false);
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" /> Выйти
          </button>
      </div>
      
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('products')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow-lg' : 'bg-white text-text hover:bg-gray-50'}`}>Товары</button>
        <button onClick={() => setActiveTab('equipment')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'equipment' ? 'bg-primary text-white shadow-lg' : 'bg-white text-text hover:bg-gray-50'}`}>Оборудование</button>
        <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'bg-white text-text hover:bg-gray-50'}`}>Заказы</button>
        <button onClick={() => setActiveTab('reviews')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-primary text-white shadow-lg' : 'bg-white text-text hover:bg-gray-50'}`}>Отзывы</button>
      </div>

      {activeTab === 'products' && (
        <div>
          <button onClick={() => { setEditingProduct(null); setIsAddingProduct(true); }} className="mb-6 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all flex items-center gap-2">
             <Plus /> Добавить товар
          </button>
          
          {(isAddingProduct || editingProduct) && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-xl font-bold mb-6">{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input name="name" defaultValue={editingProduct?.name} placeholder="Название" required className="p-3 border rounded-xl bg-gray-50" />
                          <select name="category" defaultValue={editingProduct?.category || 'kit'} className="p-3 border rounded-xl bg-gray-50">
                              <option value="kit">Набор</option>
                              <option value="seeds">Семена</option>
                              <option value="accessories">Аксессуары</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input name="price" type="number" defaultValue={editingProduct?.price} placeholder="Цена" required className="p-3 border rounded-xl bg-gray-50" />
                           <input name="oldPrice" type="number" defaultValue={editingProduct?.oldPrice} placeholder="Старая цена (необязательно)" className="p-3 border rounded-xl bg-gray-50" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl bg-gray-50 hover:bg-gray-100">
                          <input type="checkbox" name="isHit" defaultChecked={editingProduct?.isHit} className="w-5 h-5 accent-primary" />
                          <span className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> Пометить как "Хит"</span>
                      </label>
                      <textarea name="description" defaultValue={editingProduct?.description} placeholder="Краткое описание" required className="w-full p-3 border rounded-xl bg-gray-50 h-24" />
                      <textarea name="details" defaultValue={editingProduct?.details} placeholder="Подробное описание" className="w-full p-3 border rounded-xl bg-gray-50 h-32" />
                      <input name="image" defaultValue={editingProduct?.image} placeholder="URL изображения" className="w-full p-3 border rounded-xl bg-gray-50" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <select name="difficulty" defaultValue={editingProduct?.difficulty || 'Easy'} className="p-3 border rounded-xl bg-gray-50">
                              <option value="Easy">Легко</option>
                              <option value="Medium">Средне</option>
                              <option value="Hard">Сложно</option>
                          </select>
                          <input name="growthTime" defaultValue={editingProduct?.growthTime} placeholder="Время роста (7-10 дней)" className="p-3 border rounded-xl bg-gray-50" />
                          <input name="dimensions" defaultValue={editingProduct?.dimensions} placeholder="Габариты (10x20x30 см)" className="p-3 border rounded-xl bg-gray-50" />
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <h4 className="font-bold mb-3 flex items-center gap-2"><Cpu className="w-4 h-4"/> Оборудование в комплекте</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                              {allEquipment.map(eq => (
                                  <label key={eq.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                      <input type="checkbox" name={`equip-${eq.id}`} defaultChecked={editingProduct?.equipmentIds?.includes(eq.id)} className="accent-primary" />
                                      {eq.name}
                                  </label>
                              ))}
                          </div>
                          <p className="text-xs text-muted mt-2">Отметьте оборудование, которое входит в состав этого товара.</p>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex-1">Сохранить</button>
                          <button type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">Отмена</button>
                      </div>
                  </form>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                    <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{product.name}</h3>
                  <div className="flex items-baseline gap-2 text-sm">
                      <span className="text-primary font-bold">{product.price} ₽</span>
                      {product.oldPrice && <span className="text-gray-400 line-through text-xs">{product.oldPrice}</span>}
                  </div>
                  {product.isHit && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">HIT</span>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setEditingProduct(product); setIsAddingProduct(false); window.scrollTo(0,0); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
          <div>
              <button onClick={() => { setEditingEquipment(null); setIsAddingEquipment(true); }} className="mb-6 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2">
                  <Plus /> Добавить оборудование
              </button>

              {(isAddingEquipment || editingEquipment) && (
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
                      <h3 className="text-xl font-bold mb-6">{editingEquipment ? 'Редактировать оборудование' : 'Новое оборудование'}</h3>
                      <form onSubmit={handleEquipmentSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input name="name" defaultValue={editingEquipment?.name} placeholder="Название" required className="p-3 border rounded-xl bg-gray-50" />
                              <input name="price" type="number" defaultValue={editingEquipment?.price} placeholder="Цена" required className="p-3 border rounded-xl bg-gray-50" />
                          </div>
                          <select name="purpose" defaultValue={editingEquipment?.purpose} className="w-full p-3 border rounded-xl bg-gray-50" required>
                               <option value="">Выберите назначение</option>
                               {Object.keys(EQUIPMENT_ICONS).map(key => (
                                   <option key={key} value={key}>{key}</option>
                               ))}
                          </select>
                          <textarea name="description" defaultValue={editingEquipment?.description} placeholder="Описание" required className="w-full p-3 border rounded-xl bg-gray-50 h-24" />
                          <input name="image" defaultValue={editingEquipment?.image} placeholder="URL изображения" className="w-full p-3 border rounded-xl bg-gray-50" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input name="powerConsumption" defaultValue={editingEquipment?.powerConsumption} placeholder="Потребление (Вт)" className="p-3 border rounded-xl bg-gray-50" />
                              <input name="powerRating" defaultValue={editingEquipment?.powerRating} placeholder="Мощность/Характеристика" className="p-3 border rounded-xl bg-gray-50" />
                          </div>
                          
                          <div className="flex gap-4 pt-4">
                              <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex-1">Сохранить</button>
                              <button type="button" onClick={() => { setIsAddingEquipment(false); setEditingEquipment(null); }} className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all">Отмена</button>
                          </div>
                      </form>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEquipment.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                               <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="font-bold truncate text-sm">{item.name}</h3>
                              <div className="text-xs text-muted truncate">{item.purpose}</div>
                              <div className="font-bold text-primary mt-1">{item.price} ₽</div>
                              <div className="flex gap-2 mt-2">
                                  <button onClick={() => { setEditingEquipment(item); setIsAddingEquipment(false); window.scrollTo(0,0); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteEquipment(item.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
            {orders.length === 0 ? <p className="text-muted text-center py-10">Нет заказов</p> : 
             orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                        <div>
                            <div className="text-sm text-muted">Заказ #{order.id}</div>
                            <div className="font-bold text-lg">{order.total} ₽</div>
                            <div className="text-sm">{new Date(order.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${STATUS_DETAILS[order.status]?.color}`}>
                                {STATUS_DETAILS[order.status]?.icon && React.createElement(STATUS_DETAILS[order.status].icon, { className: 'w-4 h-4' })}
                                {STATUS_DETAILS[order.status]?.label}
                             </span>
                             <select 
                                value={order.status} 
                                onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                                className="p-2 border rounded-lg bg-gray-50 text-sm"
                             >
                                 {Object.entries(STATUS_DETAILS).map(([key, val]) => (
                                     <option key={key} value={key}>{val.label}</option>
                                 ))}
                             </select>
                        </div>
                    </div>
                    <div className="space-y-2 border-t pt-4">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{item.price * item.quantity} ₽</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <MapPin className="w-4 h-4 inline mr-1"/> Адрес: {order.address}
                    </div>
                </div>
             ))
            }
        </div>
      )}
      
      {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(rev => (
                  <div key={rev.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <div className="font-bold">{rev.userName}</div>
                          <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />)}</div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">"{rev.comment}"</p>
                      <div className="text-xs text-gray-400">{new Date(rev.date).toLocaleDateString()}</div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

const Dashboard = () => {
    const { user, logout } = useAppContext();
    const navigate = useNavigate();
    const orders = useMemo(() => storageService.getOrders(user?.id), [user]);
    
    if (!user) return <Navigate to="/login" />;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
            <p className="text-muted mb-8">Добро пожаловать, {user.name}!</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5"/> История заказов</h2>
                    {orders.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                            <p className="text-muted">У вас пока нет заказов</p>
                            <Link to="/shop" className="text-primary font-bold mt-2 inline-block">Перейти в магазин</Link>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-50">
                                    <div>
                                        <div className="text-sm text-muted mb-1">Заказ от {new Date(order.date).toLocaleDateString()}</div>
                                        <div className="font-bold text-lg">#{order.id}</div>
                                    </div>
                                    <div className="mt-2 md:mt-0 flex items-center gap-3">
                                        <div className="text-right mr-4">
                                            <div className="text-sm text-muted">Сумма</div>
                                            <div className="font-bold text-primary text-xl">{order.total} ₽</div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-help relative ${STATUS_DETAILS[order.status]?.color}`}>
                                             {STATUS_DETAILS[order.status]?.icon && React.createElement(STATUS_DETAILS[order.status].icon, { className: 'w-4 h-4' })}
                                             {STATUS_DETAILS[order.status]?.label}
                                             
                                             {/* Tooltip */}
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs font-normal p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                                {STATUS_DETAILS[order.status]?.desc}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : <Box className="w-6 h-6 text-gray-400"/>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{item.name}</div>
                                                {item.customConfig && <div className="text-xs text-muted">Конфигуратор</div>}
                                            </div>
                                            <div className="text-sm font-bold">{item.quantity} x {item.price} ₽</div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Status Progress Bar */}
                                {['pending', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                                    <div className="mt-6 pt-4 border-t border-gray-50">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-2">
                                            <span>Принят</span>
                                            <span>Сборка</span>
                                            <span>В пути</span>
                                            <span>Доставлен</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-primary'}`}
                                                style={{ width: order.status === 'pending' ? '25%' : order.status === 'processing' ? '50%' : order.status === 'shipped' ? '75%' : '100%' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors" title="Выйти">
                            <LogOut className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5"/> Профиль</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted block mb-1">Имя</label>
                                <div className="font-medium">{user.name}</div>
                            </div>
                            <div>
                                <label className="text-xs text-muted block mb-1">Email</label>
                                <div className="font-medium">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Floating Status Helper */}
            <div className="fixed bottom-4 right-4 z-40">
                 <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 max-w-xs animate-in slide-in-from-bottom-10">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-primary"/> Статусы заказа</h4>
                    <div className="space-y-2 text-xs text-gray-500">
                        <p><span className="font-bold text-blue-600">Принят:</span> Ожидает обработки.</p>
                        <p><span className="font-bold text-yellow-600">Сборка:</span> Комплектация (5-7 дней).</p>
                        <p><span className="font-bold text-purple-600">В пути:</span> Передан в доставку.</p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const Features = () => {
    // Helper for dynamic icon rendering
    const Leaf = LucideLeaf; 
    const features = [
        { icon: <Leaf as={LucideLeaf} className="w-6 h-6 text-green-500" />, title: "100% Органика", desc: "Только натуральные семена и субстраты." },
        { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "Быстрый рост", desc: "Первый урожай уже через 7 дней." },
        { icon: <Droplets className="w-6 h-6 text-blue-500" />, title: "Чистота", desc: "Выращивание без земли и грязи." },
        { icon: <Cpu className="w-6 h-6 text-purple-500" />, title: "Технологии", desc: "Умные датчики и автополив." }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all text-center">
                            <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                            <p className="text-muted text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Home = () => {
  const { theme } = useAppContext();
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 10], fov: 40 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                     <mesh rotation={[0.5, 0.5, 0]} position={[3, 1, -2]}>
                        <torusGeometry args={[1.5, 0.4, 16, 100]} />
                        <meshStandardMaterial color={theme.colors.primary} wireframe opacity={0.3} transparent />
                     </mesh>
                </Float>
                 <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
                     <mesh rotation={[-0.5, -0.2, 0]} position={[-3, -2, -5]}>
                        <octahedronGeometry args={[1.5]} />
                        <meshStandardMaterial color={theme.colors.accent} wireframe opacity={0.2} transparent />
                     </mesh>
                </Float>
            </Canvas>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center z-10">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-tight"
          >
            Ферма на вашем<br/>подоконнике
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-muted mb-10 max-w-2xl mx-auto"
          >
            Выращивайте свежие витамины круглый год. Без земли, без грязи, с умными технологиями.
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/shop" className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-2">
              <ShoppingBag /> Купить набор
            </Link>
            <Link to="/builder" className="px-8 py-4 rounded-full bg-white text-text font-bold text-lg shadow-lg border border-gray-100 hover:border-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Box /> Конфигуратор
            </Link>
          </motion.div>
        </div>
      </section>

      <TopRatedPromo />
      
      <ConfiguratorPromo />

      <Features />
      
      <RecommendationQuiz />

      <ReviewsCarousel />

      <FAQ />

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Готовы начать свой сад?</h2>
            <p className="text-muted text-lg mb-8">Присоединяйтесь к тысячам довольных клиентов MicroGreen Labs</p>
             <Link to="/shop" className="inline-block px-10 py-4 rounded-2xl bg-primary text-white font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                 Перейти в каталог
             </Link>
        </div>
      </section>
    </div>
  );
};

const Shop = () => {
  const { addToCart } = useAppContext();
  const products = useMemo(() => storageService.getProducts(), []);
  const [filter, setFilter] = useState<'all' | 'kit' | 'seeds' | 'accessories'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // useSearchParams to open modal if product id is in url
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const pId = searchParams.get('product');
    if (pId) {
        const p = products.find(prod => prod.id === pId);
        if (p) setSelectedProduct(p);
    }
  }, [searchParams, products]);

  const filtered = products.filter(p => filter === 'all' || p.category === filter);

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Каталог</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'kit', 'seeds', 'accessories'].map(f => (
                <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full font-bold capitalize whitespace-nowrap ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {f === 'all' ? 'Все' : f === 'kit' ? 'Наборы' : f === 'seeds' ? 'Семена' : 'Аксессуары'}
                </button>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(product => (
            <div key={product.id} onClick={() => setSearchParams({ product: product.id })} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
                <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {product.isHit && <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full uppercase">Хит</span>}
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex flex-col">
                             {product.oldPrice && <span className="text-xs text-gray-400 line-through">{product.oldPrice} ₽</span>}
                             <span className="text-xl font-bold text-primary">{product.price} ₽</span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); addToCart({...product, quantity: 1}); }}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProduct && (
            <ProductDetailModal product={selectedProduct} onClose={() => { setSelectedProduct(null); setSearchParams({}); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

const Login = () => {
    const { login } = useAppContext();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="user@example.com"
                        />
                         <p className="text-xs text-gray-400 mt-1">Используйте m@m.com для входа как Админ</p>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                        Войти
                    </button>
                </form>
            </div>
        </div>
    );
};

const Checkout = () => {
    const { cart, clearCart, user } = useAppContext();
    const navigate = useNavigate();
    const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');
    const [address, setAddress] = useState('');

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handlePlaceOrder = () => {
        if (!user) { navigate('/login'); return; }
        const newOrder: Order = {
            id: `ord-${Date.now()}`,
            userId: user.id,
            items: cart,
            total,
            status: 'pending',
            date: new Date().toISOString(),
            address: address || 'Самовывоз'
        };
        storageService.createOrder(newOrder);
        clearCart();
        setStep('success');
    };

    if (cart.length === 0 && step !== 'success') {
        return (
            <div className="pt-24 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
                <Link to="/shop" className="text-primary underline">В каталог</Link>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="pt-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Спасибо за заказ!</h1>
                <p className="text-muted mb-8">Мы свяжемся с вами для подтверждения.</p>
                <Link to="/dashboard" className="px-8 py-3 bg-primary text-white rounded-xl font-bold">
                    В личный кабинет
                </Link>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-4 mb-6">
                     {cart.map(item => (
                         <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                             <div>
                                 <div className="font-medium">{item.name}</div>
                                 <div className="text-sm text-muted">x{item.quantity}</div>
                             </div>
                             <div className="font-bold">{item.price * item.quantity} ₽</div>
                         </div>
                     ))}
                </div>
                <div className="flex justify-between text-xl font-bold mb-8 pt-4 border-t">
                    <span>Итого</span>
                    <span>{total} ₽</span>
                </div>
                
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-bold block mb-2">Адрес доставки</span>
                        <textarea 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            className="w-full p-3 border rounded-xl bg-gray-50"
                            placeholder="Город, улица, дом, квартира..."
                            rows={3}
                        />
                    </label>
                    <button onClick={handlePlaceOrder} className="w-full py-4 bg-primary text-white font-bold rounded-xl text-lg hover:shadow-lg transition-all">
                        Подтвердить заказ
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen bg-bg text-text transition-colors duration-300 font-sans selection:bg-primary/30 flex flex-col">
           <Navbar />
           <CartDrawer />
           <div className="flex-1">
               <Routes>
                 <Route path="/" element={<Home />} />
                 <Route path="/shop" element={<Shop />} />
                 <Route path="/builder" element={<div className="pt-24 px-4 max-w-7xl mx-auto pb-12"><h1 className="text-3xl font-bold mb-8">Конфигуратор</h1><Kit3DBuilder /></div>} />
                 <Route path="/reviews" element={<Reviews />} />
                 <Route path="/admin" element={<AdminDashboard />} />
                 <Route path="/dashboard" element={<Dashboard />} />
                 <Route path="/login" element={<Login />} />
                 <Route path="/checkout" element={<Checkout />} />
                 <Route path="*" element={<Navigate to="/" replace />} />
               </Routes>
           </div>
           <footer className="bg-surface border-t border-gray-200 pt-16 pb-8 px-4 mt-auto">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                {/* Column 1: Brand & Desc */}
                <div className="space-y-6">
                  <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <LucideLeaf className="w-8 h-8" />
                    <span className="text-text">MicroGreenLabs</span>
                  </Link>
                  <p className="text-muted text-sm leading-relaxed">
                    Инновационные технологии для выращивания свежей микрозелени прямо у вас на кухне. Здоровье и технологии в каждом ростке.
                  </p>
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted hover:bg-blue-500 hover:text-white transition-colors"><div className="font-bold text-xs">VK</div></a>
                    <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted hover:bg-sky-500 hover:text-white transition-colors"><div className="font-bold text-xs">TG</div></a>
                    <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted hover:bg-red-500 hover:text-white transition-colors"><div className="font-bold text-xs">YT</div></a>
                  </div>
                </div>

                {/* Column 2: Shop Navigation */}
                <div>
                  <h4 className="font-bold text-lg mb-6 text-text">Магазин</h4>
                  <ul className="space-y-4 text-sm text-muted">
                    <li><Link to="/shop" className="hover:text-primary transition-colors flex items-center gap-2">Каталог товаров</Link></li>
                    <li><Link to="/builder" className="hover:text-primary transition-colors flex items-center gap-2">Конфигуратор фермы</Link></li>
                    <li><Link to="/shop" className="hover:text-primary transition-colors flex items-center gap-2">Оборудование и датчики</Link></li>
                    <li><Link to="/shop" className="hover:text-primary transition-colors flex items-center gap-2">Семена и субстраты</Link></li>
                  </ul>
                </div>

                {/* Column 3: Customer Info */}
                <div>
                  <h4 className="font-bold text-lg mb-6 text-text">Покупателям</h4>
                  <ul className="space-y-4 text-sm text-muted">
                    <li><Link to="/" className="hover:text-primary transition-colors">О нас</Link></li>
                    <li><Link to="/reviews" className="hover:text-primary transition-colors">Отзывы клиентов</Link></li>
                    <li><Link to="/" className="hover:text-primary transition-colors">Блог и новости</Link></li>
                    <li><Link to="/" className="hover:text-primary transition-colors">Инструкции по сборке</Link></li>
                    <li><Link to="/" className="hover:text-primary transition-colors">Календарь роста</Link></li>
                    <li><Link to="/" className="hover:text-primary transition-colors">Частые вопросы (FAQ)</Link></li>
                  </ul>
                </div>

                {/* Column 4: Contacts */}
                <div>
                  <h4 className="font-bold text-lg mb-6 text-text">Контакты</h4>
                  <ul className="space-y-4 text-sm text-muted">
                    <li className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{CONTACT_INFO.phone}<br/><span className="text-xs text-gray-400">Ежедневно 9:00 - 21:00</span></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{CONTACT_INFO.email}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{CONTACT_INFO.address}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="max-w-7xl mx-auto border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
                <div>© 2024 MicroGreenLabs. Все права защищены.</div>
                <div className="flex gap-6">
                  <Link to="/" className="hover:text-text">Политика конфиденциальности</Link>
                  <Link to="/" className="hover:text-text">Публичная оферта</Link>
                </div>
              </div>
            </footer>
        </div>
      </ThemeProvider>
    </Router>
  );
};

export default App;
