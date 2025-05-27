import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WakeUpTimeStepProps {
  onNext: () => void;
  onBack: () => void;
}

const WakeUpTimeStep: React.FC<WakeUpTimeStepProps> = ({ onNext, onBack }) => {
  const { userData, updateWakeupTime } = useUser();
  const [hour, setHour] = useState(userData.wakeupTime.hour);
  const [minute, setMinute] = useState(userData.wakeupTime.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(userData.wakeupTime.ampm);

  const pad = (n: number): string => {
    return n < 10 ? "0" + n : n.toString();
  };

  const incrementHour = async () => {
    const newHour = hour === 12 ? 1 : hour + 1;
    setHour(newHour);
    await updateWakeupTime(newHour, minute, ampm);
  };

  const decrementHour = async () => {
    const newHour = hour === 1 ? 12 : hour - 1;
    setHour(newHour);
    await updateWakeupTime(newHour, minute, ampm);
  };

  const incrementMinute = async () => {
    let newMinute;
    if (minute === 55) {
      newMinute = 0;
    } else {
      newMinute = minute + 5;
    }
    setMinute(newMinute);
    await updateWakeupTime(hour, newMinute, ampm);
  };

  const decrementMinute = async () => {
    let newMinute;
    if (minute === 0) {
      newMinute = 55;
    } else {
      newMinute = minute - 5;
    }
    setMinute(newMinute);
    await updateWakeupTime(hour, newMinute, ampm);
  };

  const toggleAmPm = async () => {
    const newAmPm = ampm === "AM" ? "PM" : "AM";
    setAmpm(newAmPm);
    await updateWakeupTime(hour, minute, newAmPm);
  };

  return (
    <View className="flex-1 px-4">
      <View className="flex-col items-center mt-6 mb-2">
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/0f9c1c1568-4c4855194641a084fb85.png",
            }}
            className="w-40 h-40"
            resizeMode="contain"
            style={styles.image}
          />
        </View>
      </View>

      <View className="text-center mb-6">
        <Text
          className="text-[1.7rem] font-bold text-[#2b374b] text-center mb-1"
          style={{
            fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
          }}
        >
          What time do you wake up?
        </Text>
        <Text className="text-base text-[#6fa9d1] font-medium text-center">
          Set your usual wake-up time so we can remind you to start hydrating!
        </Text>
      </View>

      <View className="flex-col items-center w-full">
        {/* Time Picker */}
        <View style={styles.timePickerContainer} className="mb-8">
          {/* Hour Selector */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              onPress={incrementHour}
              style={styles.timeArrowButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={24} color="#68c6ff" />
            </TouchableOpacity>

            <View style={styles.timeDisplayBox}>
              <Text style={styles.timeText}>{pad(hour)}</Text>
            </View>

            <TouchableOpacity
              onPress={decrementHour}
              style={styles.timeArrowButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={24} color="#68c6ff" />
            </TouchableOpacity>

            <Text style={styles.timeLabel}>Hour</Text>
          </View>

          {/* Separator */}
          <View style={styles.timeSeparator}>
            <Text style={styles.separatorText}>:</Text>
          </View>

          {/* Minute Selector */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              onPress={incrementMinute}
              style={styles.timeArrowButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={24} color="#68c6ff" />
            </TouchableOpacity>

            <View style={styles.timeDisplayBox}>
              <Text style={styles.timeText}>{pad(minute)}</Text>
            </View>

            <TouchableOpacity
              onPress={decrementMinute}
              style={styles.timeArrowButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={24} color="#68c6ff" />
            </TouchableOpacity>

            <Text style={styles.timeLabel}>Minute</Text>
          </View>

          {/* AM/PM Selector */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              onPress={toggleAmPm}
              style={[
                styles.ampmButton,
                ampm === "AM" && styles.ampmButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ampmText,
                  ampm === "AM" && styles.ampmTextActive,
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleAmPm}
              style={[
                styles.ampmButton,
                ampm === "PM" && styles.ampmButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ampmText,
                  ampm === "PM" && styles.ampmTextActive,
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Time Display */}
        <View style={styles.infoContainer}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="sunny" size={18} color="#4b9fe0" />
          </View>
          <Text style={styles.infoText}>
            Sleep reminders pause at {pad(hour)}:{pad(minute)} {ampm}
          </Text>
        </View>
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
          <Text className="text-[#68c6ff] font-bold text-base">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} activeOpacity={0.8}>
          <LinearGradient
            colors={["#68c6ff", "#aeefff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-full py-3 px-7 flex-row items-center"
            style={styles.nextButton}
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
  imageContainer: {
    backgroundColor: "#e9f6ff",
    borderRadius: 70,
    padding: 10,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    borderRadius: 70,
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5faff",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
  },
  timeColumn: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
  },
  timeSeparator: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    marginHorizontal: 5,
  },
  separatorText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#68c6ff",
    marginTop: -10,
  },
  timeArrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e9f6ff",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeDisplayBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#e9f6ff",
  },
  timeText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2b374b",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  timeLabel: {
    fontSize: 12,
    color: "#6fa9d1",
    fontWeight: "600",
    marginTop: 4,
  },
  ampmButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#e9f6ff",
  },
  ampmButtonActive: {
    backgroundColor: "#e9f6ff",
    borderColor: "#68c6ff",
  },
  ampmText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#b8e5ff",
  },
  ampmTextActive: {
    color: "#68c6ff",
  },
  currentTimeContainer: {
    backgroundColor: "#e9f6ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginBottom: 16,
  },
  currentTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d7fd3",
    textAlign: "center",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9f6ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#d5eeff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d7fd3",
    textAlign: "center",
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
    borderRadius: 999,
  },
});

export default WakeUpTimeStep;
