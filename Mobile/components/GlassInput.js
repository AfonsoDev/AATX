import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../app/styles/Colors';

export default function GlassInput({ style, ...props }) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                <TextInput
                    {...props}
                    style={[
                        styles.input,
                        isFocused && styles.inputFocused
                    ]}
                    placeholderTextColor={Colors.textDim}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        backgroundColor: Colors.glass,
    },
    blur: {
        width: '100%',
    },
    input: {
        padding: 15,
        color: Colors.text,
        fontSize: 16,
    },
    inputFocused: {
        // We can't easily animate border color on the container from here without more state lifting or re-structuring,
        // but we can change text color or add a subtle background change if needed.
        // For now, let's just ensure it's readable.
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});
