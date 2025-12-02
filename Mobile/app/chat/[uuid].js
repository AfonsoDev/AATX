// app/chat/[uuid].js
import React, { useState, useEffect, useCallback } from "react";
import { GiftedChat, Bubble } from "react-native-gifted-chat";
import { useRouter, useLocalSearchParams } from "expo-router";
import { socket } from "./../socket";
import { useUser } from "./../UserContext";
import axios from "axios";
import { API_URL } from "./../config";
import { View, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Colors } from "./../styles/Colors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const { uuid, otherUserUuid } = useLocalSearchParams(); // chat_id and other user UUID
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  // Logged-in user for GiftedChat
  const loggedUser = {
    _id: user?.uuid || "unknown",
    name: user?.name || "Você",
  };

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!uuid) return;

    // Fetch message history
    fetchMessages();

    // Join the chat room via socket
    socket.emit("join_chat", uuid);

    // Listen for new messages
    socket.on("chatMessage", handleIncomingMessage);

    return () => {
      socket.off("chatMessage", handleIncomingMessage);
    };
  }, [uuid, user]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/${uuid}`);
      const dbMessages = response.data;

      // Convert database messages to GiftedChat format
      const formattedMessages = dbMessages.map((msg) => ({
        _id: msg.id,
        text: msg.text,
        createdAt: new Date(msg.created_at),
        user: {
          _id: msg.from_uuid,
          name: msg.sender_name || msg.from_uuid,
        },
      }));

      // GiftedChat expects messages in reverse chronological order
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomingMessage = (message) => {
    const msgWithId = {
      _id: message._id || Date.now() + Math.random(),
      text: message.text,
      createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
      user: message.user,
    };

    setMessages((prev) => GiftedChat.append(prev, [msgWithId]));
  };

  const onSend = useCallback(
    (msgs = []) => {
      const message = msgs[0];
      if (!uuid || !user) return;

      const msgToSend = {
        chat_id: uuid,
        from_uuid: user.uuid,
        to_uuid: otherUserUuid,
        text: message.text,
        user: loggedUser,
      };

      // Send to server via socket
      socket.emit("chatMessage", msgToSend);

      // GiftedChat already adds the message locally when onSend is called,
      // so we don't need to manually add it here
    },
    [uuid, user, otherUserUuid]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={loggedUser}
          showUserAvatar
          renderUsernameOnMessage
          alwaysShowSend
          renderAvatar={null}
          bottomOffset={Platform.OS === 'ios' ? 0 : 20}
          minInputToolbarHeight={60}
          textInputStyle={{
            backgroundColor: '#111',
            color: Colors.text,
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingTop: 10,
            paddingBottom: 10,
          }}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  backgroundColor: Colors.accent,
                },
                left: {
                  backgroundColor: '#333',
                },
              }}
              textStyle={{
                right: {
                  color: Colors.text,
                },
                left: {
                  color: Colors.text,
                },
              }}
            />
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
