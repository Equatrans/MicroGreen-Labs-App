'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { ShoppingBag, Box, Cpu, Star, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, MapPin, LogOut, Package, Info, Plus, Edit, Trash2, ArrowDownToLine, ArrowRightFromLine, LayoutGrid, Minimize2, Maximize2, Wind, Battery, Zap, RefreshCcw, Unplug, Camera, Thermometer, Droplets, Timer, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Cylinder, RoundedBox, Text, useTexture } from '@react-three/drei';
import { jsPDF } from 'jspdf';
import { storageService } from '../lib/storageService';
import { ImageWithFallback } from './UI';
import * as Visualizers from './Visualizers';
import * as Constants from '../lib/constants';
import { Product, Order, Equipment, CustomKitConfig, Review } from '../lib/types';

// --- 3D Builder Logic ---
const GrowBoxUnit = ({ config, position = [0, 0, 0] }: { config: CustomKitConfig; position?: [number, number, number] }) => {
    const isDomed = config.lidType.includes('domed');
    const hasVents = config.lidType.includes('vent');
    return (
        <group position={position}>
            <RoundedBox args={[4, 1.5, 3]} radius={0.1} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
                <meshPhysicalMaterial color={config.trayColor} roughness={0.3} metalness={0.1} clearcoat={0.8} />
            </RoundedBox>
            <Suspense fallback={null}>
                <Visualizers.TextureErrorBoundary fallback={<RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.7, 0]}><meshStandardMaterial color="#6d4c41" /></RoundedBox>}>
                    <Visualizers.SubstrateLayer type={config.substrate} />
                </Visualizers.TextureErrorBoundary>
            </Suspense>
            {config.seeds.length > 0 && <Visualizers.SeedsVisualizer />}
            {isDomed ? (
                <RoundedBox args={[4, 2, 3]} radius={0.1} position={[0, 1.7, 0]}><meshPhysicalMaterial color="#ffffff" transmission={0.98} opacity={0.5} transparent roughness={0.05} thickness={0.5} /></RoundedBox>
            ) : (
                <RoundedBox args={[4, 0.2, 3]} radius={0.1} position={[0, 0.85, 0]}><meshPhysicalMaterial color="#ffffff" transmission={0.98} opacity={0.5} transparent roughness={0.05} thickness={0.1} /></RoundedBox>
            )}
            {hasVents && <Visualizers.VentVisualizer isDomed={isDomed} />}
            {config.hasLight && <group position={[0, isDomed ? 3.5 : 2.5, 0]}><RoundedBox args={[4.0, 0.15, 0.6]} radius={0.05}><meshStandardMaterial color="#f8fafc" /></RoundedBox><spotLight position={[0, -0.1, 0]} intensity={4} color="#e9d5ff" distance={10} /></group>}
            {config.hasFan && <group position={[1.5, isDomed ? 1.5 : 0.8, 0]} rotation={[0, Math.PI/2, 0]}><Visualizers.FanVisualizer /></group>}
            {config.hasController && <group position={[-2.1, 0.2, 1]}><Visualizers.ControllerVisualizer /></group>}
            {config.hasTempSensor && <group position={[1.4, 0.7, 0.8]}><Visualizers.TempSensorVisualizer /></group>}
        </group>
    );
};

const FarmAssembly = ({ config }: { config: CustomKitConfig }) => {
    const stackOffset = config.lidType.includes('domed') ? 3.5 : 2.5;
    if (config.layout === 'single') return <GrowBoxUnit config={config} />;
    if (config.layout === 'double-h') return (<group><GrowBoxUnit config={config} position={[-2.1, 0, 0]} /><GrowBoxUnit config={config} position={[2.1, 0, 0]} /></group>);
    if (config.layout === 'double-v') return (<group position={[0, -1.5, 0]}><GrowBoxUnit config={config} /><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group>);
    if (config.layout === 'quad') return (<group position={[0, -1.5, 0]}><group position={[-2.1, 0, 0]}><GrowBoxUnit config={config} /><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group><group position={[2.1, 0, 0]}><GrowBoxUnit config={config} /><GrowBoxUnit config={config} position={[0, stackOffset, 0]} /></group></group>);
    return <GrowBoxUnit config={config} />;
};

