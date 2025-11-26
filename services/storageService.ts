
import { GoogleGenAI } from "@google/genai";
import { Product, Order, Review, User, Equipment } from '../types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_EQUIPMENT } from '../constants';

const KEYS = {
  PRODUCTS: 'mgl_products_v8',
  ORDERS: 'mgl_orders',
  REVIEWS: 'mgl_reviews',
  USER: 'mgl_user',
  EQUIPMENT: 'mgl_equipment',
};

class StorageService {
  
  // Helper to safely save to localStorage with quota handling
  public saveSafe(key: string, data: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
        console.error('LocalStorage quota exceeded.');
        alert("Внимание! Хранилище данных переполнено. Невозможно сохранить изменения. Пожалуйста, удалите неактуальные заказы, товары или изображения, чтобы освободить место.");
        return false;
      }
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  // --- Products ---
  getProducts(): Product[] {
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
    try {
      // Generate image if missing or default placeholder
      if (!product.image || product.image.includes('placeholder.com') || product.image === '') {
        try {
          // Safe access to env
          let apiKey = '';
          try { apiKey = process.env.API_KEY || ''; } catch (e) {}

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
          console.warn("Storage full. Attempting to save without high-res image.");
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
    try {
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === updatedProduct.id);
      if (index !== -1) {
        const oldImage = products[index].image;
        products[index] = updatedProduct;
        
        if (!this.saveSafe(KEYS.PRODUCTS, products)) {
            console.warn("Storage full during update. Attempting to revert image.");
            if (updatedProduct.image.startsWith('data:') && (!oldImage || !oldImage.startsWith('data:'))) {
                products[index].image = oldImage;
                if (this.saveSafe(KEYS.PRODUCTS, products)) {
                    alert("Image was too large. Product updated with old image.");
                }
            } else if (updatedProduct.image.startsWith('data:')) {
                 products[index].image = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800';
                 if (this.saveSafe(KEYS.PRODUCTS, products)) {
                     alert("Image was too large. Product updated with placeholder.");
                 }
            }
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }

  deleteProducts(ids: string[]): void {
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
    try {
      const stored = localStorage.getItem(KEYS.REVIEWS);
      if (!stored) {
        this.saveSafe(KEYS.REVIEWS, INITIAL_REVIEWS);
        return INITIAL_REVIEWS;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading reviews:', error);
      return INITIAL_REVIEWS;
    }
  }

  addReview(review: Review): void {
    try {
      const reviews = this.getReviews();
      reviews.unshift(review);
      this.saveSafe(KEYS.REVIEWS, reviews);
    } catch (error) {
      console.error('Error adding review:', error);
    }
  }

  updateReview(updatedReview: Review): void {
    try {
      const reviews = this.getReviews();
      const index = reviews.findIndex(r => r.id === updatedReview.id);
      if (index !== -1) {
        reviews[index] = updatedReview;
        this.saveSafe(KEYS.REVIEWS, reviews);
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  }

  deleteReviews(ids: string[]): void {
    try {
      let reviews = this.getReviews();
      reviews = reviews.filter(r => !ids.includes(r.id));
      this.saveSafe(KEYS.REVIEWS, reviews);
    } catch (error) {
      console.error('Error deleting reviews:', error);
    }
  }

  // --- Orders ---
  getOrders(userId?: string): Order[] {
    try {
      const stored = localStorage.getItem(KEYS.ORDERS);
      const allOrders: Order[] = stored ? JSON.parse(stored) : [];
      if (userId) {
        return allOrders.filter(o => o.userId === userId);
      }
      return allOrders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  createOrder(order: Order): void {
    try {
      const orders = this.getOrders();
      orders.push(order);
      this.saveSafe(KEYS.ORDERS, orders);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  updateOrder(updatedOrder: Order): void {
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
    try {
      const stored = localStorage.getItem(KEYS.EQUIPMENT);
      if (!stored) {
        this.saveSafe(KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
        return INITIAL_EQUIPMENT;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading equipment:', error);
      return INITIAL_EQUIPMENT;
    }
  }

  addEquipment(item: Equipment): void {
    try {
      const equipment = this.getEquipment();
      equipment.push(item);
      this.saveSafe(KEYS.EQUIPMENT, equipment);
    } catch (error) {
      console.error('Error adding equipment:', error);
    }
  }

  updateEquipment(updatedItem: Equipment): void {
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
    try {
      const stored = localStorage.getItem(KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading user:', error);
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
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    return user;
  }

  logout(): void {
    localStorage.removeItem(KEYS.USER);
  }
}

export const storageService = new StorageService();
