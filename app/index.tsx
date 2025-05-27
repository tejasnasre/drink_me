import { getUserData, initialUserData, storeUserData } from "@/utils/storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import WelcomeScreen from "./welcomescreen";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  // Missing error handling in storage operations
  const checkFirstTimeUser = async () => {
    try {
      const userData = await getUserData();

      if (!userData) {
        // First time user, store initial data
        await storeUserData(initialUserData);
        setIsLoading(false);
      } else if (userData.isFirstTime) {
        // User has data but hasn't completed onboarding
        setIsLoading(false);
      } else {
        // Returning user, redirect to home
        router.push("home" as any);
        // Or use router.push({pathname: "home"});
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#e6f4ff]">
        <ActivityIndicator size="large" color="#68c6ff" />
      </View>
    );
  }

  return <WelcomeScreen />;
}
