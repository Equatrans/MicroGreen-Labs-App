
export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string; // Extended info
  price: number;
  oldPrice?: number; // New: Crossed out price
  isHit?: boolean; // New: Hit badge
  image: string;
  category: 'kit' | 'seeds' | 'accessories';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  growthTime?: string;
  variants?: ProductVariant[];
  dimensions?: string; // ВxШxД in cm
  equipmentIds?: string[]; // IDs of included equipment from INITIAL_EQUIPMENT
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  purpose: string; // Назначение
  description: string;
  image: string;
  powerConsumption: string; // Энергопотребление
  powerRating: string; // Мощность
}

export interface CustomKitConfig {
  trayColor: string;
  substrate: 'coco' | 'linen' | 'wool';
  seeds: string[];
  lidType: 'domed' | 'flat';
  layout: 'single' | 'double-h' | 'double-v' | 'quad'; // New: Multi-module layout
  powerType?: 'grid' | 'battery' | 'mixed' | 'none';
  hasLight?: boolean;
  hasFan?: boolean;
  hasPump?: boolean;
  hasHeater?: boolean;
  hasSensors?: boolean; // Deprecated/Legacy bundle
  hasTempSensor?: boolean; // New
  hasHumiditySensor?: boolean; // New
  hasController?: boolean;
  hasCamera?: boolean;
  hasMusic?: boolean;
  autoMode?: boolean;
}

export interface CartItem {
  id: string;
  productId?: string; // If standard product
  variantId?: string;
  variantName?: string;
  customConfig?: CustomKitConfig; // If custom kit
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  date: string;
  address: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId?: string; // Optional, could be general site review
  rating: number;
  comment: string;
  date: string;
}

export interface Theme {
  name: string;
  id: 'nature' | 'earth' | 'tech';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
  };
}