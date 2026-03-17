import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Phone, Clock, MapPin, CheckCircle2, Circle } from "lucide-react-native";
import { TrackingData } from "@/types";
import { orderAPI } from "@/services/api";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/contexts/theme-context";
import log from "@/services/logger";

export default function TrackingScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();
    const { colors } = useTheme();

    const loadTracking = useCallback(async () => {
        try {
            const data = await orderAPI.trackOrder(orderId);
            if (data) setTracking(data);
        } catch (error) {
            log.error("Erreur lors du suivi", error);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadTracking();
        const interval = setInterval(loadTracking, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [loadTracking]);

    const handleCallDriver = () => {
        if (tracking?.driver?.phone) {
            Linking.openURL(`tel:${tracking.driver.phone}`);
        }
    };

    if (loading && !tracking) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.gray }]}>{t('tracking.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!tracking) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.gray }]}>{t('tracking.unavailable')}</Text>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>{t('tracking.back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tracking.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.topCard, { backgroundColor: colors.card }]}>
                    <View style={styles.timing}>
                        <Clock size={20} color={colors.tint} />
                        <View>
                            <Text style={[styles.timingLabel, { color: colors.gray }]}>{t('tracking.arrival')}</Text>
                            <Text style={[styles.timingValue, { color: colors.tint }]}>
                                {tracking.estimatedMinutes ? `${tracking.estimatedMinutes} min` : t('tracking.calculating')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.orderInfo}>
                        <Text style={[styles.orderNumber, { color: colors.gray }]}>Commande {tracking.orderNumber}</Text>
                        <Text style={[styles.restaurantName, { color: colors.text }]}>{tracking.restaurant?.name}</Text>
                    </View>
                </View>

                {tracking.driver && (
                    <View style={[styles.driverCard, { backgroundColor: colors.card }]}>
                        <View style={styles.driverInfo}>
                            <Image source={{ uri: tracking.driver.photo }} style={styles.driverAvatar} />
                            <View style={styles.driverDetails}>
                                <Text style={[styles.driverName, { color: colors.text }]}>{tracking.driver.name}</Text>
                                <Text style={[styles.driverVehicle, { color: colors.gray }]}>{tracking.driver.vehicle}</Text>
                                <View style={styles.driverRating}>
                                    <Text style={[styles.ratingText, { color: colors.text }]}>⭐ {tracking.driver.rating}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                                <Phone size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={[styles.stepperCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracking.steps_title')}</Text>
                    <View style={styles.stepper}>
                        {tracking.steps.map((step, index) => (
                            <View key={step.key} style={styles.stepItem}>
                                <View style={styles.stepIcons}>
                                    {step.completed ? (
                                        <CheckCircle2 size={24} color={colors.tint} fill={colors.card} />
                                    ) : (
                                        <Circle size={24} color={colors.border} />
                                    )}
                                    {index < tracking.steps.length - 1 && (
                                        <View style={[styles.stepLine, { backgroundColor: colors.border }, step.completed && { backgroundColor: colors.tint }]} />
                                    )}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[styles.stepLabel, { color: colors.gray }, step.completed && { color: colors.text, fontWeight: '600' }]}>
                                        {step.label}
                                    </Text>
                                    {step.time && (
                                        <Text style={[styles.stepTime, { color: colors.gray }]}>
                                            {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.addressCard, { backgroundColor: colors.card }]}>
                    <View style={styles.addressHeader}>
                        <MapPin size={18} color={colors.gray} />
                        <Text style={[styles.addressTitle, { color: colors.gray }]}>{t('tracking.address_title')}</Text>
                    </View>
                    <Text style={[styles.addressText, { color: colors.text }]}>
                        {tracking.deliveryAddress?.street 
                            ? `${tracking.deliveryAddress.street}, ${tracking.deliveryAddress.city}` 
                            : (tracking.deliveryAddress?.address || tracking.deliveryAddress || t('tracking.no_address'))}
                    </Text>
                </View>

                {/* Actions post-livraison */}
                {/* {(tracking.status === 'delivered' || tracking.steps[tracking.steps.length - 1]?.completed) && (
                    <View style={styles.deliveredActions}>
                        <Text style={[styles.deliveredTitle, { color: colors.text }]}>
                            🎉 {t('tracking.delivered_success')}
                        </Text>
                        <TouchableOpacity 
                            style={[styles.returnButton, { backgroundColor: colors.tint }]} 
                            onPress={() => router.replace('/(tabs)')}
                        >
                            <Text style={styles.returnButtonText}>
                                {t('tracking.return_home')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )} */}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    topCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    timing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timingLabel: {
        fontSize: 12,
        color: '#666',
    },
    timingValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    orderInfo: {
        alignItems: 'flex-end',
    },
    orderNumber: {
        fontSize: 12,
        color: '#999',
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    driverCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    driverDetails: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
    },
    driverVehicle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    callButton: {
        backgroundColor: '#4CAF50',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
    },
    stepper: {
        marginLeft: 4,
    },
    stepItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    stepIcons: {
        alignItems: 'center',
        width: 30,
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#eee',
        marginVertical: 4,
    },
    stepContent: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 20,
    },
    stepLabel: {
        fontSize: 15,
    },
    stepLabelCompleted: {
        fontWeight: '600',
    },
    stepTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    addressCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    addressTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    addressText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    deliveredActions: {
        marginTop: 16,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
    },
    deliveredTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    returnButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    returnButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});