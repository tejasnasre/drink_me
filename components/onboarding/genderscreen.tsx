import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageCom from "../imagecom";

type Gender = "male" | "female";

interface StepScreenProps {
  onNext?: () => void;
  onBack?: () => void;
}

const GenderScreen: React.FC<StepScreenProps> = ({ onNext, onBack }) => {
  const { userData, updateUserGender } = useUser();
  const [selectedGender, setSelectedGender] = useState<Gender | null>(
    userData.gender as Gender | null
  );

  const handleGenderSelect = async (gender: Gender) => {
    setSelectedGender(gender);
    await updateUserGender(gender);

    // Automatically proceed to the next screen after a short delay
    setTimeout(() => {
      if (onNext) {
        onNext();
      }
    }, 300); // 300ms delay to show the selection effect
  };

  return (
    <View className="flex-1 px-4">
      <ImageCom imageurl="https://storage.googleapis.com/uxpilot-auth.appspot.com/283adc6d36-79d902bfcafe070d1fc6.png" />

      <View className="text-center mb-5">
        <Text
          className="text-[1.7rem] font-bold text-[#2b374b] text-center mb-1"
          style={{
            fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
          }}
        >
          Who are you?
        </Text>
        <Text className="text-base text-[#6fa9d1] font-medium text-center">
          Let's get to know you!
        </Text>
      </View>

      <View className="flex-row justify-center items-center gap-6 mt-8">
        {/* Male Card */}
        <TouchableOpacity
          onPress={() => handleGenderSelect("male")}
          activeOpacity={0.75}
          style={[
            styles.genderCard,
            selectedGender === "male" && styles.selectedGenderCard,
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconOuterCircle}>
              <LinearGradient
                colors={["#68c6ff", "#aeefff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="male" size={36} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.genderText}>Male</Text>
            <Text style={styles.pronounText}>He/Him</Text>

            {selectedGender === "male" && (
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#68c6ff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Female Card */}
        <TouchableOpacity
          onPress={() => handleGenderSelect("female")}
          activeOpacity={0.75}
          style={[
            styles.genderCard,
            selectedGender === "female" && styles.selectedGenderCard,
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconOuterCircle}>
              <LinearGradient
                colors={["#aeefff", "#68c6ff"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="female" size={36} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.genderText}>Female</Text>
            <Text style={styles.pronounText}>She/Her</Text>

            {selectedGender === "female" && (
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#68c6ff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View className="absolute bottom-6 left-4 right-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center px-5 py-3 rounded-full bg-white"
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={16}
            color="#68c6ff"
            style={{ marginRight: 8 }}
          />
          <Link href="/welcomescreen">
            <Text className="text-[#68c6ff] font-bold text-base">Back</Text>
          </Link>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Move styles to StyleSheet to fix the shadowOffset issue
const styles = StyleSheet.create({
  genderCard: {
    backgroundColor: "white",
    borderRadius: 30,
    width: 145,
    height: 180,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    position: "relative",
    overflow: "visible",
  },
  selectedGenderCard: {
    backgroundColor: "#e9f6ff",
    borderWidth: 3,
    borderColor: "#68c6ff",
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  iconOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  genderText: {
    color: "#2b374b",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 3,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  pronounText: {
    color: "#68c6ff",
    fontSize: 13,
    fontWeight: "600",
  },
  checkmarkBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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

export default GenderScreen;
