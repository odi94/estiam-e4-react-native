import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useCart } from '@/contexts/cart-context';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/contexts/theme-context';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, deliveryFee, serviceFee, orderTotal } = useCart();
  const { t } = useI18n();
  const { colors } = useTheme();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert(t('cart.empty_title'), t('cart.empty_message'));
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('cart.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.gray }]}>{t('cart.empty')}</Text>
          <TouchableOpacity style={[styles.browseButton, { backgroundColor: colors.tint }]} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.browseButtonText}>{t('cart.browse_restaurants')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('cart.title')}</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>{t('cart.clear')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.dish.id}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card }]}>
            <Image source={{ uri: item.dish.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.dish.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.gray }]}>{item.dish.price} €</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { borderColor: colors.tint }]} 
                  onPress={() => updateQuantity(item.dish.id, item.quantity - 1)}
                >
                  <Minus size={16} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { borderColor: colors.tint }]} 
                  onPress={() => updateQuantity(item.dish.id, item.quantity + 1)}
                >
                  <Plus size={16} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.dish.id)}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('cart.subtotal')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalPrice.toFixed(2)}€</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('cart.delivery')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{deliveryFee.toFixed(2)}€</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>{t('cart.service')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{serviceFee.toFixed(2)}€</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.tint }]}>{orderTotal.toFixed(2)}€</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutButton, { backgroundColor: colors.tint }]}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>{t('cart.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 4 },
  clearText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, marginBottom: 24 },
  browseButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseButtonText: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16 },
  cartItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  itemImage: { width: 70, height: 70, borderRadius: 8 },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#666', marginBottom: 8 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  qtyText: { fontSize: 16, fontWeight: '700' },
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
  },
  summary: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#666', fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  checkoutButton: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20 
  },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
