import { OrderCard } from "@/components/order-card";
import { orderAPI } from "@/services/api";
import { Order } from "@/types";
import { useI18n } from '@/hooks/use-i18n';
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '@/contexts/theme-context'; 

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'ongoing' | 'delivered' | 'cancelled'>('all');
    const { t } = useI18n();
    const { colors } = useTheme();

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        if (filter === 'ongoing') return !['delivered', 'cancelled'].includes(order.status);
        return order.status === filter;
    });

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

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
    }


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{t('orders.title')}</Text>
            </View>

            <View style={styles.filters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterContainer}>
                        {(['all', 'ongoing', 'delivered', 'cancelled'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterBtn, 
                                    { backgroundColor: colors.lightGray },
                                    filter === f && { backgroundColor: colors.tint }
                                ]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[
                                    styles.filterText, 
                                    { color: colors.gray },
                                    filter === f && styles.filterTextActive
                                ]}>
                                    {t(`orders.filters.${f}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
                ) : filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.gray }]}>{t('orders.empty')}</Text>
                        </View>
                    </View>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onPress={() => {
                                if (order.status === 'delivered') {
                                    router.push(`/review/${order.id}` as any);
                                } else if (!['cancelled'].includes(order.status) && order.id) {
                                    router.push(`/tracking/${order.id}` as any);
                                } else {
                                    Alert.alert('Info', 'Cette commande est annulée.');
                                }
                            }}
                        />
                    ))
                )}
            </ScrollView>

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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    filters: {
        padding: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    filterBtnActive: {
        backgroundColor: '#FF6B35',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
});