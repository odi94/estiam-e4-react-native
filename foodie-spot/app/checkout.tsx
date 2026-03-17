import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, ChevronRight, Tag } from 'lucide-react-native';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { orderAPI, promoAPI } from '@/services/api';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/contexts/theme-context';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address } from '@/types';

export default function CheckoutScreen() {
  const { items, totalPrice, deliveryFee, serviceFee, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { colors } = useTheme();
  
  const [promoCode, setPromoCode] = useState('');
  const [isPromoValid, setIsPromoValid] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  const [address, setAddress] = useState<Address | null>((user?.addresses?.[0] as unknown as Address) || null);

  useFocusEffect(
    useCallback(() => {
      const loadSelectedAddress = async () => {
        try {
          const storedId = await AsyncStorage.getItem('selectedAddressId');
          if (storedId && user?.addresses) {
            const foundAddress = user.addresses.find(a => a.id === storedId);
            if (foundAddress) {
              setAddress(foundAddress as unknown as Address);
              return;
            }
          }
          if (user?.addresses?.length) {
            setAddress(user.addresses[0] as unknown as Address);
          }
        } catch (e) {
          console.error('Failed to load selected address id', e);
        }
      };
      loadSelectedAddress();
    }, [user?.addresses])
  );

  const currentOrderTotal = totalPrice + deliveryFee + serviceFee - discountAmount;

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidating(true);
    try {
      const result = await promoAPI.validatePromoCode(promoCode);
      if (result.valid && result.discount) {
        setIsPromoValid(true);
        const discount = totalPrice * result.discount;
        setDiscountAmount(discount);
        setPromoMessage(result.message || 'Succès');
      } else {
        setIsPromoValid(false);
        setDiscountAmount(0);
        setPromoMessage(result.message || 'Code invalide');
      }
    } catch {
      setPromoMessage('Erreur de validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address) {
      Alert.alert(t('common.error') || "Erreur", t('checkout.select_address_error'));
      return;
    }

    setLoading(true);
    try {
      const restaurantId = items[0]?.dish.restaurantId || 'r1';
      
      const orderData = {
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.dish.id,
          quantity: item.quantity
        })),
        deliveryAddress: address,
        paymentMethod: 'card', 
        total: currentOrderTotal,
        subtotal: totalPrice,
        deliveryFee,
        serviceFee,
        promoCode: isPromoValid ? promoCode : undefined,
        discount: discountAmount
      };

      const result = await orderAPI.createOrder(orderData);
      clearCart();
      Alert.alert(
        t('checkout.success_title'),
        t('checkout.success_msg'),
        [{ text: t('checkout.track_order'), onPress: () => router.replace(`/tracking/${result.id}` as any) }]
      );
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert(t('common.error') || "Erreur", t('checkout.error'));
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('checkout.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.address')}</Text>
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => {
              router.push('/addresses?selectable=true');
            }}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.tint + '20' }]}>
              <MapPin size={20} color={colors.tint} />
            </View>
            <View style={styles.cardContent}>
              {address ? (
                <>
                  <Text style={[styles.cardLabel, { color: colors.text }]}>{address.label}</Text>
                  <Text style={[styles.cardSublabel, { color: colors.gray }]}>{address.street}, {address.city}</Text>
                </>
              ) : (
                <Text style={[styles.cardLabel, { color: colors.text }]}>{t('checkout.add_address')}</Text>
              )}
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.payment')}</Text>
          <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.cardIcon, { backgroundColor: colors.tint + '20' }]}>
              <CreditCard size={20} color={colors.tint} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: colors.text }]}>{t('checkout.payment_method') || 'Carte bancaire'}</Text>
              <Text style={[styles.cardSublabel, { color: colors.gray }]}>**** **** **** 4242</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.promo_code') || 'Code Promo'}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.cardIcon, { backgroundColor: colors.tint + '20' }]}>
                <Tag size={20} color={colors.tint} />
              </View>
              <TextInput
                style={[styles.promoInput, { color: colors.text, flex: 1 }]}
                placeholder={t('checkout.add_promo') || 'Entrer le code (ex: BIENVENUE30)'}
                placeholderTextColor={colors.gray}
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  if (isPromoValid) {
                    setIsPromoValid(false);
                    setDiscountAmount(0);
                    setPromoMessage('');
                  }
                }}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                onPress={handleValidatePromo}
                disabled={isValidating || !promoCode.trim()}
                style={[styles.applyButton, { backgroundColor: colors.tint }]}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.applyButtonText}>{t('checkout.apply')}</Text>
                )}
              </TouchableOpacity>
            </View>
            {promoMessage !== '' && (
              <Text style={[styles.promoMessage, { color: isPromoValid ? colors.success : colors.error }]}>
                {promoMessage}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.summary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('checkout.articles') || 'Articles'} ({items.length})</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalPrice.toFixed(2)} €</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Remise ({promoCode})</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-{discountAmount.toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('cart.delivery')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{deliveryFee.toFixed(2)} €</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('cart.service')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{serviceFee.toFixed(2)} €</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>{currentOrderTotal.toFixed(2)} €</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.payButton, (loading || items.length === 0) && styles.disabledButton, { backgroundColor: colors.tint }]} 
          onPress={handlePlaceOrder}
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>{t('checkout.placeOrder')} {currentOrderTotal.toFixed(2)} €</Text>
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
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#333' },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12,
  },
  cardIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFE5DB', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  cardSublabel: { fontSize: 14, marginTop: 2 },
  orderSummary: { padding: 16, borderRadius: 12, marginTop: 12 },
  promoInput: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  promoMessage: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 52,
    fontWeight: '500',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1 },
  payButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
