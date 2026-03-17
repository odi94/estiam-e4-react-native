import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MapPin, Heart, ShoppingBag, Phone, Camera, ChevronRight, LogOut, Globe, Moon, Sun } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { userAPI, uploadAPI, orderAPI } from '@/services/api';
import log from '@/services/logger';
import { useToast } from '@/components/toast-provider';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/hooks/use-i18n';
import { useOffline } from '@/hooks/use-offline';
import { useTheme } from '@/contexts/theme-context';

export const unstable_settings = {
  initialRouteName: 'profile',
};

export default function ProfileScreen() {

  const toast = useToast();
  const { user, logout } = useAuth();
  const { t, locale, toggleLanguage } = useI18n();
  const { theme, mode, setMode, colors } = useTheme();
  const [orderCount, setOrderCount] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(user?.favoriteRestaurants?.length || 0);

  const loadUserData = useCallback(async () => {
    if (user) {
      try {
        const [orders, favs, addrs] = await Promise.all([
          orderAPI.getOrders(),
          userAPI.getFavorites(),
          userAPI.getAddresses()
        ]);
        setOrderCount(orders.length);
        setFavoritesCount(favs.length);
        setAddresses(addrs);
      } catch (error) {
        log.error('Failed to load user data on profile focus', error);
      }
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin d'accéder à vos photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos', 'livePhotos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      try {
        const imageUrl = await uploadAPI.uploadImage(result.assets[0].uri, 'profile');
        await userAPI.updateProfile({ avatar: imageUrl });
        toast.success('Photo de profil mise à jour !'); 
      } catch (error) {
        log.error('Failed to upload profile photo:', error);
        Alert.alert('Erreur', 'Impossible de télécharger la photo');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ marginTop: 10, color: colors.gray }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: colors.card || '#fff' }]}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
                  <Text style={styles.avatarText}>{user.firstName?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: colors.tint }]} onPress={handlePickImage}>
                <Camera size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName || 'Utilisateur'} {user?.lastName || ''}</Text>
            <Text style={[styles.userEmail, { color: colors.gray }]}>{user?.email}</Text>
            {user.phone && <Text style={[styles.phone, { color: colors.gray }]}>{user.phone}</Text>}
          </View>
        </View>

        <View style={[styles.stats, { backgroundColor: colors.card || '#fff' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{orderCount}</Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>{t('profile.orders')}</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder, { borderColor: colors.lightGray }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>{t('profile.favorites')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>-</Text>
            <Text style={[styles.statLabel, { color: colors.gray }]}>{t('profile.reviews')}</Text>
          </View>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card || '#fff' }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            router.push('/addresses');
          }}>
            <MapPin size={20} color={colors.gray} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.addresses')}</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                <Text style={styles.badgeText}>{addresses.length || user.addresses?.length || 0}</Text>
              </View>
              <ChevronRight size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/favorites')}>
            <Heart size={20} color={colors.gray} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.favorites')}</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                <Text style={styles.badgeText}>{favoritesCount}</Text>
              </View>
              <ChevronRight size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/orders')}>
            <ShoppingBag size={20} color={colors.gray} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.orders')}</Text>  
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Support', 'Contactez-nous à support@foodiespot.com')}>
            <Phone size={20} color={colors.gray} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.support')}</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
            <Globe size={20} color={colors.gray} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.language')} ({locale.toUpperCase()})</Text>
            <View style={styles.menuRight}>
              <Text style={[styles.badgeText, { color: colors.gray }]}>{locale === 'fr' ? 'Français' : 'English'}</Text>
              <ChevronRight size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
              setMode(nextMode);
            }}
          >
            {theme === 'dark' ? <Moon size={20} color={colors.gray} /> : <Sun size={20} color={colors.gray} />}
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.theme')} ({mode === 'system' ? 'Système' : mode === 'dark' ? 'Sombre' : 'Clair'})</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card || '#fff' }]}>
          <Text style={[styles.menuText, { marginVertical: 8, fontWeight: 'bold', color: colors.gray }]}>{t('profile.divers')}</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.share')}</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme === 'dark' ? '#331a1a' : '#FFF5F5' }]} onPress={handleLogout}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: '#999',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
