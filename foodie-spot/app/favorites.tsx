import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { restaurantAPI } from '@/services/api';
import { Restaurant } from '@/types';
import { RestaurantCard } from '@/components/restaurant-card';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/contexts/theme-context';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { colors } = useTheme();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await restaurantAPI.getRestaurants();
      setFavorites(data.filter(r => r.isFavorite));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('favorites.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centered}>
          <Heart size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.gray }]}>{t('favorites.empty')}</Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: colors.tint }]} 
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.browseButtonText}>{t('cart.browse_restaurants')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard 
              restaurant={item} 
              onPress={() => router.push(`/restaurant/${item.id}`)} 
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, marginBottom: 24 },
  browseButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseButtonText: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16 },
});
