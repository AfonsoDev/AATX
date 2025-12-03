// login.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";
import FuturisticBackground from "../components/FuturisticBackground";
import GlassInput from "../components/GlassInput";
import NeonButton from "../components/NeonButton";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useUser();
  const [uuid, setUUID] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!uuid || !password) {
      Alert.alert("Erro", "Por favor, preencha UUID e senha");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        uuid,
        password,
      });

      const { uuid: userUuid, name } = response.data;

      // Save user to context and storage
      await login({ uuid: userUuid, name });

      // Navigate to inbox
      router.replace("/inbox");
    } catch (error) {
      console.error("Erro no login:", error);
      const errorMessage = error.response?.data?.error || "Erro ao fazer login";
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FuturisticBackground style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AATX</Text>
        <Text style={styles.subtitle}>FUTURE MESSAGING</Text>

        <View style={styles.form}>
          <GlassInput
            placeholder="UUID"
            value={uuid}
            onChangeText={setUUID}
            autoCapitalize="none"
            editable={!loading}
          />
          <GlassInput
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <NeonButton
            title="ENTRAR"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.link} onPress={() => router.push("/register")}>
            Não tem uma conta? <Text style={styles.linkHighlight}>Registre-se</Text>
          </Text>
        </View>
      </View>
    </FuturisticBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: Colors.primary,
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: "center",
    letterSpacing: 4,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: Colors.secondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 50,
    letterSpacing: 2,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 10,
  },
  link: {
    color: Colors.textDim,
    marginTop: 25,
    textAlign: "center",
    fontSize: 14,
  },
  linkHighlight: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
