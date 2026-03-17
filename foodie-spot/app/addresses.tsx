import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Building } from 'lucide-react-native';

import { userAPI } from '@/services/api';
import { Address } from '@/types';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { selectable } = useLocalSearchParams<{ selectable?: string }>();
  const isSelectable = selectable === 'true';
  
  // Form state
  const [label, setLabel] = useState('House');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const { t } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();

  const loadAddresses = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleAddAddress = async () => {
    if (!street || !city || !postalCode || !label) {
      Alert.alert(t('common.error') || 'Error', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsSubmitting(true);
      const newAddress = {
        label,
        street,
        city,
        postalCode,
        latitude: 48.8566, 
        longitude: 2.3522
      };
      await userAPI.addAddress(newAddress);
      toast.success('Adresse ajoutée !');
      setModalVisible(false);
      
      setLabel('Maison');
      setStreet('');
      setCity('');
      setPostalCode('');
      
      loadAddresses();
    } catch (error) {
      console.error('Failed to add address:', error);
      Alert.alert(t('common.error') || 'Error', 'Impossible d\'ajouter l\'adresse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert(
      'Supprimer l\'adresse', 
      'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.deleteAddress(id);
              toast.success('Adresse supprimée');
              loadAddresses();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');
            }
          }
        }
      ]
    );
  };

  const getLabelIcon = (labelName: string) => {
    const l = labelName.toLowerCase();
    if (l.includes('travail') || l.includes('work') || l.includes('bureau')) return <Briefcase size={20} color={colors.text} />;
    if (l.includes('autre') || l.includes('other')) return <Building size={20} color={colors.text} />;
    return <Home size={20} color={colors.text} />;
  };

  const handleSelectAddress = async (address: Address) => {
    if (isSelectable && address.id) {
      await AsyncStorage.setItem('selectedAddressId', address.id);
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes adresses</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerButton}>
          <Plus size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.centered}>
          <MapPin size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.gray }]}>Aucune adresse enregistrée</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.tint }]} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Ajouter une adresse</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelectAddress(item)}
              disabled={!isSelectable}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                {getLabelIcon(item.label)}
              </View>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.addressText, { color: colors.gray }]}>{item.street}</Text>
                <Text style={[styles.addressText, { color: colors.gray }]}>{item.postalCode} {item.city}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={(e) => {
                e.stopPropagation();
                handleDeleteAddress(item.id || '');
              }}>
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle adresse</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={{ color: colors.tint, fontWeight: '600', fontSize: 16 }}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Type d&apos;adresse</Text>
            <View style={styles.labelChips}>
              {['Maison', 'Travail', 'Autre'].map((preset) => (
                <TouchableOpacity 
                  key={preset}
                  style={[
                    styles.labelChip, 
                    { backgroundColor: label === preset ? colors.tint : colors.card, borderColor: colors.border }
                  ]}
                  onPress={() => setLabel(preset)}
                >
                  <Text style={{ color: label === preset ? '#fff' : colors.text, fontWeight: '600' }}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Rue et Numéro</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="ex: 123 Rue de la Paix"
              placeholderTextColor={colors.gray}
              value={street}
              onChangeText={setStreet}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Code Postal</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="ex: 75000"
                  placeholderTextColor={colors.gray}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Ville</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="ex: Paris"
                  placeholderTextColor={colors.gray}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.tint, opacity: isSubmitting ? 0.7 : 1 }]} 
              onPress={handleAddAddress}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer l&apos;adresse</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

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
  headerButton: { padding: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, marginBottom: 24 },
  addButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 2,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  labelChips: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: 32,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
