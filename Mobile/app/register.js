// app/register.js
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";

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
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        placeholder="Nome"
        placeholderTextColor="#888"
        style={styles.input}
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <TextInput
        placeholder="Telefone"
        placeholderTextColor="#888"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
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
        <Button title="Register" color={Colors.accent} onPress={handleRegister} />
      )}
      <Text style={styles.link} onPress={() => router.push("/login")}>
        Já tem uma conta? Faça login
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
