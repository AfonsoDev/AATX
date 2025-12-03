// app/_layout.js
import { Stack } from "expo-router";
import { UserProvider } from "./UserContext";

export default function Layout() {
  return (
    <UserProvider>
      <Stack
        initialRouteName="login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' }, // Important for the background to show through if needed
          animation: 'fade', // Smoother transitions for futuristic feel
        }}
      />
    </UserProvider>
  );
}
