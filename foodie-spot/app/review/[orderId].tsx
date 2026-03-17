import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, ArrowLeft, Camera, X } from 'lucide-react-native';
import { reviewAPI, uploadAPI, orderAPI } from '@/services/api';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/contexts/theme-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

type Ratings = {
  food: number;
  delivery: number;
  service: number;
};

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [ratings, setRatings] = useState<Ratings>({
    food: 0,
    delivery: 0,
    service: 0,
  });
  const [comment, setComment] = useState('');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { colors } = useTheme();

  const handleRating = (key: keyof Ratings, val: number) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      try {
        const order = await orderAPI.getOrderById(orderId);
        if (order) {
          setRestaurantId(order.restaurantId);
        }
      } catch (error) {
        console.error("Error fetching order for review:", error);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    if (ratings.food === 0) {
      Alert.alert(t('review.rating_required') || "Note requise", t('review.rating_required_msg') || "Veuillez noter la qualité de la nourriture.");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        images.map((uri: string) => uploadAPI.uploadImage(uri, 'review'))
      );

      await reviewAPI.createReview({
        orderId,
        restaurantId,
        rating: ratings.food, // Global/Food rating
        qualityRating: ratings.food,
        speedRating: ratings.delivery,
        presentationRating: ratings.service,
        comment,
        images: imageUrls,
      });

      Alert.alert(t('review.success') || "Succès", t('review.success_msg') || "Merci pour votre avis !", [
        { text: t('review.back_to_orders') || "Retour", onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error') || "Erreur", t('review.error') || "Impossible de publier l'avis.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (key: keyof typeof ratings, currentRating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => handleRating(key, star)}>
          <Star 
            size={28} 
            color={star <= currentRating ? "#FFC107" : colors.lightGray} 
            fill={star <= currentRating ? "#FFC107" : "transparent"} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('review.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.question, { color: colors.text }]}>{t('review.question')}</Text>
        <Text style={[styles.subquestion, { color: colors.gray }]}>{t('review.subquestion')}</Text>

        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>Qualité des plats</Text>
          {renderStars('food', ratings.food)}
        </View>

        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>Rapidité de livraison</Text>
          {renderStars('delivery', ratings.delivery)}
        </View>

        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>Service client</Text>
          {renderStars('service', ratings.service)}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{t('review.comment_label')}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.lightGray, borderColor: colors.border, color: colors.text }]}
            placeholder={t('review.placeholder')}
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <View style={styles.photoSection}>
          <Text style={[styles.label, { color: colors.text }]}>Photos (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {images.map((uri: string, index: number) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(index)}>
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={[styles.photoButton, { borderColor: colors.tint }]} onPress={pickImage}>
                <Camera size={24} color={colors.tint} />
                <Text style={[styles.photoButtonText, { color: colors.tint }]}>{t('review.add_photo')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.submitButton, (loading || ratings.food === 0) && styles.disabledButton, { backgroundColor: colors.tint }]} 
          onPress={handleSubmit}
          disabled={loading || ratings.food === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t('review.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: 20 },
  question: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subquestion: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  ratingSection: { width: '100%', marginBottom: 24, alignItems: 'center' },
  ratingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 12 },
  inputContainer: { width: '100%', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  textInput: { 
    width: '100%', 
    height: 120, 
    borderRadius: 16, 
    padding: 16, 
    textAlignVertical: 'top',
    borderWidth: 1,
    fontSize: 16,
  },
  photoSection: { width: '100%', marginBottom: 20 },
  imagesScroll: { flexDirection: 'row', marginTop: 8 },
  imageWrapper: { position: 'relative', marginRight: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  removeImage: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 10, 
    width: 20, 
    height: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  photoButton: { 
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderStyle: 'dashed'
  },
  photoButtonText: { fontSize: 12, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1 },
  submitButton: { padding: 16, borderRadius: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
