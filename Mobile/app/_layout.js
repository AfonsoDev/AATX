// app/_layout.js
import { Stack } from "expo-router";
import { UserProvider } from "./UserContext";

export default function Layout() {
  return (
    <UserProvider>
      <Stack
        initialRouteName="login"
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a0f" },
          headerTintColor: "#ff00ff",
        }}
      />
    </UserProvider>
  );
}
