import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    // value can be any serialisable object; we stringify here to avoid AsyncStorage warnings
    async setItem(key: string, value: any): Promise<void> {
        try {
            const str = JSON.stringify(value);
            await AsyncStorage.setItem(key, str);
            // log.debug(`Item set: ${key}`);
        } catch (error) {
            // log.error('Error setting item', error);
            throw error;
        }
    },
    async getItem<T>(key: string): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value as unknown as T;
            }
        } catch (error) {
            console.error('Error getting item', error);
            return null;
        }
    },
   async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            // log.debug(`Item removed: ${key}`);
        } catch (error) {
            // log.error('Error removing item', error);
            throw error;
        }
    },
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
            // log.debug('Storage cleared');
        } catch (error) {
            // log.error('Error clearing storage', error);
            throw error;
        }
    },
    async getAllKeys(): Promise<string[]> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            return keys.map(key => key.replace('cache_', ''));
        } catch {
            // log.error('Error getting all keys', error);
            return [];
        }
    },
    async getPromoBanner(): Promise<{ title: string; code: string; color: string } | null> {
        return {
            title: "-30% sur votre première commande",
            code: "FOODIE30",
            color: "#8B5CF6",
        };
    }
};

export const STORAGE_KEYS = {
    // USER: 'user',
    AUTH_TOKEN: 'authToken',
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
    CART: 'cart',
    FAVORITES: 'foodie_favorites',
    LOCALE: 'foodie_locale',
    RECENT_SEARCHES: 'recentSearches',
    CACHED_RESTAURANTS: 'cachedRestaurants',
    OFFLINE_ORDERS: 'offlineOrders',
} as const;