import { useUser } from "@/context/UserContext";
import {
  registerForPushNotificationsAsync,
  scheduleHydrationReminders,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";

const FinishOnBoarding = () => {
  const { userData, completeOnboarding } = useUser();

  const fillAnimation = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.85)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Format daily goal to display
  const dailyGoal = userData.dailyWaterGoal
    ? userData.weightUnit === "kg"
      ? `${userData.dailyWaterGoal.liters}L`
      : `${userData.dailyWaterGoal.oz} oz`
    : "2.4L";

  useEffect(() => {
    // Calculate water goal based on user data
    completeOnboarding();

    // Start animations on mount
    const timer = setTimeout(() => {
      // Card animation
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Bottle fill animation
      Animated.timing(fillAnimation, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      }).start();

      // Ripple effect
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rippleScale, {
              toValue: 1.07,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(rippleScale, {
              toValue: 0.95,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 800);

      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Button press animation
  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleStartHydrating = async () => {
    try {
      // Request notification permissions and set up reminders
      await registerForPushNotificationsAsync();

      // Schedule hydration reminders based on user's wake and sleep times
      await scheduleHydrationReminders(userData);

      // Navigate to home screen
      router.push("home" as any);
      // Or use router.push({pathname: "home"});
    } catch (error) {
      console.error("Error setting up notifications:", error);
      // Even if notification setup fails, we still move to the home screen
      router.push("home" as any);
    }
  };

  const WaterBottle = () => {
    const fillHeight = fillAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 126], // 74% of 170px
    });

    return (
      <View className="relative w-[140px] h-[250px] flex justify-end items-center">
        {/* Shadow under bottle */}
        <View className="absolute -bottom-4 w-[80px] h-8 rounded-full bg-sky-200/30 blur-md z-0"></View>

        {/* Bottle outline */}
        <View className="absolute left-0 top-0 w-full h-full flex justify-center items-end z-10">
          <Svg width="140" height="250" viewBox="0 0 140 250">
            <Rect x="43" y="12" width="54" height="18" rx="9" fill="#e1f1ff" />
            <Rect
              x="30"
              y="30"
              width="80"
              height="170"
              rx="40"
              fill="none"
              stroke="#cce6fd"
              strokeWidth="4"
            />
            <Rect x="42" y="200" width="56" height="18" rx="9" fill="#cce6fd" />

            {/* Glass reflection */}
            <Path
              d="M95 60 Q105 100, 95 140"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
              opacity="0.8"
            />
            <Path
              d="M50 70 Q45 100, 50 130"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
          </Svg>
        </View>

        {/* Water fill container */}
        <View className="absolute left-[30px] top-[30px] w-[80px] h-[170px] rounded-b-[40px] overflow-hidden flex items-end z-20">
          <Animated.View
            style={{ height: fillHeight }}
            className="w-full rounded-b-[40px]"
          >
            <LinearGradient
              colors={["#5fb6fa", "#94d5fa", "#d1ebff"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              className="w-full h-full rounded-b-[40px]"
              style={{
                shadowColor: "#93c5fd",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
          </Animated.View>
        </View>

        {/* Sparkles */}
        <Animated.View
          className="absolute right-[-5px] top-[80px] z-30"
          style={{ opacity: sparkleOpacity, transform: [{ rotate: "10deg" }] }}
        >
          <Ionicons name="sparkles" size={20} color="#ffdc58" />
        </Animated.View>

        <Animated.View
          className="absolute left-0 top-[120px] z-30"
          style={{ opacity: sparkleOpacity }}
        >
          <Ionicons name="water" size={16} color="#94d3e9" />
        </Animated.View>

        {/* Ripple Effect */}
        <Animated.View
          className="absolute left-1/2 bottom-[60px] z-30 w-[70px] h-[30px] opacity-70"
          style={{
            transform: [{ translateX: -35 }, { scale: rippleScale }],
          }}
        >
          <Svg width="70" height="30" viewBox="0 0 70 30">
            <Ellipse
              cx="35"
              cy="15"
              rx="32"
              ry="8"
              fill="#b7e3f7"
              fillOpacity="0.45"
            />
            <Ellipse
              cx="35"
              cy="15"
              rx="19"
              ry="5"
              fill="#a2dafc"
              fillOpacity="0.40"
            />
            <Ellipse
              cx="35"
              cy="15"
              rx="12"
              ry="3.5"
              fill="#80cef7"
              fillOpacity="0.4"
            />
          </Svg>
        </Animated.View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#e6f4ff", "#f8fbff", "#e0eefe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1 items-center px-5 pt-10 pb-4"
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Bottle Animation Section */}
      <View className="w-full flex-col items-center mt-6 mb-8">
        <WaterBottle />
      </View>

      {/* Hydration Plan Card */}
      <Animated.View
        className="w-full rounded-3xl px-6 py-7 flex-col items-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          shadowColor: "#93c5fd",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.12,
          shadowRadius: 25,
          elevation: 10,
          transform: [{ scale: cardScale }],
        }}
      >
        <View className="w-full flex-col items-center">
          {/* Success Badge */}
          <View
            className="rounded-full px-4 py-1.5 mb-4"
            style={{
              backgroundColor: "rgba(115, 193, 247, 0.18)",
            }}
          >
            <Text className="text-sky-600 text-xs font-semibold tracking-wide">
              Hooray! You're all set 🎉
            </Text>
          </View>

          {/* Title */}
          <Text
            className="text-3xl font-bold text-[#2b425b] tracking-tight mb-2 text-center"
            style={{ fontFamily: "System" }}
          >
            Meet Your Hydration Plan
          </Text>

          {/* Description */}
          <Text className="text-base text-[#5d7e9b] font-medium mb-6 text-center leading-relaxed max-w-[300px]">
            Based on your info, we've crafted the perfect daily water goal for
            you. Stay refreshed and feel your best!
          </Text>
        </View>

        {/* Daily Target Section */}
        <View className="w-full flex-col items-center my-2">
          <LinearGradient
            colors={["#e0f7fa", "#e8f6ff", "#bae6fd"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center gap-4 px-7 py-5 rounded-full w-full border border-[#dbeafe]"
            style={{
              shadowColor: "#93c5fd",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <View className="bg-white/90 rounded-full p-3.5 border border-[#e0f2fe] shadow-sm">
              <Ionicons name="water" size={34} color="#38bdf8" />
            </View>
            <View className="flex-col pl-1.5">
              <Text
                className="text-[2.2rem] text-[#158eea] font-extrabold leading-none tracking-tight drop-shadow-sm"
                style={{ fontFamily: "System" }}
              >
                {dailyGoal}
              </Text>
              <Text className="text-xs text-[#38bdf8] font-semibold uppercase tracking-wider mt-1">
                PER DAY
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Start Button */}
        <Animated.View
          className="mt-6 w-full"
          style={{ transform: [{ scale: buttonScale }] }}
        >
          <TouchableOpacity
            className="w-full rounded-full overflow-hidden"
            activeOpacity={0.9}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handleStartHydrating}
          >
            <LinearGradient
              colors={["#65baf6", "#4ac3f8", "#38d9f9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full py-4 rounded-full items-center justify-center"
              style={{
                shadowColor: "#0ea5e9",
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Text className="text-xl font-bold text-white tracking-wide">
                Start Hydrating
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Motivation Text */}
        <View className="w-full flex-col items-center mt-6">
          <Text className="text-sm text-[#88aac0] font-medium text-center">
            Stay motivated! We'll remind you to keep sipping throughout the day
            💧
          </Text>
        </View>
      </Animated.View>

      {/* Footer Celebration */}
      <View className="mt-auto w-full flex-col items-center py-5">
        <Ionicons name="sunny" size={24} color="#7dd3fc" />
        <Text className="text-xs text-[#90b8dd] font-semibold tracking-wide mt-1">
          Your hydration journey begins now!
        </Text>
      </View>
    </LinearGradient>
  );
};

export default FinishOnBoarding;
