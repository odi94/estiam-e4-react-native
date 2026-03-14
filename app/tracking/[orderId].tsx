import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator } from "react-native";
import { Order } from "@/types";
import { orderAPI } from "@/services/api";

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams(); // enlever le type générique pour éviter l'erreur
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await orderAPI.getOrderById(orderId); // on garde simple, pas de type générique
      setOrder(orderData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    // Option : rafraîchir toutes les 15s
    const interval = setInterval(loadOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Commande introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Suivi commande</Text>
        <Text style={styles.subtitle}>Commande #{order.id}</Text>

        {/* Carte d’infos principales */}
        <View style={styles.card}>
          <Text style={styles.label}>Restaurant</Text>
          <Text style={styles.value}>{order.restaurantName}</Text>

          <Text style={styles.label}>Statut</Text>
          <Text style={styles.status}>{order.status}</Text>

          <Text style={styles.label}>Adresse de livraison</Text>
          <Text style={styles.value}>{order.deliveryAddress}</Text>
        </View>

        {/* Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <View style={styles.timeline}>
            <Text style={styles.sectionTitle}>Timeline :</Text>
            {order.timeline.map((step, index) => (
              <View key={index} style={styles.step}>
                <Text style={styles.stepTitle}>{step.status}</Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Infos livreur */}
        {order.driverInfo && (
          <View style={styles.delivery}>
            <Text style={styles.sectionTitle}>Livreur :</Text>
            <Text>Nom : {order.driverInfo.name}</Text>
            <Text>Téléphone : {order.driverInfo.phone}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeline: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  step: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
  },
  stepTime: {
    fontSize: 14,
    color: '#666',
  },
  delivery: {
    marginTop: 20,
  },
});