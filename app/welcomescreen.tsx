import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add your navigation logic here
    router.push("/onboardingscreen");
  };

  return (
    <View className="flex-1">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <LinearGradient
        colors={["#e0f7fa", "#c3e7fd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <Animated.View
          className="flex-1 justify-between items-center px-6 pt-12 pb-8"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Branding Section */}
          <Animated.View
            className="w-full flex-col items-center mt-4"
            style={{ transform: [{ scale: scaleAnim }] }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="water" size={28} color="#63b3ed" />
              <Text
                className="text-4xl font-black text-[#3896d2]"
                style={{
                  fontFamily:
                    Platform.OS === "ios" ? "System" : "sans-serif-medium",
                  letterSpacing: 1.2,
                }}
              >
                Drink Me
              </Text>
            </View>
          </Animated.View>

          {/* Illustration Section */}
          <Animated.View
            className="w-full flex-col items-center flex-1 justify-center"
            style={{ transform: [{ scale: scaleAnim }] }}
          >
            <Image
              source={{
                uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/0ae3273c33-0235b16465db1765659d.png",
              }}
              className="w-44 h-44 rounded-full mb-6"
              resizeMode="contain"
            />

            {/* Text Content */}
            <View className="w-full flex-col items-center px-4">
              <Text
                className="text-2xl font-bold text-[#1c4876] mb-3 text-center"
                style={{
                  fontFamily:
                    Platform.OS === "ios" ? "System" : "sans-serif-medium",
                }}
              >
                Hydration made fun!
              </Text>
              <Text
                className="text-base text-[#3896d2] opacity-80 text-center max-w-xs leading-6"
                style={{
                  fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
                }}
              >
                Stay happy, healthy, and energized. Let's build your hydration
                habit together!
              </Text>
            </View>
          </Animated.View>

          {/* CTA Section */}
          <Animated.View
            className="w-full flex-col items-center"
            style={{ transform: [{ scale: buttonScale }] }}
          >
            <TouchableOpacity
              onPress={handleButtonPress}
              activeOpacity={0.9}
              className="w-full max-w-xs rounded-full"
              style={{ borderRadius: 9999, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#63b3ed", "#51d1f6", "#70e1f5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 rounded-full items-center justify-center"
                style={{
                  borderRadius: 9999,
                  shadowColor: "#63b3ed",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  overflow: "hidden",
                }}
              >
                <Text
                  className="text-white text-lg font-bold"
                  style={{
                    fontFamily:
                      Platform.OS === "ios" ? "System" : "sans-serif-medium",
                  }}
                >
                  Let's Go 💧
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
