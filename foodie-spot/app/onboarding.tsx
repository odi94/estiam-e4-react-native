import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/contexts/auth-context';

const { width } = Dimensions.get('window');
const slides = [
  {
    id: '1',
    emoji: '🍔',
    translationKey: 'slide1',
    gradientColors: ['#FF6B35', '#FF8C69'] as const,
    accent: '#FF6B35',
  },
  {
    id: '2',
    emoji: '⚡',
    translationKey: 'slide2',
    gradientColors: ['#8B5CF6', '#A78BFA'] as const,
    accent: '#8B5CF6',
  },
  {
    id: '3',
    emoji: '💳',
    translationKey: 'slide3',
    gradientColors: ['#10B981', '#34D399'] as const,
    accent: '#10B981',
  },
];

function SlideItem({ item, index, scrollX, t }: { item: typeof slides[0]; index: number; scrollX: ReturnType<typeof useSharedValue<number>>; t: (key: string) => string }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.emojiContainer, animatedStyle]}>
        <LinearGradient colors={item.gradientColors} style={styles.emojiCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </LinearGradient>
      </Animated.View>
      <Animated.View style={animatedStyle}>
        <Text style={styles.title}>{t(`onboarding.${item.translationKey}.title`)}</Text>
        <Text style={styles.description}>{t(`onboarding.${item.translationKey}.desc`)}</Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useI18n();
  const { setIsOnboardingSeen } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await setIsOnboardingSeen(true);
    router.replace('/(auth)/login');
  };

  const currentAccent = slides[currentIndex].accent;

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient hint */}
      <LinearGradient
        colors={[slides[currentIndex].gradientColors[0] + '15', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      {/* Skip */}
      <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
        <Text style={[styles.skipText, { color: currentAccent }]}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => { scrollX.value = e.nativeEvent.contentOffset.x; }}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} t={t} />
        )}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? currentAccent : '#D1D5DB',
                width: i === currentIndex ? 28 : 10,
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: currentAccent }]}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <Text style={styles.nextButtonText}>
          {currentIndex === slides.length - 1 ? t('onboarding.start') : t('onboarding.next')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emojiContainer: {
    marginBottom: 48,
  },
  emojiCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    marginHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
