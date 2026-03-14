import { OrderCard } from "@/components/order-card";
import { orderAPI } from "@/services/api";
import { Order } from "@/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { 
    ScrollView, 
    StyleSheet, 
    Text, 
    View, 
    RefreshControl, 
    ActivityIndicator, 
    TouchableOpacity 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Filter = 'all' | 'pending' | 'delivered' | 'cancelled';

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await orderAPI.getOrders();
            setOrders(data);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    // Filtrer les commandes selon le statut
    const filteredOrders = orders.filter(order => {
        if(filter === 'all') return true;
        if(filter === 'pending') return ['preparing','on-the-way'].includes(order.status);
        if(filter === 'delivered') return order.status === 'delivered';
        if(filter === 'cancelled') return order.status === 'cancelled';
        return true;
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mes Commandes</Text>
            </View>

            {/* Spinner de chargement */}
            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ) : (
                <>
                    {/* Onglets/filtres */}
                    <View style={styles.tabs}>
                        {['all','pending','delivered','cancelled'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={styles.tabButton}
                                onPress={() => setFilter(status as Filter)}
                            >
                                <Text style={[styles.tab, filter === status && styles.activeTab]}>
                                    {status === 'all' ? 'Toutes' :
                                     status === 'pending' ? 'En cours' :
                                     status === 'delivered' ? 'Livrées' :
                                     'Annulées'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Liste des commandes */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {filteredOrders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="cart-off" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>Aucune commande trouvée.</Text>
                            </View>
                        ) : (
                            filteredOrders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onPress={() => {
                                        if (['preparing','on-the-way'].includes(order.status)) {
                                            router.push(`/tracking/${order.id}`);
                                        } else {
                                            router.push(`/orders/${order.id}`);
                                        }
                                    }}
                                />
                            ))
                        )}
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 12,
    },
    tabButton: {
        padding: 8,
    },
    tab: {
        fontSize: 16,
        color: '#666',
    },
    activeTab: {
        color: '#000',
        fontWeight: 'bold',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});