// login.js
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";

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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="UUID"
        placeholderTextColor="#888"
        style={styles.input}
        value={uuid}
        onChangeText={setUUID}
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        placeholder="Senha"
        placeholderTextColor="#888"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} />
      ) : (
        <Button title="Login" color={Colors.accent} onPress={handleLogin} />
      )}
      <Text style={styles.link} onPress={() => router.push("/register")}>
        Não tem uma conta? Registre-se
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: Colors.primary,
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111",
    color: Colors.text,
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  link: {
    color: Colors.secondary,
    marginTop: 15,
    textAlign: "center",
  },
});
