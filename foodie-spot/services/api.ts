import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import { storage, STORAGE_KEYS } from '@/services/storage';
import api from './client';
import * as SecureStore from 'expo-secure-store';
import { Dish, Order, Restaurant, SearchFilters, User, TrackingData } from '@/types';
import log from './logger';
import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

api.interceptors.request.use(
    async (requestConfig: InternalAxiosRequestConfig) => {
        let token: string | null = null;
        try {
            token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            if (!token) {
                token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            }
        } catch {
        }

        if (!token) {
             token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
        }
        
        if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
    },
    (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
        if (error.response && error.response.status === 401) {
            try {
                await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
            } catch {}
            
            await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await storage.removeItem(STORAGE_KEYS.USER);
        }
        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}

// APIs
export const restaurantAPI = {
    async getRestaurants(filters?: SearchFilters & { lat?: number; lng?: number; radius?: number }): Promise<Restaurant[]> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached || [];
        }
        try {
            const response = await api.get('/restaurants', { params: filters});
            const restaurants = response.data?.data || [];
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            log.error('Failed to fetch restaurants', error);
            return (await cache.get<Restaurant[]>('restaurants')) || [];
        }
    },
    async searchRestaurants(query: string): Promise<Restaurant[]> {
        try {
            const response = await api.get('/restaurants/search', { params: { q: query } });
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to search restaurants', error);
            try {
                const all = await this.getRestaurants();
                return all.filter(r =>
                    r.name.toLowerCase().includes(query.toLowerCase()) ||
                    r.cuisine.some(c => c.toLowerCase().includes(query.toLowerCase()))
                );
            } catch {
                return [];
            }
        }
    },
    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            return (await cache.get<Restaurant>(`restaurant_${id}`)) || null;
        }
        try {
            const response = await api.get(`/restaurants/${id}`);
            const restaurant = response.data?.data || null;
            
            if (restaurant && !restaurant.reviews) {
                try {
                    const reviewsRes = await api.get(`/restaurants/${id}/reviews`);
                    restaurant.reviews = (reviewsRes.data?.data || []).map((rev: any) => ({
                        ...rev,
                        ratings: {
                            food: rev.foodRating || 0,
                            delivery: rev.deliveryRating || 0,
                            service: rev.serviceRating || 0
                        },
                        date: rev.createdAt?.split('T')[0] || rev.date
                    }));
                } catch (e) {
                    log.error(`Failed to fetch reviews for restaurant ${id}`, e);
                    restaurant.reviews = [];
                }
            } else if (restaurant?.reviews) {
                restaurant.reviews = restaurant.reviews.map((rev: any) => ({
                    ...rev,
                    ratings: {
                        food: rev.foodRating || 0,
                        delivery: rev.deliveryRating || 0,
                        service: rev.serviceRating || 0
                    },
                    date: rev.createdAt?.split('T')[0] || rev.date
                }));
            }

            if (restaurant) {
                await cache.set(`restaurant_${id}`, restaurant);
            }
            return restaurant;
        } catch (error) {
            log.error(`Failed to fetch restaurant ${id}`, error);
            return (await cache.get<Restaurant>(`restaurant_${id}`)) || null;
        }
    },
    async getMenu(restaurantId: string): Promise<Dish[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            return (await cache.get<Dish[]>(`menu_${restaurantId}`)) || [];
        }

        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu`);
            const menuData = response.data?.data || [];
            const dishes = menuData.reduce((acc: Dish[], category: any) => {
                if (category.items) acc.push(...category.items);
                return acc;
            }, []);
            await cache.set(`menu_${restaurantId}`, dishes);
            return dishes;
        } catch (error) {
            log.error(`Failed to fetch menu for ${restaurantId}`, error);
            return (await cache.get<Dish[]>(`menu_${restaurantId}`)) || [];
        }
    },
    async getSearchSuggestions(): Promise<string[]> {
        try {
            const restaurants = await restaurantAPI.getRestaurants();
            const cuisines = Array.from(new Set(restaurants.flatMap((r: any) => r.cuisine || [])));
            return (cuisines as string[]).slice(0, 8);
        } catch {
            return ['Burger', 'Sushi', 'Pizza', 'Salade', 'Healthy'];
        }
    },
    async getPopularSearches(): Promise<string[]> {
        try {
            const response = await api.get('/search/popular');
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to fetch popular searches', error);
            return [];
        }
    }
};

// export const promoAPI = {
//     async getPromoBanner(): Promise<{ title: string; code: string; color: string } | null> {
//         return {
//             title: "-30% sur votre première commande",
//             code: "FOODIE30",
//             color: "#8B5CF6",
//         };
//     },
//     async validatePromoCode(code: string, subtotal?: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
//         try {
//             const response = await api.post('/promos/validate', { code, subtotal });
//             const { success, data, message } = response.data;
            
//             return {
//                 valid: success,
//                 discount: data?.type === 'percent' ? data.discount / 100 : data?.discount,
//                 message: data?.message || message
//             };
//         } catch (error: any) {
//             return {
//                 valid: false,
//                 message: error.response?.data?.message || 'Code promo invalide'
//             };
//         }
//     }
// }

export const userAPI = {

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        await storage.setItem(STORAGE_KEYS.USER, user);
        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        return { user, token };
    },
    async getCurrentUser(): Promise<User | null> {
        return await storage.getItem(STORAGE_KEYS.USER);
    },
    async getFavorites(): Promise<Restaurant[]> {
        try {
            const response = await api.get('/favorites');
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to fetch favorites', error);
            return [];
        }
    },
    async toggleFavorite(restaurantId: string): Promise<boolean> {
        try {
            const favorites = (await storage.getItem<string[]>(STORAGE_KEYS.FAVORITES)) || [];
            const isFav = favorites.includes(restaurantId);
            if (isFav) {
                await api.delete(`/favorites/${restaurantId}`);
                await storage.setItem(STORAGE_KEYS.FAVORITES, favorites.filter(id => id !== restaurantId));
            } else {
                await api.post('/favorites', { restaurantId });
                await storage.setItem(STORAGE_KEYS.FAVORITES, [...favorites, restaurantId]);
            }
            return !isFav;
        } catch (error) {
            log.error('Failed to toggle favorite', error);
            return false;
        }
    },
    async updateProfile(updates: Partial<User>): Promise<User> {
        const response = await api.put('/users/profile', updates);
        const user = response.data.data || response.data;
        await storage.setItem(STORAGE_KEYS.USER, user);
        return user;
    },
    async getAddresses(): Promise<any[]> {
        const response = await api.get('/users/addresses');
        return response.data?.data || [];
    },
    async addAddress(address: any): Promise<any> {
        const response = await api.post('/users/addresses', address);
        return response.data?.data || response.data;
    },
    async updateAddress(id: string, updates: any): Promise<any> {
        const response = await api.put(`/users/addresses/${id}`, updates);
        return response.data?.data || response.data;
    },
    async deleteAddress(id: string): Promise<void> {
        await api.delete(`/users/addresses/${id}`);
    },
    async logout(): Promise<void> {
        await storage.removeItem(STORAGE_KEYS.USER);
        await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await cache.clearAll();
        log.info('User logged out, cache cleared');
    }
}

export const notificationAPI = {
    async getNotifications(): Promise<any[]> {
        const response = await api.get('/notifications');
        return response.data?.data || [];
    },
    async registerPushToken(token: string, platform: string, deviceName?: string): Promise<void> {
        await api.post('/notifications/register-token', { token, platform, deviceName });
    },
    async unregisterPushToken(): Promise<void> {
        await api.delete('/notifications/unregister-token');
    },
    async markAsRead(id: string): Promise<void> {
        await api.patch(`/notifications/${id}/read`);
    },
    async markAllAsRead(): Promise<void> {
        await api.post('/notifications/read-all');
    },
    async saveNotification(notification: any): Promise<void> {
        try {
            await api.post('/notifications', notification);
        } catch (error) {
            log.error('Save notification failed', error);
        }
    }
}

export const orderAPI = {
    async getOrders(): Promise<Order[]> {
        try {
            const response = await api.get('/orders');
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to fetch orders', error);
            return [];
        }
    },
    async getOrderById(id: string): Promise<Order | null> {
        try {
            const response = await api.get(`/orders/${id}`);
            return response.data?.data || null;
        } catch (error) {
            log.error(`Failed to fetch order ${id}`, error);
            return null;
        }
    },
    async trackOrder(id: string): Promise<TrackingData | null> {
        try {
            const response = await api.get(`/orders/${id}/track`);
            return response.data?.data || null;
        } catch (error) {
            log.error(`Failed to track order ${id}`, error);
            return null;
        }
    },
    async createOrder(orderData: any): Promise<Order> {
        const response = await api.post('/orders', orderData);
        return response.data?.data || response.data;
    },
    async syncOfflineOrders(): Promise<void> {
        try {
            const offlineOrders = await storage.getItem<any[]>(STORAGE_KEYS.OFFLINE_ORDERS);
            if (!offlineOrders || offlineOrders.length === 0) return;

            const response = await api.post('/sync/orders', { offlineOrders });
            if (response.data.success) {
                await storage.removeItem(STORAGE_KEYS.OFFLINE_ORDERS);
                log.info(`Synced ${response.data.data.synced} orders`);
            }
        } catch (error) {
            log.error('Failed to sync offline orders', error);
            throw error;
        }
    }
}

export const reviewAPI = {
    async createReview(reviewData: any): Promise<void> {
        log.debug('data review', reviewData);
        await api.post('/reviews', reviewData);
    }
}

export const uploadAPI = {
    async uploadImage(uri: string, type: string): Promise<string> {
        const formData = new FormData();
        formData.append('image', {
            uri,
            name: `${type}_${Date.now()}.jpg`,
            type: 'image/jpeg',
        } as any);
        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data?.url || response.data?.data?.url;
    }
}

export const promoAPI = {
    async getPromoBanner(): Promise<{ title: string; code: string; color: string } | null> {
        try {
            const response = await api.get('/promo-banners');
            return response.data?.data || null;
        } catch {
            return { title: "-30% sur votre première commande", code: "FOODIE30", color: "#6684F1" };
        }
    },
    async validatePromoCode(code: string): Promise<{ valid: boolean; discount?: number; message?: string }> {
        try {
            const response = await api.post('/promo-codes/validate', { code });
            return response.data;
        } catch {
            return { valid: false, message: "Erreur de validation" };
        }
    }
};

export default api;