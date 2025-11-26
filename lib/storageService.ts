import { GoogleGenAI } from "@google/genai";
import { Product, Order, Review, User, Equipment } from './types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_EQUIPMENT } from './constants';

const KEYS = {
  PRODUCTS: 'mgl_products_v9',
  ORDERS: 'mgl_orders',
  REVIEWS: 'mgl_reviews',
  USER: 'mgl_user',
  EQUIPMENT: 'mgl_equipment_v9',
};

// Helper to check for window existence (SSR safety)
const isBrowser = typeof window !== 'undefined';

class StorageService {
  
  public saveSafe(key: string, data: any): boolean {
    if (!isBrowser) return false;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
        console.error('LocalStorage quota exceeded.');
        alert("Внимание! Хранилище данных переполнено. Невозможно сохранить изменения.");
        return false;
      }
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  getProducts(): Product[] {
    if (!isBrowser) return INITIAL_PRODUCTS;
    try {
      const stored = localStorage.getItem(KEYS.PRODUCTS);
      if (!stored) {
        this.saveSafe(KEYS.PRODUCTS, INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading products:', error);
      return INITIAL_PRODUCTS;
    }
  }

  async addProduct(product: Product): Promise<void> {
    if (!isBrowser) return;
    try {
      if (!product.image || product.image.includes('placeholder.com') || product.image === '') {
        try {
          // Use NEXT_PUBLIC_API_KEY for client-side env access in Next.js
          const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

          if (apiKey) {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Professional product photography of ${product.name} (${product.category}). ${product.description}. High resolution, studio lighting, clean white background, minimalist style.`;
            
            const response = await ai.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: prompt,
              config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/jpeg',
              },
            });

            const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (base64ImageBytes) {
              product.image = `data:image/jpeg;base64,${base64ImageBytes}`;
            }
          }
        } catch (genError) {
          console.warn("Image generation failed during product add:", genError);
        }
      }
      
      if (!product.image) {
         product.image = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800';
      }

      const products = this.getProducts();
      products.push(product);
      
      if (!this.saveSafe(KEYS.PRODUCTS, products)) {
          if (product.image && product.image.startsWith('data:')) {
              product.image = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800';
              products[products.length - 1] = product;
              this.saveSafe(KEYS.PRODUCTS, products);
          }
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  }

  updateProduct(updatedProduct: Product): void {
    if (!isBrowser) return;
    try {
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        const oldImage = products[index].image;
        products[index] = updatedProduct;
        
        if (!this.saveSafe(KEYS.PRODUCTS, products)) {
            if (updatedProduct.image.startsWith('data:') && (!oldImage || !oldImage.startsWith('data:'))) {
                products[index].image = oldImage;
                this.saveSafe(KEYS.PRODUCTS, products);
            } else if (updatedProduct.image.startsWith('data:')) {
                 products[index].image = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800';
                 this.saveSafe(KEYS.PRODUCTS, products);
            }
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }

  deleteProducts(ids: string[]): void {
    if (!isBrowser) return;
    try {
      let products = this.getProducts();
      products = products.filter(p => !ids.includes(p.id));
      this.saveSafe(KEYS.PRODUCTS, products);
    } catch (error) {
      console.error('Error deleting products:', error);
    }
  }

  // --- Reviews ---
  getReviews(): Review[] {
    if (!isBrowser) return INITIAL_REVIEWS;
    try {
      const stored = localStorage.getItem(KEYS.REVIEWS);
      if (!stored) {
        this.saveSafe(KEYS.REVIEWS, INITIAL_REVIEWS);
        return INITIAL_REVIEWS;
      }
      return JSON.parse(stored);
    } catch (error) {
      return INITIAL_REVIEWS;
    }
  }

  addReview(review: Review): void {
    if (!isBrowser) return;
    try {
      const reviews = this.getReviews();
      reviews.unshift(review);
      this.saveSafe(KEYS.REVIEWS, reviews);
    } catch (error) {
      console.error('Error adding review:', error);
    }
  }

  // --- Orders ---
  getOrders(userId?: string): Order[] {
    if (!isBrowser) return [];
    try {
      const stored = localStorage.getItem(KEYS.ORDERS);
      const allOrders: Order[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return allOrders.filter(o => o.userId === userId);
      }
      return allOrders;
    } catch (error) {
      return [];
    }
  }

  createOrder(order: Order): void {
    if (!isBrowser) return;
    try {
      const orders = this.getOrders();
      orders.push(order);
      this.saveSafe(KEYS.ORDERS, orders);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  updateOrder(updatedOrder: Order): void {
    if (!isBrowser) return;
    try {
      const orders = this.getOrders();
      const index = orders.findIndex(o => o.id === updatedOrder.id);
      if (index !== -1) {
        orders[index] = updatedOrder;
        this.saveSafe(KEYS.ORDERS, orders);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  // --- Equipment ---
  getEquipment(): Equipment[] {
    if (!isBrowser) return INITIAL_EQUIPMENT;
    try {
      const stored = localStorage.getItem(KEYS.EQUIPMENT);
      if (!stored) {
        this.saveSafe(KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
        return INITIAL_EQUIPMENT;
      }
      return JSON.parse(stored);
    } catch (error) {
      return INITIAL_EQUIPMENT;
    }
  }

  addEquipment(item: Equipment): void {
    if (!isBrowser) return;
    try {
      const equipment = this.getEquipment();
      equipment.push(item);
      this.saveSafe(KEYS.EQUIPMENT, equipment);
    } catch (error) {
      console.error('Error adding equipment:', error);
    }
  }

  updateEquipment(updatedItem: Equipment): void {
    if (!isBrowser) return;
    try {
      const equipment = this.getEquipment();
      const index = equipment.findIndex(e => e.id === updatedItem.id);
      if (index !== -1) {
        equipment[index] = updatedItem;
        this.saveSafe(KEYS.EQUIPMENT, equipment);
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  }

  deleteEquipment(ids: string[]): void {
    if (!isBrowser) return;
    try {
      let equipment = this.getEquipment();
      equipment = equipment.filter(e => !ids.includes(e.id));
      this.saveSafe(KEYS.EQUIPMENT, equipment);
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  }

  // --- Auth ---
  getCurrentUser(): User | null {
    if (!isBrowser) return null;
    try {
      const stored = localStorage.getItem(KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      localStorage.removeItem(KEYS.USER);
      return null;
    }
  }

  login(email: string): User {
    const user: User = {
      id: email === 'm@m.com' ? 'admin-main' : `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: email === 'm@m.com' ? 'admin' : 'user',
    };
    if (isBrowser) {
        localStorage.setItem(KEYS.USER, JSON.stringify(user));
    }
    return user;
  }

  logout(): void {
    if (isBrowser) {
        localStorage.removeItem(KEYS.USER);
    }
  }
}

export const storageService = new StorageService();