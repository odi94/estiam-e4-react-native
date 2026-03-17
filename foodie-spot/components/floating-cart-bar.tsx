import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { ShoppingBag } from 'lucide-react-native';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/hooks/use-i18n';

export function FloatingCartBar() {
  const { totalItems, orderTotal } = useCart();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments() as string[];

  const translateY = useSharedValue(100);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const [isDismissed, setIsDismissed] = useState(false);
  const [lastTotalItems, setLastTotalItems] = useState(totalItems);

  useEffect(() => {
    if (totalItems !== lastTotalItems) {
      if (totalItems > lastTotalItems) {
        setIsDismissed(false);
        translateX.value = withSpring(0);
      }
      setLastTotalItems(totalItems);
    }
  }, [totalItems, lastTotalItems, translateX]);

  const isHiddenScreen = segments.includes('cart') || 
                         segments.includes('checkout') || 
                         segments.includes('tracking') ||
                         segments.includes('(auth)');

  const isVisible = totalItems > 0 && !isHiddenScreen && !isDismissed;

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1);
    } else {
      translateY.value = withSpring(100);
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0.9);
    }
  }, [isVisible, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 100 || Math.abs(event.velocityX) > 500) {
        translateX.value = withTiming(event.translationX > 0 ? 500 : -500, { duration: 250 }, (finished) => {
          if (finished) {
            runOnJS(setIsDismissed)(true);
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  if (!isVisible && totalItems === 0) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={[styles.bar, { backgroundColor: colors.tint }]} 
        onPress={() => router.push('/cart')}
        activeOpacity={0.9}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.title}>{t('cart.title')}</Text>
        </View>
        
        <View style={styles.right}>
          <Text style={styles.price}>{orderTotal.toFixed(2)}€</Text>
          <ShoppingBag size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', 
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
