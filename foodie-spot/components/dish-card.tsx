import { Dish } from "@/types";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/contexts/theme-context";

interface Props {
    dish: Dish;
    onPress?: () => void;
}

export const DishCard: React.FC<Props> = ({ dish, onPress }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: dish.image }} style={styles.image} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{dish.name}</Text>
                <Text style={[styles.description, { color: colors.gray }]} numberOfLines={2}>{dish.description}</Text>
                <Text style={[styles.price, { color: colors.tint }]}>{dish.price} €</Text>
            </View>
            <View style={[styles.addButton, { backgroundColor: colors.tint }]}>
                <Plus size={16} color="#fff" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    info: {
        flex: 1,
        gap: 6
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    description: {
        fontSize: 12,
        color: '#666',
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF6B35',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 12,
        marginRight: 12,
    },
    addButton: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: '#FF6B35',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    }
});