export const Kit3DBuilder = () => {
  const { addToCart } = useAppContext();
  const [config, setConfig] = useState<CustomKitConfig>({ trayColor: '#e2e8f0', substrate: 'linen', seeds: [], lidType: 'flat', layout: 'single', powerType: 'grid', hasLight: false, hasFan: false, hasPump: false, hasHeater: false, hasSensors: false, hasTempSensor: false, hasHumiditySensor: false, hasController: false, hasCamera: false, hasMusic: false, autoMode: false, hasLightSensor: false, hasTimer: false });
  const [activeTab, setActiveTab] = useState<string | null>('base');
  
  useEffect(() => { 
      if (config.autoMode) { 
          setConfig(prev => ({ ...prev, hasController: true, hasTempSensor: true, hasHumiditySensor: true, hasLight: true, hasFan: true, hasPump: true, hasLightSensor: true })); 
      }
  }, [config.autoMode]);

  const calculatePrice = () => { let base = 1500; if (config.hasLight) base += 1200; if (config.hasFan) base += 600; if(config.autoMode) base += 3000; return base; }; 
  const price = calculatePrice();

  const handleAddToCart = () => { addToCart({ id: `custom-${Date.now()}`, name: `Smart Farm (${config.layout})`, price: price, quantity: 1, customConfig: config, image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400' }); };

  return (
    <div className="relative h-[600px] bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 shadow-inner">
        <Canvas shadows camera={{ position: [8, 5, 8], fov: 45 }}>
            <Suspense fallback={<Visualizers.CanvasLoader />}>
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <group position={[0, -1, 0]}><FarmAssembly config={config} /></group>
                <ContactShadows position={[0, -1.01, 0]} opacity={0.4} scale={10} blur={2} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
            </Suspense>
        </Canvas>
        
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{price} ₽</div>
            <button onClick={handleAddToCart} className="mt-2 bg-green-500 text-white px-4 py-2 rounded-xl font-bold w-full flex items-center justify-center gap-2 shadow-lg hover:bg-green-600 transition-all transform active:scale-95"><ShoppingBag className="w-4 h-4" /> В корзину</button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur p-4 border-t border-gray-200 rounded-t-3xl">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setActiveTab('base')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'base' ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Основа</button>
                <button onClick={() => setActiveTab('hardware')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'hardware' ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Оборудование</button>
            </div>
            {activeTab === 'base' && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button onClick={() => setConfig({...config, layout: 'single'})} className={`p-3 border rounded-xl text-sm font-medium ${config.layout === 'single' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>Одинарный</button>
                    <button onClick={() => setConfig({...config, layout: 'double-h'})} className={`p-3 border rounded-xl text-sm font-medium ${config.layout === 'double-h' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>Двойной (Гор)</button>
                    <button onClick={() => setConfig({...config, layout: 'double-v'})} className={`p-3 border rounded-xl text-sm font-medium ${config.layout === 'double-v' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>Двойной (Верт)</button>
                    <button onClick={() => setConfig({...config, lidType: config.lidType.includes('domed') ? 'flat' : 'domed'})} className={`p-3 border rounded-xl text-sm font-medium hover:bg-gray-50`}>{config.lidType.includes('domed') ? 'Плоская крышка' : 'Купол'}</button>
                </div>
            )}
            {activeTab === 'hardware' && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button onClick={() => setConfig({...config, hasLight: !config.hasLight})} className={`p-3 border rounded-xl text-sm font-medium transition-colors ${config.hasLight ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'hover:bg-gray-50'}`}>Свет</button>
                    <button onClick={() => setConfig({...config, hasFan: !config.hasFan})} className={`p-3 border rounded-xl text-sm font-medium transition-colors ${config.hasFan ? 'bg-blue-100 border-blue-400 text-blue-800' : 'hover:bg-gray-50'}`}>Вентиляция</button>
                    <button onClick={() => setConfig({...config, autoMode: !config.autoMode})} className={`p-3 border rounded-xl text-sm font-medium transition-colors ${config.autoMode ? 'bg-purple-100 border-purple-400 text-purple-800' : 'hover:bg-gray-50'}`}>Auto Mode</button>
                    <button onClick={() => setConfig({...config, hasCamera: !config.hasCamera})} className={`p-3 border rounded-xl text-sm font-medium transition-colors ${config.hasCamera ? 'bg-red-100 border-red-400 text-red-800' : 'hover:bg-gray-50'}`}>Камера</button>
                </div>
            )}
        </div>
    </div>
  );
};

// --- Components ---

export const DashboardComponent = () => {
    const { user, logout } = useAppContext();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && user) {
            setOrders(storageService.getOrders(user.id));
        } else if (typeof window !== 'undefined' && !user) {
            router.push('/login');
        }
    }, [user, router]);
    
    if (!user) return null;

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Личный кабинет</h1>
                <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-2 text-red-500 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"><LogOut className="w-5 h-5" /> Выйти</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5"/> История заказов</h2>
                    {orders.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
                            <p className="text-gray-500">У вас пока нет заказов</p>
                            <Link href="/shop" className="text-green-500 font-bold mt-2 inline-block">Перейти в магазин</Link>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between mb-4 border-b border-gray-50 pb-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Заказ от {new Date(order.date).toLocaleDateString()}</div>
                                        <div className="font-bold">#{order.id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-600 font-bold text-lg">{order.total} ₽</div>
                                        <div className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-600 inline-block mt-1">{order.status}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.name} x{item.quantity}</span>
                                            <span>{item.price * item.quantity} ₽</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4">Профиль</h3>
                        <div className="space-y-2">
                            <div><span className="text-gray-500 text-xs uppercase">Имя</span><div className="font-medium">{user.name}</div></div>
                            <div><span className="text-gray-500 text-xs uppercase">Email</span><div className="font-medium">{user.email}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboardComponent = () => {
    const { user, logout } = useAppContext();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [activeTab, setActiveTab] = useState('products');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProducts(storageService.getProducts());
            setEquipment(storageService.getEquipment());
        }
    }, []);

    if (!user || user.role !== 'admin') {
        if (typeof window !== 'undefined') router.push('/');
        return null;
    }

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <button onClick={() => { logout(); router.push('/'); }} className="text-red-500 flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
            </div>
            <div className="flex gap-4 mb-8">
                <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'products' ? 'bg-green-500 text-white' : 'bg-white border hover:bg-gray-50'}`}>Products</button>
                <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'equipment' ? 'bg-green-500 text-white' : 'bg-white border hover:bg-gray-50'}`}>Equipment</button>
            </div>
            {activeTab === 'products' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover"/>
                            </div>
                            <div>
                                <div className="font-bold line-clamp-1">{p.name}</div>
                                <div className="text-sm text-gray-500">{p.price} ₽</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'equipment' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {equipment.map(e => (
                        <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                <ImageWithFallback src={e.image} alt={e.name} className="w-full h-full object-cover"/>
                            </div>
                            <div>
                                <div className="font-bold line-clamp-1">{e.name}</div>
                                <div className="text-sm text-gray-500">{e.price} ₽</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ShopComponent = () => {
    const { addToCart } = useAppContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProducts(storageService.getProducts());
        }
    }, []);

    const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.category === selectedCategory);

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Каталог</h1>
            
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                {[{id: 'all', label: 'Все'}, {id: 'kit', label: 'Наборы'}, {id: 'seeds', label: 'Семена'}, {id: 'accessories', label: 'Аксессуары'}].map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-green-500 text-white' : 'bg-white border hover:bg-gray-50'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="h-64 relative overflow-hidden">
                            <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            {p.isHit && <span className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3"/> ХИТ</span>}
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{p.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{p.description}</p>
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-green-600">{p.price} ₽</span>
                                    {p.oldPrice && <span className="text-xs text-gray-400 line-through">{p.oldPrice} ₽</span>}
                                </div>
                                <button onClick={() => addToCart({...p, quantity: 1})} className="bg-gray-50 p-3 rounded-xl text-gray-700 hover:bg-green-500 hover:text-white transition-colors shadow-sm"><ShoppingBag className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CheckoutComponent = () => {
    const { cart, user, clearCart, login } = useAppContext();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleOrder = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        
        // Auto login if not logged in
        let currentUserId = user?.id;
        if (!currentUserId) {
            const email = formData.get('email') as string;
            const newUser = storageService.login(email);
            currentUserId = newUser.id;
            login(email); // Update context
        }

        const order: Order = {
            id: `ord-${Date.now()}`,
            userId: currentUserId!,
            items: cart,
            total: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
            status: 'pending',
            date: new Date().toISOString(),
            address: formData.get('address') as string,
        };

        storageService.createOrder(order);
        
        setTimeout(() => {
            clearCart();
            setLoading(false);
            router.push('/dashboard');
        }, 1500);
    };

    if (cart.length === 0) {
        return (
            <div className="pt-32 px-4 text-center min-h-screen">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-4">Корзина пуста</h2>
                <Link href="/shop" className="text-green-500 font-bold hover:underline">Вернуться в магазин</Link>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <form onSubmit={handleOrder} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Контактные данные</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" required placeholder="Имя" defaultValue={user?.name} className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:border-green-500 focus:bg-white transition-colors" />
                            <input name="email" type="email" required placeholder="Email" defaultValue={user?.email} className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:border-green-500 focus:bg-white transition-colors" />
                        </div>
                        <input name="phone" type="tel" required placeholder="Телефон" className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:border-green-500 focus:bg-white transition-colors" />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Доставка</h3>
                        <textarea name="address" required placeholder="Адрес доставки" className="w-full p-4 bg-gray-50 rounded-xl border-transparent focus:border-green-500 focus:bg-white transition-colors h-32" />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500">Итого к оплате:</span>
                            <span className="text-2xl font-bold text-green-600">{cart.reduce((acc, item) => acc + item.price * item.quantity, 0)} ₽</span>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CheckCircle2 />}
                            {loading ? 'Обработка...' : 'Подтвердить заказ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ReviewsComponent = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setReviews(storageService.getReviews());
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newReview: Review = {
            id: `rev-${Date.now()}`,
            userId: `guest`,
            userName: formData.get('name') as string,
            rating: Number(formData.get('rating')),
            comment: formData.get('comment') as string,
            date: new Date().toISOString()
        };
        storageService.addReview(newReview);
        setReviews(storageService.getReviews());
        setIsFormOpen(false);
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Отзывы клиентов</h1>
                <p className="text-gray-500">Что говорят о нас наши покупатели</p>
                <button onClick={() => setIsFormOpen(!isFormOpen)} className="mt-6 px-6 py-3 bg-green-500 text-white rounded-full font-bold shadow-lg hover:bg-green-600 transition-all">
                    Оставить отзыв
                </button>
            </div>

            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12 max-w-2xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                            <h3 className="font-bold text-lg mb-6">Написать отзыв</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input name="name" required placeholder="Ваше имя" className="w-full p-4 bg-gray-50 rounded-xl" />
                                <select name="rating" className="w-full p-4 bg-gray-50 rounded-xl">
                                    <option value="5">5 - Отлично</option>
                                    <option value="4">4 - Хорошо</option>
                                    <option value="3">3 - Нормально</option>
                                </select>
                                <textarea name="comment" required placeholder="Ваш комментарий" className="w-full p-4 bg-gray-50 rounded-xl h-32" />
                                <button type="submit" className="w-full py-3 bg-green-500 text-white font-bold rounded-xl">Отправить</button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="font-bold">{review.userName}</div>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                        <div className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HomeComponent = () => {
    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center z-10">
                    <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-yellow-400 leading-tight">
                        Ферма на вашем<br/>подоконнике
                    </motion.h1>
                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                        Выращивайте свежие витамины круглый год. Без земли, без грязи, с умными технологиями.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/shop" className="px-8 py-4 rounded-full bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition-all flex items-center gap-2"><ShoppingBag /> Купить набор</Link>
                        <Link href="/builder" className="px-8 py-4 rounded-full bg-white text-gray-900 font-bold shadow-lg border border-gray-100 hover:border-green-200 transition-all flex items-center gap-2"><Box /> Конфигуратор</Link>
                    </div>
                </div>
            </section>
            {/* Promo Configurator */}
            <section className="py-20 overflow-hidden relative bg-white">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-block bg-green-100 text-green-600 px-4 py-2 rounded-full font-bold text-sm mb-6">3D Конфигуратор</div>
                        <h2 className="text-4xl font-bold mb-6">Создайте ферму своей мечты</h2>
                        <p className="text-lg text-gray-500 mb-8">Используйте наш уникальный 3D-конструктор, чтобы спроектировать идеальную систему.</p>
                        <div className="space-y-4 mb-8">
                            {["Визуализация в реальном времени", "Подбор оборудования", "Расчет стоимости"].map((i) => (
                                <div key={i} className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5"/><span className="font-medium">{i}</span></div>
                            ))}
                        </div>
                        <Link href="/builder" className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-bold shadow-xl hover:-translate-y-1 transition-all"><Settings className="w-5 h-5" /> Запустить конфигуратор</Link>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-2xl border border-gray-200 flex items-center justify-center">
                        <Cpu className="w-24 h-24 text-gray-300" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 pointer-events-none"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};