import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../app/styles/Colors';

export default function GlassCard({ children, onPress, style }) {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container onPress={onPress} style={[styles.container, style]} activeOpacity={0.7}>
            <BlurView intensity={30} tint="dark" style={styles.blur}>
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </Container>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.glass,
    },
    blur: {
        width: '100%',
    },
    content: {
        padding: 15,
    },
});
