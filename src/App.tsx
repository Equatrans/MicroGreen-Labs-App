
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
  const calculatePrice = () => { let base = 1500; if (config.hasLight) base += 1200; if (config.hasFan) base += 600; if (config.hasPump) base += 800; if (config.hasHeater) base += 900; if (config.hasSensors) base += 1500; if (config.hasTempSensor) base += 300; if (config.hasHumiditySensor) base += 350; if (config.hasCamera) base += 2000; if (config.hasMusic) base += 1800; if (config.hasController) base += 2500; if (config.powerType === 'battery') base += 1000; if (config.hasLightSensor) base += 250; if (config.hasTimer) base += 450; let multiplier = 1; if (config.layout === 'double-h' || config.layout === 'double-v') multiplier = 2