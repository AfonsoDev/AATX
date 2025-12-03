// app/inbox.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "./styles/Colors";
import { useUser } from "./UserContext";
import axios from "axios";
import { API_URL } from "./config";
import { socket } from "./socket";
import * as Clipboard from "expo-clipboard";

import FuturisticBackground from "../components/FuturisticBackground";
import GlassInput from "../components/GlassInput";
import NeonButton from "../components/NeonButton";
import GlassCard from "../components/GlassCard";

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
    Alert.alert(
      "Sucesso",
      "Seu UUID foi copiado para a área de transferência!",
    );
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
      <FuturisticBackground
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </FuturisticBackground>
    );
  }

  return (
    <FuturisticBackground style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INBOX</Text>
          <TouchableOpacity onPress={copyToClipboard}>
            <Text style={styles.subtitle}>
              {user?.name} <Text style={styles.uuidHint}>(Copiar UUID)</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            logout();
            router.replace("/login");
          }}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      {showNewChat ? (
        <GlassCard style={styles.newChatContainer}>
          <Text style={styles.sectionTitle}>NOVO CHAT</Text>
          <GlassInput
            placeholder="UUID do usuário"
            value={otherUserUuid}
            onChangeText={setOtherUserUuid}
            autoCapitalize="none"
          />
          <View style={styles.buttonRow}>
            <NeonButton
              title="CRIAR"
              onPress={createNewChat}
              style={{ flex: 1, marginRight: 10 }}
            />
            <NeonButton
              title="CANCELAR"
              secondary
              onPress={() => {
                setShowNewChat(false);
                setOtherUserUuid("");
              }}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </View>
        </GlassCard>
      ) : (
        <NeonButton
          title="+ NOVO CHAT"
          secondary
          onPress={() => setShowNewChat(true)}
          style={styles.newChatButton}
        />
      )}

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma mensagem detectada.</Text>
          <Text style={styles.emptySubText}>Inicie uma nova conexão.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chat_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <GlassCard
              onPress={() =>
                router.push(
                  `/chat/${item.chat_id}?otherUserUuid=${getChatPartnerUuid(item)}`,
                )
              }
            >
              <View style={styles.chatRow}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getChatPartnerName(item).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.itemText}>
                    {getChatPartnerName(item)}
                  </Text>
                  {item.last_message && (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.last_message}
                    </Text>
                  )}
                </View>
              </View>
            </GlassCard>
          )}
        />
      )}
    </FuturisticBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    color: Colors.primary,
    fontWeight: "bold",
    letterSpacing: 2,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 5,
    fontWeight: "600",
  },
  uuidHint: {
    color: Colors.textDim,
    fontSize: 12,
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  newChatContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    marginBottom: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  newChatButton: {
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  itemText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lastMessage: {
    color: Colors.textDim,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  emptySubText: {
    color: Colors.textDim,
    fontSize: 14,
  },
});
