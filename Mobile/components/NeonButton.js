import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../app/styles/Colors';

export default function NeonButton({ title, onPress, loading, secondary, style }) {
    const gradientColors = secondary ? Colors.gradients.buttonSecondary : Colors.gradients.button;
    const shadowColor = secondary ? Colors.primary : Colors.secondary;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            style={[styles.container, style]}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, { shadowColor }]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.text}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginVertical: 10,
        overflow: 'visible', // Allow shadow to show
    },
    gradient: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // Neon Glow Effect
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
