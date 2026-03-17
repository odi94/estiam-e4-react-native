import React from 'react';
import { Coffee, IceCream2, Pizza, Sandwich, UtensilsCrossed } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/hooks/use-i18n';

const categories = [
    { label: 'Burger', icon: <Sandwich size={18} color="#FF6B35" /> },
    { label: 'Pizza', icon: <Pizza size={18} color="#FF6B35" /> },
    { label: 'Sushi', icon: <UtensilsCrossed size={18} color="#FF6B35" /> },
    { label: 'Healthy', icon: <Coffee size={18} color="#FF6B35" /> },
    { label: 'Desserts', icon: <IceCream2 size={18} color="#FF6B35" /> },
];

export const CategoryList: React.FC = () => {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>{t('home.categories')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                    <TouchableOpacity key={category.label} style={[styles.chip, { backgroundColor: colors.tint + '15' }]}>
                        {React.cloneElement(category.icon as React.ReactElement, { color: colors.tint})}
                        <Text style={[styles.chipText, { color: colors.tint }]}>{category.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        marginRight: 12,
    },
    chipText: {
        color: '#FF6B35',
        fontWeight: '600',
    }
});