export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string; 
  price: number;
  oldPrice?: number; 
  isHit?: boolean;
  image: string;
  category: 'kit' | 'seeds' | 'accessories';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  growthTime?: string;
  variants?: ProductVariant[];
  dimensions?: string; 
  equipmentIds?: string[]; 
}

export interface Equipment {
  id: string;
  name: string;
  price: number;
  purpose: string; 
  description: string;
  image: string;
  powerConsumption: string; 
  powerRating: string; 
}

export interface CustomKitConfig {
  trayColor: string;
  substrate: 'coco' | 'linen' | 'wool';
  seeds: string[];
  lidType: 'domed' | 'flat' | 'flat-vent' | 'domed-vent';
  layout: 'single' | 'double-h' | 'double-v' | 'quad'; 
  powerType?: 'grid' | 'battery' | 'mixed' | 'none';
  hasLight?: boolean;
  hasFan?: boolean;
  hasPump?: boolean;
  hasHeater?: boolean;
  hasSensors?: boolean; 
  hasTempSensor?: boolean; 
  hasHumiditySensor?: boolean; 
  hasController?: boolean;
  hasCamera?: boolean;
  hasMusic?: boolean;
  autoMode?: boolean;
  hasLightSensor?: boolean;
  hasTimer?: boolean;
}

export interface CartItem {
  id: string;
  productId?: string; 
  variantId?: string;
  variantName?: string;
  customConfig?: CustomKitConfig; 
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
  productId?: string; 
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