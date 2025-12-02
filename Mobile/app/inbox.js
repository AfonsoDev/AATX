// app/inbox.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";
import { socket } from "./socket";

import * as Clipboard from 'expo-clipboard';

export default function InboxScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [otherUserUuid, setOtherUserUuid] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchChats();

    // Listen for new messages to refresh inbox
    socket.on("newMessage", () => {
      console.log("New message received, refreshing inbox");
      fetchChats();
    });

    return () => {
      socket.off("newMessage");
    };
  }, [user]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/user-chats/${user.uuid}`);
      setChats(response.data);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
      Alert.alert("Erro", "Não foi possível carregar os chats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, []);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(user.uuid);
    Alert.alert("Sucesso", "Seu UUID foi copiado para a área de transferência!");
  };

  const createNewChat = async () => {
    if (!otherUserUuid.trim()) {
      Alert.alert("Erro", "Por favor, insira o UUID do outro usuário");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/create-chat`, {
        user1_uuid: user.uuid,
        user2_uuid: otherUserUuid.trim(),
      });

      const { chat_id } = response.data;
      setShowNewChat(false);
      setOtherUserUuid("");
      fetchChats();
      router.push(`/chat/${chat_id}?otherUserUuid=${otherUserUuid.trim()}`);
    } catch (error) {
      console.error("Erro ao criar chat:", error);
      Alert.alert("Erro", "Não foi possível criar o chat");
    }
  };

  const getChatPartnerName = (chat) => {
    if (chat.user1_uuid === user.uuid) {
      return chat.user2_name || chat.user2_uuid;
    } else {
      return chat.user1_name || chat.user1_uuid;
    }
  };

  const getChatPartnerUuid = (chat) => {
    return chat.user1_uuid === user.uuid ? chat.user2_uuid : chat.user1_uuid;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inbox - {user?.name}</Text>
          <TouchableOpacity onPress={copyToClipboard}>
            <Text style={styles.subtitle}>Toque para copiar seu UUID</Text>
          </TouchableOpacity>
        </View>
        <Button title="Sair" color={Colors.accent} onPress={() => {
          logout();
          router.replace("/login");
        }} />
      </View>

      {showNewChat ? (
        <View style={styles.newChatContainer}>
          <TextInput
            placeholder="UUID do outro usuário"
            placeholderTextColor="#888"
            style={styles.input}
            value={otherUserUuid}
            onChangeText={setOtherUserUuid}
            autoCapitalize="none"
          />
          <View style={styles.buttonRow}>
            <Button title="Criar Chat" color={Colors.accent} onPress={createNewChat} />
            <Button title="Cancelar" color="#666" onPress={() => {
              setShowNewChat(false);
              setOtherUserUuid("");
            }} />
          </View>
        </View>
      ) : (
        <Button title="+ Novo Chat" color={Colors.secondary} onPress={() => setShowNewChat(true)} />
      )}

      {chats.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum chat ainda. Crie um novo chat!</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chat_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/chat/${item.chat_id}?otherUserUuid=${getChatPartnerUuid(item)}`)
              }
              style={styles.item}
            >
              <Text style={styles.itemText}>{getChatPartnerName(item)}</Text>
              <Text style={styles.itemUuid}>{getChatPartnerUuid(item)}</Text>
              {item.last_message && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  newChatContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#111",
    borderRadius: 8,
  },
  input: {
    backgroundColor: "#222",
    color: Colors.text,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  item: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#111",
    borderRadius: 8,
  },
  itemText: { color: Colors.secondary, fontSize: 18, marginBottom: 5 },
  itemUuid: { color: "#888", fontSize: 12 },
  lastMessage: { color: "#aaa", fontSize: 14, marginTop: 5, fontStyle: "italic" },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
});
