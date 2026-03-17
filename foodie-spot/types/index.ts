export interface Restaurant {
    id: string;
    name: string;
    description: string;
    image: string;
    coverImage?: string;
    cuisine: string[]; 
    priceRange?: string;
    rating: number;
    reviewCount: number; 
    deliveryTime: { min: number; max: number } | number; 
    deliveryFee: number;
    minimumOrder?: number;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    isOpen?: boolean;
    isFavorite?: boolean;
    distance?: number;
    reviews?: Review[];
}

export interface Review {
    id: string;
    userName: string;
    userImage?: string;
    rating: number;
    ratings?: {
        food: number;
        delivery: number;
        service: number;
    };
    comment: string;
    images?: string[];
    date: string;
}

export interface SearchFilters {
    cuisine?: string;
    priceRange?: number;
    rating?: number;
    deliveryTime?: number;
    isOpen?: boolean;
}

export interface Dish {
    id: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    allergens?: string[];
    isAvailable: boolean;
}

export interface CartItem {
    menuItemId: string; 
    quantity: number;
    dish: Dish; 
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    addresses?: Address[];
    favoriteRestaurants?: string[];
}

export interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    postalCode: string;
    latitude: number;
    longitude: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    restaurantId: string;
    restaurantName: string;
    items: any[]; 
    total: number;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';
    createdAt: string;
    estimatedDelivery?: string;
    deliveryAddress: string | any;
    driver?: {
        name: string;
        phone: string;
        photo?: string;
        vehicle?: string;
        rating?: number;
    };
    timeline: { status: string; timestamp: string; message: string }[];
}

export interface TrackingData {
    orderId: string;
    orderNumber: string;
    status: string;
    timeline: any[];
    estimatedDelivery: string;
    estimatedArrival?: string;
    estimatedMinutes?: number;
    restaurant: {
        id: string;
        name: string;
        image: string;
        phone: string;
        location: {
            latitude: number;
            longitude: number;
            address: string;
        };
    } | null;
    deliveryAddress: any;
    driver?: {
        id: string;
        name: string;
        phone: string;
        photo: string;
        vehicle: string;
        rating: number;
        totalDeliveries?: number;
    };
    driverLocation?: {
        latitude: number;
        longitude: number;
        heading: number;
        speed: number;
        updatedAt: string;
    };
    steps: {
        key: string;
        label: string;
        completed: boolean;
        time?: string;
    }[];
}
