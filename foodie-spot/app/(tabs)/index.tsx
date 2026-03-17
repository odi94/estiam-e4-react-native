import { MapPin, Search, ShoppingCart } from 'lucide-react-native';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { RestaurantCard } from '@/components/restaurant-card';
import { useCart } from "@/contexts/cart-context";
import { restaurantAPI, promoAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { Restaurant } from '@/types';
import { router } from 'expo-router';
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from '@/contexts/theme-context';


export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<string>('Locating...');
  const [promo, setPromo] = useState<any>(null);
  const { t } = useI18n();
  const { colors } = useTheme();

  useEffect(() => {
    // Fetch restaurants data
    loadData();
    getCurrentLocation();
    loadPromo();
  }, []);

  const loadPromo = async () => {
    const data = await promoAPI.getPromoBanner();
    setPromo(data);
  };

  const loadData = async () => {
    try {
      const coords = await locationService.getCurrentLocation();
      const filters = coords ? { lat: coords.latitude, lng: coords.longitude } : {};
      const data = await restaurantAPI.getRestaurants(filters);
      setRestaurants(data);
    } catch (error) {
      console.error("Failed to load restaurants", error);
      Alert.alert("Error", "Failed to load restaurants");
    }
    finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    const coords = await locationService.getCurrentLocation();
    if (coords) {
      const address = await locationService.reverseGeoCode(coords);
      if (address) {
        setLocation(address);
      }
    }

  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const { totalItems } = useCart();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <View style={styles.topRow}>
          <View style={styles.locationContainer}>
            <MapPin size={20} color="#fff" />
            <View style= {{ flex: 1}}>
              <Text style={styles.locationLabel}>{t('home.locationLabel')} </Text>
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
              <ShoppingCart size={24} color="#fff" />
              {totalItems > 0 && (
                  <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{totalItems}</Text>
                  </View>
              )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: colors.background }]} 
          onPress={() => router.push('/(tabs)/search')}
        >
          <Search size={20} color={colors.gray} />
          <Text style={[styles.searchPlaceholder, { color: colors.gray }]}>{t('home.searchPlaceholder')}</Text>
        </TouchableOpacity>
      </View>


      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Restaurant }) => (
          <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {promo && (
              <View style={[styles.promoBanner, { backgroundColor: promo.color }]}>
                <Text style={styles.promoLabel}>{t('home.promoLabel')}</Text>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoCode}>{t('home.promoCode')} : {promo.code}</Text>
              </View>
            )}
            <CategoryList />
            <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 16 }]}> {t('home.nearby')}</Text>
          </>
        }
        ListFooterComponent={
          !loading && restaurants.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.empty')}</Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#FF6B35" style={{ marginVertical: 20 }} />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    
    </SafeAreaView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cartButton: {
    padding: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    marginLeft: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  cartBadgeText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  content : {
    flex: 1,
  },
  promoBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
  },
  promoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  promoCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  }

});
