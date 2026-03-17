import { useEffect, useState, useCallback } from "react";
import { restaurantAPI } from "@/services/api";
import { Dish } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Minus, Plus } from "lucide-react-native";
import { useCart } from "@/contexts/cart-context";
import log from "@/services/logger";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/contexts/theme-context";

export default function DishDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { addItem } = useCart();
    const { t } = useI18n();
    const { colors } = useTheme();
    const [dish, setDish] = useState<Dish | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(true);

    const loadDish = useCallback(async () => {
        setLoading(true);
        try {
            const restaurants = await restaurantAPI.getRestaurants();
            const menus = await Promise.all(restaurants.map(r => restaurantAPI.getMenu(r.id)));
            const allDishes = menus.flat();
            const foundDish = allDishes.find((d) => d.id === id) || null;
            setDish(foundDish);
        } catch (error) {
            log.error("Erreur chargement plat", error);
            console.error("Review error:", error);
            Alert.alert("Erreur", "Impossible de charger le plat.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDish();
    }, [loadDish]);

    const handleAddToCart = () => {
        if (dish) {
            addItem(dish, quantity);
            Alert.alert(
                t('common.success') || "Succès",
                `${quantity}x ${dish.name} ${t('dish.added_to_cart') || 'ajouté au panier !'}`,
                [{ text: "OK", onPress: () => router.back() }]
            );
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </SafeAreaView>
        );
    }

    if (!dish) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <Text style={{ color: colors.gray }}>{t('dish.not_found') || 'Plat non trouvé.'}</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.tint, marginTop: 10 }}>{t('common.back') || 'Retour'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: dish.image }} style={styles.image} />
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.name, { color: colors.text }]}>{dish.name}</Text>
                    <Text style={[styles.description, { color: colors.gray }]}>{dish.description}</Text>

                    <View style={styles.quantity}>
                        <Text style={[styles.price, { color: colors.tint }]}>{dish.price} €</Text>
                        <View style={styles.qtyControls}>
                            <TouchableOpacity
                                style={[styles.qtyButton, { backgroundColor: colors.tint }, quantity === 1 && { backgroundColor: colors.border }]}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity === 1}>
                                <Minus size={18} color={quantity === 1 ? colors.gray : "#fff"} />
                            </ TouchableOpacity>
                            <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
                            <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.tint }]} onPress={() => setQuantity(quantity + 1)}>
                                <Plus size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={handleAddToCart}>
                        <Text style={styles.addButtonText}>{t('dish.addToCart')}</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: -100,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imageWrapper: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 280,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 16,
        gap: 12
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    description: {
        color: '#666',
        lineHeight: 20,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FF6B35',
    },
    quantity: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 12,
        justifyContent: 'space-between',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    qtyButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyButtonDisabled: {
        opacity: 0.5,
    },
    qtyValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    addButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});