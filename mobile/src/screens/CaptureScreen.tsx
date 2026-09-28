import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/AppNavigator";
import { predictPlant } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

type EnvironmentValues = {
  temperature: number;
  humidity: number;
  lightIntensity: number;
  soilMoisture: number;
};

type BackendError = {
  response?: {
    status?: number;
    data?: {
      detail?: unknown;
    };
  };
  request?: unknown;
  message?: string;
};

function getBackendErrorMessage(error: unknown): string {
  const candidate = error as BackendError;
  const detail = candidate.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "msg" in item
        ) {
          return String(
            (item as { msg?: unknown }).msg ?? "Invalid request",
          );
        }

        return "Invalid request";
      })
      .join("\n");
  }

  if (candidate.response?.status) {
    return `The server returned HTTP ${candidate.response.status}.`;
  }

  if (candidate.request) {
    return (
      "The backend could not be reached. Make sure it is running " +
      "and your phone is connected to the same Wi-Fi network."
    );
  }

  if (candidate.message) {
    return candidate.message;
  }

  return "Something went wrong while analyzing the image.";
}

function validateEnvironment(
  temperatureText: string,
  humidityText: string,
  lightIntensityText: string,
  soilMoistureText: string,
): EnvironmentValues | null {
  const values: EnvironmentValues = {
    temperature: Number.parseFloat(
      temperatureText.replace(",", "."),
    ),
    humidity: Number.parseFloat(
      humidityText.replace(",", "."),
    ),
    lightIntensity: Number.parseFloat(
      lightIntensityText.replace(",", "."),
    ),
    soilMoisture: Number.parseFloat(
      soilMoistureText.replace(",", "."),
    ),
  };

  const hasInvalidNumber = Object.values(values).some(
    (value) => !Number.isFinite(value),
  );

  if (hasInvalidNumber) {
    Alert.alert(
      "Invalid environment values",
      "Enter a valid number in every environment field.",
    );
    return null;
  }

  if (values.temperature < -50 || values.temperature > 70) {
    Alert.alert(
      "Invalid temperature",
      "Temperature must be between -50°C and 70°C.",
    );
    return null;
  }

  if (values.humidity < 0 || values.humidity > 100) {
    Alert.alert(
      "Invalid humidity",
      "Humidity must be between 0% and 100%.",
    );
    return null;
  }

  if (values.lightIntensity < 0) {
    Alert.alert(
      "Invalid light intensity",
      "Light intensity cannot be negative.",
    );
    return null;
  }

  if (values.soilMoisture < 0 || values.soilMoisture > 100) {
    Alert.alert(
      "Invalid soil moisture",
      "Soil moisture must be between 0% and 100%.",
    );
    return null;
  }

  return values;
}

