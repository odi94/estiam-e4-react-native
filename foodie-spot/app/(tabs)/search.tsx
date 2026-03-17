import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { RestaurantCard } from "@/components/restaurant-card";
import { restaurantAPI } from "@/services/api";
import { Restaurant, SearchFilters } from "@/types";
import { Filter, Search, Clock, X, TrendingUp } from "lucide-react-native";
import { useDebounce } from "@/hooks/use-debounce";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/contexts/theme-context";
import { storage, STORAGE_KEYS } from "@/services/storage";

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const debouncedQuery = useDebounce(query, 500);
    const { t } = useI18n();
    const { colors } = useTheme();
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const loadRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            if (debouncedQuery) {
                const data = await restaurantAPI.searchRestaurants(debouncedQuery);
                setRestaurants(data);
            } else {
                const data = await restaurantAPI.getRestaurants(filters);
                setRestaurants(data);
            }
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters]);

    const loadRecentSearches = async () => {
        const saved = await storage.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES);
        if (saved) setRecentSearches(saved);
    };

    const saveRecentSearch = useCallback(async (term: string) => {
        setRecentSearches(prev => {
            const trimmed = term.trim();
            if (!trimmed) return prev;
            const filtered = prev.filter(s => s !== trimmed);
            const updated = [trimmed, ...filtered].slice(0, 5);
            storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
            return updated;
        });
    }, []);

    const removeRecentSearch = async (term: string) => {
        const updated = recentSearches.filter(s => s !== term);
        setRecentSearches(updated);
        await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    };

    const [suggestions, setSuggestions] = useState<string[]>([]);

    const loadCategories = async () => {
        try {
            // Tentative de récupération des catégories depuis l'API (si implémentée)
            // Sinon on garde le fallback intelligent
            const dataBuffer = await restaurantAPI.getRestaurants();
            const rawCats = Array.from(new Set(dataBuffer.flatMap((r) => r.cuisine)));
            const finalCats = rawCats.length > 0 ? ['Tous', ...rawCats] : ['Tous', 'Burger', 'Pizza', 'Sushi', 'Healthy', 'Desserts'];
            setCategories(finalCats);
        } catch {
            setCategories(['Tous', 'Burger', 'Pizza', 'Sushi', 'Healthy', 'Desserts']);
        }
    };

    const loadSuggestions = async () => {
        try {
            // Integration avec les nouveaux endpoints du backend
            const response = await restaurantAPI.getSearchSuggestions();
            setSuggestions(response);
        } catch {
            setSuggestions(['Burger', 'Sushi', 'Pizza', 'Salade', 'Healthy']);
        }
    };

    useEffect(() => {
        loadCategories();
        loadRecentSearches();
        loadSuggestions();
    }, []);

    useEffect(() => {
        loadRestaurants();
        if (debouncedQuery && debouncedQuery.length > 2) {
            saveRecentSearch(debouncedQuery);
        }
    }, [debouncedQuery, loadRestaurants, saveRecentSearch]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.lightGray }]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}>
                    <Search size={20} color={colors.gray} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder={t('search.placeholder')}
                        placeholderTextColor={colors.gray}
                        value={query}
                        onChangeText={setQuery}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <X size={18} color={colors.gray} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
                    <Filter size={24} color={showFilters ? colors.tint : colors.text} />
                </TouchableOpacity>
            </View>

            {
                showFilters && (
                    <View style={styles.filters}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {categories.map((cuisine: string) => (
                                <TouchableOpacity key={cuisine} style={[styles.filterChip, filters.cuisine === cuisine && styles.filterChipActive, { backgroundColor: filters.cuisine === cuisine ? colors.tint : colors.lightGray }]}
                                    onPress={() => setFilters({ ...filters, cuisine: filters.cuisine === cuisine ? undefined : cuisine })}>
                                    <Text style={[styles.filterChipText, filters.cuisine === cuisine && styles.filterChipTextActive, { color: filters.cuisine === cuisine ? '#fff' : colors.gray }]}>{cuisine}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )
            }

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : query === '' ? (
                <View style={styles.content}>
                    {recentSearches.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recherches récentes</Text>
                            {recentSearches.map((term) => (
                                <View key={term} style={styles.recentItem}>
                                    <TouchableOpacity 
                                        style={styles.recentItemTextContainer} 
                                        onPress={() => setQuery(term)}
                                    >
                                        <Clock size={16} color={colors.gray} />
                                        <Text style={[styles.recentText, { color: colors.text }]}>{term}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeRecentSearch(term)}>
                                        <X size={16} color={colors.gray} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={[styles.section, { marginTop: 24 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggestions</Text>
                        <View style={styles.suggestionsGrid}>
                            {suggestions.map((cat) => (
                                <TouchableOpacity 
                                    key={cat} 
                                    style={[styles.suggestionChip, { backgroundColor: colors.lightGray }]}
                                    onPress={() => setQuery(cat)}
                                >
                                    <TrendingUp size={14} color={colors.tint} />
                                    <Text style={[styles.suggestionText, { color: colors.text }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            ) : (
                <FlatList
                    style={styles.content}
                    data={restaurants}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <RestaurantCard restaurant={item} onPress={() => router.push(`/restaurant/${item.id}`)} />
                    )}
                    ListHeaderComponent={
                        <Text style={[styles.resultsText, { color: colors.gray }]}>
                            {restaurants.length} {t('search.results')}
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: colors.gray }]}>{t('search.empty')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        padding: 8,
    },
    filters: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#FF6B35',
    },
    filterChipText: {
        fontSize: 14,
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    recentItemTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    recentText: {
        fontSize: 16,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    resultsText: {
        fontSize: 14,
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
    }
});
