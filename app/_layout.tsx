import { UserProvider } from "@/context/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "./global.css";

export default function RootLayout() {
  return (
    <UserProvider>
      <StatusBar hidden={false} />

      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="welcomescreen"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboardingscreen"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="finishonboarding"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="setting"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </UserProvider>
  );
}
