import BedtimeScreen from "@/components/onboarding/bedtimescreen";
import GenderScreen from "@/components/onboarding/genderscreen";
import WakeupScreen from "@/components/onboarding/wakeuptimescreen";
import WeightScreen from "@/components/onboarding/weigthinputscreen";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

// Progress Bar Component
type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  return (
    <View className="pt-6 pb-3 flex justify-center">
      <View className="flex-row justify-between w-4/5 mx-auto">
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            className={`h-2.5 rounded-full w-[22%] ${
              index < currentStep ? "bg-[#68c6ff]" : "bg-[#b8e5ff]"
            }`}
          />
        ))}
      </View>
    </View>
  );
};

// Main Onboarding Component
export default function OnboardingSteps() {
  const [currentStep, setCurrentStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const nextStep = () => {
    if (currentStep < 4) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Handle completion - navigate to finish screen
      router.push("/finishonboarding");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <GenderScreen onNext={nextStep} />;
      case 2:
        return <WeightScreen onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <WakeupScreen onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <BedtimeScreen onNext={nextStep} onBack={prevStep} />;
      default:
        return <GenderScreen onNext={nextStep} />;
    }
  };

  return (
    <LinearGradient
      colors={["#e3f0ff", "#f9fdff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1 pt-20"
    >
      <ProgressBar currentStep={currentStep} totalSteps={4} />

      <Animated.View
        className="flex-1"
        style={{
          transform: [{ translateX: slideAnim }],
        }}
      >
        {renderCurrentStep()}
      </Animated.View>
    </LinearGradient>
  );
}
