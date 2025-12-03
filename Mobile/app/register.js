// app/register.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";
import FuturisticBackground from "../components/FuturisticBackground";
import GlassInput from "../components/GlassInput";
import NeonButton from "../components/NeonButton";

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useUser();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        phone,
        password,
      });

      const { uuid, name: userName } = response.data;

      // Save user to context and storage
      await login({ uuid, name: userName });

      // Show UUID to user (they need it to login)
      Alert.alert(
        "Registro Bem-sucedido!",
        `Seu UUID é: ${uuid}\n\nGuarde-o com cuidado, você precisará dele para fazer login!`,
        [{ text: "OK", onPress: () => router.replace("/inbox") }]
      );
    } catch (error) {
      console.error("Erro no registro:", error);
      const errorMessage = error.response?.data?.error || "Erro ao registrar usuário";
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FuturisticBackground style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NOVA CONTA</Text>
        <Text style={styles.subtitle}>JUNTE-SE AO FUTURO</Text>

        <View style={styles.form}>
          <GlassInput
            placeholder="Nome"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
          <GlassInput
            placeholder="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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
            title="REGISTRAR"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.link} onPress={() => router.push("/login")}>
            Já tem uma conta? <Text style={styles.linkHighlight}>Faça login</Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    color: Colors.secondary,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 40,
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
