import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { predictPlantHealth } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

type EnvironmentValues = {
  temperature: number;
  humidity: number;
  lightIntensity: number;
  soilMoisture: number;
};

function getBackendErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg ?? "Invalid request")
      .join("\n");
  }

  if (error?.response?.status) {
    return `The server returned HTTP ${error.response.status}.`;
  }

  if (error?.request) {
    return (
      "The backend could not be reached. Make sure the backend is running " +
      "and your phone is connected to the same Wi-Fi network."
    );
  }

  return "Something went wrong while analyzing the image.";
}

export default function CaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("55");
  const [lightIntensity, setLightIntensity] = useState("40000");
  const [soilMoisture, setSoilMoisture] = useState("35");

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (loading) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in your phone settings to capture a plant leaf."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);

      Alert.alert(
        "Camera error",
        "The camera could not be opened. Please try again."
      );
    }
  };

  const parseEnvironmentValues = (): EnvironmentValues | null => {
    const values: EnvironmentValues = {
      temperature: Number.parseFloat(temperature),
      humidity: Number.parseFloat(humidity),
      lightIntensity: Number.parseFloat(lightIntensity),
      soilMoisture: Number.parseFloat(soilMoisture),
    };

    const invalidNumber = Object.values(values).some(
      (value) => !Number.isFinite(value)
    );

    if (invalidNumber) {
      Alert.alert(
        "Invalid environment values",
        "Please enter valid numbers in all fields."
      );
      return null;
    }

    if (values.temperature < -50 || values.temperature > 70) {
      Alert.alert(
        "Invalid temperature",
        "Temperature must be between -50°C and 70°C."
      );
      return null;
    }

    if (values.humidity < 0 || values.humidity > 100) {
      Alert.alert(
        "Invalid humidity",
        "Humidity must be between 0% and 100%."
      );
      return null;
    }

    if (values.lightIntensity < 0) {
      Alert.alert(
        "Invalid light intensity",
        "Light intensity cannot be negative."
      );
      return null;
    }

    if (values.soilMoisture < 0 || values.soilMoisture > 100) {
      Alert.alert(
        "Invalid soil moisture",
        "Soil moisture must be between 0% and 100%."
      );
      return null;
    }

    return values;
  };

  const submit = async () => {
    if (loading) {
      return;
    }

    if (!imageUri) {
      Alert.alert(
        "Image required",
        "Please capture a clear plant leaf image first."
      );
      return;
    }

    const environment = parseEnvironmentValues();

    if (!environment) {
      return;
    }

    setLoading(true);

    try {
      const result = await predictPlantHealth(
        imageUri,
        environment
      );

      navigation.navigate("Result", { result });
    } catch (error: any) {
      console.error(
        "Prediction error:",
        error?.response?.status,
        error?.response?.data ?? error?.message
      );

      const status = error?.response?.status;
      const message = getBackendErrorMessage(error);

      if (status === 422) {
        Alert.alert("Image rejected", message);
      } else if (status === 400) {
        Alert.alert("Invalid image", message);
      } else if (status === 503) {
        Alert.alert("Model unavailable", message);
      } else if (!error?.response) {
        Alert.alert("Backend unreachable", message);
      } else {
        Alert.alert("Prediction failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Capture Plant Image</Text>

      <Text style={styles.subtitle}>
        Capture one clear, well-lit plant leaf for analysis.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.imagePicker,
          pressed && styles.imagePickerPressed,
        ]}
        onPress={pickImage}
        disabled={loading}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.cameraIcon}>📷</Text>

            <Text style={styles.imagePickerText}>
              Tap to capture leaf image
            </Text>

            <Text style={styles.imagePickerHint}>
              Keep the leaf centered, close, and in focus
            </Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.sectionTitle}>Environment readings</Text>

      <Text style={styles.label}>Temperature (°C)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={temperature}
        onChangeText={setTemperature}
        placeholder="e.g. 28"
        editable={!loading}
      />

      <Text style={styles.label}>Humidity (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={humidity}
        onChangeText={setHumidity}
        placeholder="e.g. 55"
        editable={!loading}
      />

      <Text style={styles.label}>Light intensity (lux)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={lightIntensity}
        onChangeText={setLightIntensity}
        placeholder="e.g. 40000"
        editable={!loading}
      />

      <Text style={styles.label}>Soil moisture (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={soilMoisture}
        onChangeText={setSoilMoisture}
        placeholder="e.g. 35"
        editable={!loading}
      />

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          loading && styles.submitButtonDisabled,
          pressed && !loading && styles.submitButtonPressed,
        ]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.submitText}>Analyzing...</Text>
          </>
        ) : (
          <Text style={styles.submitText}>Analyze Plant</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f1f8f4",
  },

  title: {
    color: "#1b4332",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    color: "#52796f",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  imagePicker: {
    height: 240,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#95d5b2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#ffffff",
  },

  imagePickerPressed: {
    opacity: 0.75,
  },

  placeholder: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  cameraIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  imagePickerText: {
    color: "#2d6a4f",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  imagePickerHint: {
    color: "#7a9188",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  sectionTitle: {
    color: "#1b4332",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },

  label: {
    color: "#2d6a4f",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 5,
  },

  input: {
    color: "#1b4332",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b7dfc8",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },

  submitButton: {
    minHeight: 54,
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 28,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  submitButtonDisabled: {
    backgroundColor: "#74a88f",
  },

  submitButtonPressed: {
    opacity: 0.8,
  },

  submitText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
});