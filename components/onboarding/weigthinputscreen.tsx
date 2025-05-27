import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageCom from "../imagecom";

interface StepScreenProps {
  onNext?: () => void;
  onBack?: () => void;
}

const WeightScreen: React.FC<StepScreenProps> = ({ onNext, onBack }) => {
  const { userData, updateUserWeight } = useUser();
  const [weight, setWeight] = useState(userData.weight);
  const [unit, setUnit] = useState(userData.weightUnit);
  const [sliderValue, setSliderValue] = useState(userData.weight);

  const toggleUnit = async (newUnit: "kg" | "lbs") => {
    if (unit === newUnit) return;

    if (newUnit === "lbs") {
      const lbsValue = Math.round(weight * 2.20462);
      setWeight(lbsValue);
      setSliderValue(lbsValue);
      await updateUserWeight(lbsValue, newUnit);
    } else {
      const kgValue = Math.round(weight / 2.20462);
      setWeight(kgValue);
      setSliderValue(kgValue);
      await updateUserWeight(kgValue, newUnit);
    }
    setUnit(newUnit);
  };

  const handleWeightChange = async (newWeight: number) => {
    setWeight(newWeight);
    setSliderValue(newWeight);
    await updateUserWeight(newWeight, unit as "kg" | "lbs");
  };

  const minValue = unit === "kg" ? 30 : 66;
  const maxValue = unit === "kg" ? 200 : 440;

  return (
    <View className="flex-1 px-4">
      <ImageCom imageurl="https://storage.googleapis.com/uxpilot-auth.appspot.com/283adc6d36-79d902bfcafe070d1fc6.png" />
      <View className="text-center mb-6">
        <Text
          className="text-[1.7rem] font-bold text-[#2b374b] text-center mb-1"
          style={{
            fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
          }}
        >
          What's your weight?
        </Text>
        <Text className="text-base text-[#6fa9d1] font-medium text-center">
          We'll personalize your daily water goal.
        </Text>
      </View>

      <View className="flex-col items-center w-full mb-8">
        {/* Unit Toggle */}
        <View className="flex-row items-center justify-center mb-6 space-x-4 gap-4">
          <TouchableOpacity
            onPress={() => toggleUnit("kg")}
            className={`rounded-full px-6 py-2.5 border-2 ${
              unit === "kg"
                ? "bg-[#e9f6ff] border-[#68c6ff]"
                : "bg-white border-[#b8e5ff]"
            }`}
            style={styles.unitButton}
          >
            <Text
              className={`text-base font-bold ${
                unit === "kg" ? "text-[#68c6ff]" : "text-[#b8e5ff]"
              }`}
            >
              kg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleUnit("lbs")}
            className={`rounded-full px-6 py-2.5 border-2 ${
              unit === "lbs"
                ? "bg-[#e9f6ff] border-[#68c6ff]"
                : "bg-white border-[#b8e5ff]"
            }`}
            style={styles.unitButton}
          >
            <Text
              className={`text-base font-bold ${
                unit === "lbs" ? "text-[#68c6ff]" : "text-[#b8e5ff]"
              }`}
            >
              lbs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight Display */}
        <View
          className="flex-row items-center justify-center mb-6"
          style={styles.weightContainer}
        >
          <TextInput
            value={weight.toString()}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              handleWeightChange(num);
            }}
            keyboardType="numeric"
            className="text-center text-[3rem] font-bold bg-transparent w-24 text-[#2b374b]"
            style={{
              fontFamily:
                Platform.OS === "ios" ? "System" : "sans-serif-medium",
            }}
          />
          <Text className="text-xl font-semibold text-[#68c6ff] ml-2">
            {unit}
          </Text>
        </View>

        {/* Slider */}
        <View className="w-full px-2 mt-2" style={styles.sliderContainer}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={minValue}
            maximumValue={maxValue}
            value={sliderValue}
            onValueChange={(value) => {
              const roundedValue = Math.round(value);
              handleWeightChange(roundedValue);
            }}
            minimumTrackTintColor="#68c6ff"
            maximumTrackTintColor="#b8e5ff"
            thumbTintColor="#68c6ff"
          />
          <View className="flex-row justify-between mt-1 px-1">
            <Text className="text-xs text-[#6fa9d1] font-semibold">
              {minValue} {unit}
            </Text>
            <Text className="text-xs text-[#6fa9d1] font-semibold">
              {maxValue} {unit}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View className="absolute bottom-6 left-4 right-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center px-5 py-3 rounded-full bg-white shadow-sm"
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={16}
            color="#68c6ff"
            style={{ marginRight: 8 }}
          />
          <Text className="text-[#68c6ff] font-bold text-base">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.8}
          style={{ borderRadius: 999, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#68c6ff", "#aeefff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-3 px-7 flex-row items-center"
            style={[styles.nextButton, { borderRadius: 999 }]}
          >
            <Text className="text-white font-bold text-base mr-2">Next</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  unitButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 80,
    alignItems: "center",
  },
  weightContainer: {
    backgroundColor: "#f5faff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sliderContainer: {
    backgroundColor: "#f5faff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButton: {
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default WeightScreen;
