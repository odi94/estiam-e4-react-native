import { useEffect, useState, useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Platform, Share, ActivityIndicator } from "react-native";
import { Dish, Restaurant } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { restaurantAPI, userAPI } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Phone, Share2, Star, ShoppingCart } from "lucide-react-native";
import { DishCard } from "@/components/dish-card";
import { useCart } from "@/contexts/cart-context";
import log from "@/services/logger";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/contexts/theme-context";

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu] = useState<Dish[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();
    const { totalItems } = useCart();

    const loadRestaurant = useCallback(async () => {
        setLoading(true);
        try {
            const restaurantData = await restaurantAPI.getRestaurantById(id);
            const menuData = await restaurantAPI.getMenu(id);
            setRestaurant(restaurantData);
            setMenu(menuData);
            setIsFavorite(restaurantData?.isFavorite || false);
        } catch (error) {
            log.error("Erreur chargement restaurant", error);
            Alert.alert(t('common.error') || "Erreur", t('restaurant.error_loading') || "Impossible de charger les détails du restaurant.");
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

    useEffect(() => {
        loadRestaurant();
    }, [loadRestaurant]);

    const handleToggleFavorite = async () => {
        try {
            await userAPI.toggleFavorite(id);
            setIsFavorite(!isFavorite);
        } catch {
            Alert.alert("Error", "Failed to update favorite status");
        }
    };

    const handleShare = async () => {
        if (!restaurant) return;
        try {
            await Share.share({
                message: `${t('restaurant.share_msg') || 'Regarde ce restaurant sur FoodieSpot'}: ${restaurant.name}\n${restaurant.cuisine.join(', ')}\nNote: ${restaurant.rating}⭐`,
                url: `foodiespot://restaurant/${id}`,
            });
        } catch (error) {
            log.error('Erreur partage', error);
        }
    };

    const handleCall = () => {
        if (!restaurant?.phone) {
            Alert.alert(t('common.unavailable') || "Indisponible", t('restaurant.no_phone') || "Ce restaurant n'a pas de numéro de téléphone.");
            return;
        }
        Linking.openURL(`tel:${restaurant.phone}`);
    };

    const handleMap = () => {
        if (!restaurant) return;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${restaurant.latitude},${restaurant.longitude}`;
        const label = restaurant.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        if (url) Linking.openURL(url);
    };

    if (loading || !restaurant) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.gray }]}>{t('restaurant.loading')}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: restaurant.image }} style={styles.image} />
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={handleToggleFavorite}>
                            <Heart size={24} color={isFavorite ? colors.tint : colors.text} fill={isFavorite ? colors.tint : 'transparent'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={handleShare}>
                            <Share2 size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card }]} onPress={() => router.push('/cart')}>
                            <ShoppingCart size={18} color={colors.text} />
                            {totalItems > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{totalItems}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.info, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
                    <Text style={[styles.cuisine, { color: colors.gray }]}>{restaurant.cuisine.join(' • ')}</Text>
                    
                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={16} color="#FFC107" fill="#FFC107" />
                            <Text style={[styles.metaText, { color: colors.gray }]}>
                                {restaurant.rating.toFixed(1)} ({restaurant.reviewCount})
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color={colors.gray}/>
                            <Text style={[styles.metaText, { color: colors.gray }]}>
                                {typeof restaurant.deliveryTime === 'object' 
                                    ? `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max}` 
                                    : restaurant.deliveryTime} {t('restaurant.deliveryTime')}
                            </Text>
                        </View>
                         {restaurant.distance !== undefined && (
                            <View style={styles.metaItem}>
                                <MapPin size={16} color={colors.gray}/>
                                <Text style={[styles.metaText, { color: colors.gray }]}>
                                    {restaurant.distance} km
                                </Text>
                            </View>
                         )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.tint }]} onPress={handleMap}>
                            <Navigation size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>{t('restaurant.directions')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.lightGray }]} onPress={handleCall}>
                            <Phone size={18} color={colors.gray} />
                            <Text style={[styles.secondaryButtonText, { color: colors.gray }]}>{t('restaurant.call')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'menu' && styles.activeTab, { borderBottomColor: activeTab === 'menu' ? colors.tint : 'transparent' }]} 
                        onPress={() => setActiveTab('menu')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'menu' ? colors.tint : colors.gray }, activeTab === 'menu' && styles.activeTabText]}>{t('restaurant.menu') || 'Menu'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'reviews' && styles.activeTab, { borderBottomColor: activeTab === 'reviews' ? colors.tint : 'transparent' }]} 
                        onPress={() => setActiveTab('reviews')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'reviews' ? colors.tint : colors.gray }, activeTab === 'reviews' && styles.activeTabText]}>{t('restaurant.reviews') || 'Avis'} ({restaurant.reviewCount})</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'menu' ? (
                    <View style={styles.menu}>
                        {menu.map((dish) => (
                            <DishCard key={dish.id} dish={dish} onPress={() => router.push(`/dish/${dish.id}`)} />  
                        ))}  
                    </View>
                ) : (
                    <View style={[styles.reviews, { backgroundColor: colors.background }]}>
                        <View style={[styles.ratingOverview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.ratingNumberContainer}>
                                <Text style={[styles.ratingNumber, { color: colors.text }]}>{restaurant.rating.toFixed(1)}</Text>
                                <View style={styles.starRow}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={16} color={s <= Math.round(restaurant.rating) ? "#FFC107" : colors.lightGray} fill={s <= Math.round(restaurant.rating) ? "#FFC107" : "transparent"} />
                                    ))}
                                </View>
                            </View>
                            <View style={styles.ratingBars}>
                                <Text style={[styles.criteriaLabel, { color: colors.text }]}>Qualité: <Text style={{ color: colors.tint }}>{((restaurant as any).recentReviews?.[0]?.qualityRating || 4.5).toFixed(1)}</Text></Text>
                                <Text style={[styles.criteriaLabel, { color: colors.text }]}>Rapidité: <Text style={{ color: colors.tint }}>{((restaurant as any).recentReviews?.[0]?.speedRating || 4.2).toFixed(1)}</Text></Text>
                                <Text style={[styles.criteriaLabel, { color: colors.text }]}>Service: <Text style={{ color: colors.tint }}>{((restaurant as any).recentReviews?.[0]?.presentationRating || 4.3).toFixed(1)}</Text></Text>
                            </View>
                        </View>

                        {(restaurant as any).recentReviews?.length > 0 ? (
                            (restaurant as any).recentReviews.map((review: any) => (
                                <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={[styles.reviewUser, { color: colors.text }]}>{review.userName}</Text>
                                        <View style={[styles.reviewStars, { backgroundColor: colors.tint + '15' }]}>
                                            <Star size={12} color={colors.tint} fill={colors.tint} />
                                            <Text style={[styles.reviewRatingText, { color: colors.tint }]}>{review.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.reviewDate, { color: colors.gray }]}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                    <Text style={[styles.reviewComment, { color: colors.text }]}>{review.comment}</Text>
                                    {review.images && review.images.length > 0 && (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
                                            {review.images.map((img: string, idx: number) => (
                                                <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: colors.gray, textAlign: 'center', marginTop: 20 }}>{t('restaurant.no_reviews')}</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: -50,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%'
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    headerActions: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        marginTop: 34,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: 16,
        borderBottomWidth: 1,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cuisine: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    meta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        padding: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        padding: 12,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    menu: {
        padding: 16,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF6B35',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    tab: {
        marginRight: 24,
        paddingVertical: 12,
        borderBottomWidth: 2,
    },
    activeTab: {},
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        fontWeight: '700',
    },
    reviews: {
        padding: 16,
    },
    ratingOverview: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    ratingNumberContainer: {
        alignItems: 'center',
        marginRight: 32,
    },
    ratingNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    starRow: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingBars: {
        flex: 1,
        gap: 4,
    },
    criteriaLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    reviewCard: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reviewUser: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewStars: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    reviewRatingText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    reviewDate: {
        fontSize: 12,
        marginBottom: 8,
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    reviewImages: {
        flexDirection: 'row',
    },
    reviewImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 8,
    },
});