export default function CaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("55");
  const [lightIntensity, setLightIntensity] = useState("40000");
  const [soilMoisture, setSoilMoisture] = useState("35");

  const [loading, setLoading] = useState(false);

  const captureImage = async () => {
    if (loading) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera permission required",
          "Allow camera access in Settings to capture a plant leaf.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);

      Alert.alert(
        "Camera error",
        "The camera could not be opened. Please try again.",
      );
    }
  };

  const chooseFromLibrary = async () => {
    if (loading) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow photo-library access to choose a plant image.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery error:", error);

      Alert.alert(
        "Gallery error",
        "The photo library could not be opened. Please try again.",
      );
    }
  };

  const chooseImageSource = () => {
    if (loading) {
      return;
    }

    Alert.alert(
      "Choose plant image",
      "Capture a new image or select one.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Camera",
          onPress: captureImage,
        },
        {
          text: "Photo library",
          onPress: chooseFromLibrary,
        },
      ],
    );
  };

  const submit = async () => {
    if (loading) {
      return;
    }

    if (!imageUri) {
      Alert.alert(
        "Image required",
        "Capture or select one clear plant-leaf image first.",
      );
      return;
    }

    const environment = validateEnvironment(
      temperature,
      humidity,
      lightIntensity,
      soilMoisture,
    );

    if (!environment) {
      return;
    }

    setLoading(true);

    try {
      const result = await predictPlant(
        imageUri,
        environment.temperature,
        environment.humidity,
        environment.lightIntensity,
        environment.soilMoisture,
      );

      navigation.navigate("Result", {
        result,
      });
    } catch (error) {
      const status = (
        error as {
          response?: {
            status?: number;
          };
        }
      ).response?.status;

      const message = getBackendErrorMessage(error);

      console.error(
        "Prediction error:",
        status,
        message,
      );

      if (status === 422) {
        Alert.alert("Image rejected", message);
      } else if (status === 400) {
        Alert.alert("Invalid image", message);
      } else if (status === 503) {
        Alert.alert("Model unavailable", message);
      } else if (!status) {
        Alert.alert("Backend unreachable", message);
      } else {
        Alert.alert("Prediction failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>
              PLANT HEALTH SCAN
            </Text>

            <Text style={styles.title}>
              New assessment
            </Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>
              1 / 2
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Capture one clear leaf and add the current
          environment readings.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture or choose a plant image"
          style={({ pressed }) => [
            styles.imagePicker,
            pressed && styles.imagePickerPressed,
          ]}
          onPress={chooseImageSource}
          disabled={loading}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />

              <View style={styles.imageOverlay}>
                <Text style={styles.changeImageText}>
                  Change image
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.cameraCircle}>
                <Text style={styles.cameraIcon}>
                  ⌾
                </Text>
              </View>

              <Text style={styles.imagePickerText}>
                Capture or choose a leaf image
              </Text>

              <Text style={styles.imagePickerHint}>
                One close-up leaf · good lighting · keep it
                in focus
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>
            PHOTO TIP
          </Text>

          <Text style={styles.tipText}>
            Avoid holders, walls, tables, and distant plant
            photos. The model works best with one visible
            leaf.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Environment readings
          </Text>

          <Text style={styles.requiredText}>
            Required
          </Text>
        </View>

        <View style={styles.fieldGrid}>
          <EnvironmentField
            label="Temperature"
            unit="°C"
            value={temperature}
            onChangeText={setTemperature}
            editable={!loading}
          />

          <EnvironmentField
            label="Humidity"
            unit="%"
            value={humidity}
            onChangeText={setHumidity}
            editable={!loading}
          />

          <EnvironmentField
            label="Light intensity"
            unit="lux"
            value={lightIntensity}
            onChangeText={setLightIntensity}
            editable={!loading}
          />

          <EnvironmentField
            label="Soil moisture"
            unit="%"
            value={soilMoisture}
            onChangeText={setSoilMoisture}
            editable={!loading}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Analyze plant health"
          style={({ pressed }) => [
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            pressed &&
              !loading &&
              styles.submitButtonPressed,
          ]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" />

              <Text style={styles.submitText}>
                Analyzing image...
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitText}>
                Analyze plant health
              </Text>

              <Text style={styles.submitArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Results are AI-assisted and should support, not
          replace, careful plant observation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type EnvironmentFieldProps = {
  label: string;
  unit: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
};

function EnvironmentField({
  label,
  unit,
  value,
  onChangeText,
  editable,
}: EnvironmentFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor="#9AB0A1"
          editable={editable}
          accessibilityLabel={label}
        />

        <Text style={styles.unit}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    color: "#659878",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  title: {
    color: "#173C2A",
    fontSize: 29,
    fontWeight: "800",
  },

  stepBadge: {
    borderRadius: 14,
    backgroundColor: "#DDF1E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  stepText: {
    color: "#2D7A4B",
    fontSize: 12,
    fontWeight: "800",
  },

  subtitle: {
    color: "#658575",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },

  imagePicker: {
    height: 242,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#A5D5B5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  imagePickerPressed: {
    opacity: 0.82,
  },

  placeholder: {
    alignItems: "center",
    paddingHorizontal: 22,
  },

  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDF1E2",
    marginBottom: 13,
  },

  cameraIcon: {
    color: "#2D7A4B",
    fontSize: 37,
    fontWeight: "600",
  },

  imagePickerText: {
    color: "#245C39",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  imagePickerHint: {
    color: "#789687",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 12,
    backgroundColor: "rgba(23, 60, 42, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  changeImageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  tipCard: {
    backgroundColor: "#FFFDF5",
    borderColor: "#F0E7C7",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
    marginBottom: 26,
  },

  tipLabel: {
    color: "#B18B36",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  tipText: {
    color: "#8F7E4A",
    fontSize: 12,
    lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  sectionTitle: {
    color: "#234A32",
    fontSize: 19,
    fontWeight: "800",
  },

  requiredText: {
    color: "#7C9A87",
    fontSize: 12,
    fontWeight: "700",
  },

  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  field: {
    width: "48%",
    marginTop: 10,
  },

  label: {
    color: "#477D5C",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },

  inputRow: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D2E6D8",
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 11,
  },

  input: {
    flex: 1,
    color: "#1B4332",
    fontSize: 16,
    paddingVertical: 0,
  },

  unit: {
    color: "#7A9984",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  submitButton: {
    minHeight: 57,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#2D7A4B",
    borderRadius: 17,
    marginTop: 28,
    elevation: 3,
    shadowColor: "#185C35",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  submitButtonDisabled: {
    backgroundColor: "#74A88F",
  },

  submitButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  submitArrow: {
    color: "#D6F2DE",
    fontSize: 23,
    fontWeight: "400",
    marginLeft: 10,
  },

  footerText: {
    color: "#8AA992",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 18,
  },
});