// app/_layout.tsx

import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { ToastProvider } from '@/components/toast-provider';
import { FloatingCartBar } from '@/components/floating-cart-bar';
import { useOffline } from '@/hooks/use-offline';
import { useTheme, ThemeProvider } from '@/contexts/theme-context';
import { useI18n } from '@/hooks/use-i18n';
import { I18nProvider } from '@/contexts/i18n-context';


export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutContent() {
  const { theme, colors } = useTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth, isOnboardingSeen } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useI18n();

  // Navigation Guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnboarding = segments[0] === 'onboarding';

    console.log('🛡️ [NavigationGuard]', { segments, isAuthenticated, inAuthGroup, inTabsGroup, isOnboarding });

    if (!segments[0]) return;

    if (!isAuthenticated && !inAuthGroup && !isOnboarding) {
      if (!isOnboardingSeen) {
        console.log('📦 Redirecting to onboarding...');
        setTimeout(() => router.replace('/onboarding'), 0);
      } else {
        console.log('🔒 Redirecting to login...');
        setTimeout(() => router.replace('/(auth)/login'), 0);
      }
    } else if (isAuthenticated && (inAuthGroup || isOnboarding)) {
      console.log('✅ Redirecting to home...');
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [segments, isLoading, isAuthenticated, isOnboardingSeen, router]);

  useEffect(() => {
    if (segments[0] === '(tabs)' && !isLoading && !isAuthenticated) {
      refreshAuth();
    }
  }, [segments, isLoading, isAuthenticated, refreshAuth]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingLogo}>🍔</Text>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.gray }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <NavigationProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {t('common.offline')} {pendingCount > 0 && `• ${pendingCount} en attente`}
          </Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncNow} disabled={isSyncing}>
          <Ionicons name={isSyncing ? 'sync' : 'sync-outline'} size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {isSyncing ? 'Synchronisation...' : `Synchroniser ${pendingCount} action(s)`}
          </Text>
        </TouchableOpacity>
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dish/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracking/[orderId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="review/[orderId]" options={{ presentation: 'modal' }} />
      </Stack>

      <FloatingCartBar />

      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingLogo: { fontSize: 64, marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  syncBanner: { backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <RootLayoutContent />
              </CartProvider>
            </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}