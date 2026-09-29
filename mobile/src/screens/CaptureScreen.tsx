import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
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

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Capture"
>;

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

function getBackendErrorMessage(
  error: unknown,
): string {
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
            (item as { msg?: unknown }).msg ??
              "Invalid request",
          );
        }

        return "Invalid request";
      })
      .join("\n");
  }

  if (candidate.response?.status) {
    return (
      `The server returned HTTP ` +
      `${candidate.response.status}.`
    );
  }

  if (candidate.request) {
    return (
      "The backend could not be reached. " +
      "Make sure it is running and your phone is " +
      "connected to the same Wi-Fi network."
    );
  }

  if (candidate.message) {
    return candidate.message;
  }

  return "Something went wrong while analyzing the image.";
}

function parseNumber(value: string): number {
  return Number.parseFloat(
    value.replace(",", ".").trim(),
  );
}

function validateEnvironment(
  temperatureText: string,
  humidityText: string,
  lightIntensityText: string,
  soilMoistureText: string,
): EnvironmentValues | null {
  const values: EnvironmentValues = {
    temperature: parseNumber(temperatureText),
    humidity: parseNumber(humidityText),
    lightIntensity: parseNumber(lightIntensityText),
    soilMoisture: parseNumber(soilMoistureText),
  };

  const hasInvalidNumber = Object.values(values).some(
    (value) => !Number.isFinite(value),
  );

  if (hasInvalidNumber) {
    Alert.alert(
      "Missing environment data",
      "Enter a valid number in every environment field.",
    );
    return null;
  }

  if (
    values.temperature < -50 ||
    values.temperature > 70
  ) {
    Alert.alert(
      "Invalid temperature",
      "Temperature must be between -50°C and 70°C.",
    );
    return null;
  }

  if (
    values.humidity < 0 ||
    values.humidity > 100
  ) {
    Alert.alert(
      "Invalid humidity",
      "Humidity must be between 0% and 100%.",
    );
    return null;
  }

  if (
    values.lightIntensity < 0 ||
    values.lightIntensity > 200000
  ) {
    Alert.alert(
      "Invalid light intensity",
      "Light intensity must be between 0 and 200,000 lux.",
    );
    return null;
  }

  if (
    values.soilMoisture < 0 ||
    values.soilMoisture > 100
  ) {
    Alert.alert(
      "Invalid soil moisture",
      "Soil moisture must be between 0% and 100%.",
    );
    return null;
  }

  return values;
}

function getProgressText(
  hasImage: boolean,
  fieldCount: number,
): string {
  if (!hasImage) {
    return "Step 1 of 2 · Add a leaf image";
  }

  if (fieldCount < 4) {
    return "Step 2 of 2 · Complete all readings";
  }

  return "Ready to analyze";
}

function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

export default function CaptureScreen({
  navigation,
}: Props) {
  const [imageUri, setImageUri] =
    useState<string | null>(null);

  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("55");
  const [lightIntensity, setLightIntensity] =
    useState("40000");
  const [soilMoisture, setSoilMoisture] =
    useState("35");

  const [loading, setLoading] = useState(false);

  const completedFields = useMemo(() => {
    return [
      temperature,
      humidity,
      lightIntensity,
      soilMoisture,
    ].filter(isFilled).length;
  }, [
    temperature,
    humidity,
    lightIntensity,
    soilMoisture,
  ]);

  const progressText = getProgressText(
    Boolean(imageUri),
    completedFields,
  );

  const openCamera = async () => {
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

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
        });

      if (
        !result.canceled &&
        result.assets[0]?.uri
      ) {
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

  const openLibrary = async () => {
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
          quality: 0.85,
        });

      if (
        !result.canceled &&
        result.assets[0]?.uri
      ) {
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
      "Use a close-up image of one visible leaf.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Camera",
          onPress: () => {
            void openCamera();
          },
        },
        {
          text: "Photo library",
          onPress: () => {
            void openLibrary();
          },
        },
      ],
    );
  };

  const removeImage = () => {
    if (loading) {
      return;
    }

    setImageUri(null);
  };

  const submit = async () => {
    if (loading) {
      return;
    }

    Keyboard.dismiss();

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
        Alert.alert("Invalid request", message);
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
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              PLANT HEALTH SCAN
            </Text>

            <Text style={styles.title}>
              New assessment
            </Text>

            <Text style={styles.subtitle}>
              Capture one clear leaf and add the current
              growing conditions.
            </Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>
              1 / 2
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressText}>
              {progressText}
            </Text>

            <Text style={styles.progressPercent}>
              {imageUri && completedFields === 4
                ? "100%"
                : imageUri
                  ? "75%"
                  : "25%"}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    imageUri && completedFields === 4
                      ? "100%"
                      : imageUri
                        ? "75%"
                        : "25%",
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Leaf image
            </Text>

            <Text style={styles.sectionHint}>
              One close-up leaf works best.
            </Text>
          </View>

          {imageUri && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove selected image"
              hitSlop={8}
              onPress={removeImage}
              disabled={loading}
            >
              <Text style={styles.removeText}>
                Remove
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture or choose a plant image"
          style={({ pressed }) => [
            styles.imagePicker,
            imageUri && styles.imagePickerSelected,
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

              <View style={styles.imageCheck}>
                <Text style={styles.imageCheckText}>
                  ✓
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
                Good lighting · no blur · leaf fills the
                frame
              </Text>

              <View style={styles.chooseButton}>
                <Text style={styles.chooseButtonText}>
                  Choose image
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipIconText}>
              i
            </Text>
          </View>

          <View style={styles.tipCopy}>
            <Text style={styles.tipLabel}>
              PHOTO TIP
            </Text>

            <Text style={styles.tipText}>
              Avoid holders, walls, tables, and distant
              plant photos. Keep one leaf visible and in
              focus.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Environment readings
            </Text>

            <Text style={styles.sectionHint}>
              Values used alongside the image analysis.
            </Text>
          </View>

          <Text style={styles.requiredText}>
            {completedFields}/4 complete
          </Text>
        </View>

        <View style={styles.fieldGrid}>
          <EnvironmentField
            label="Temperature"
            hint="Current air temperature"
            unit="°C"
            value={temperature}
            onChangeText={setTemperature}
            editable={!loading}
          />

          <EnvironmentField
            label="Humidity"
            hint="Relative humidity"
            unit="%"
            value={humidity}
            onChangeText={setHumidity}
            editable={!loading}
          />

          <EnvironmentField
            label="Light intensity"
            hint="Approximate brightness"
            unit="lux"
            value={lightIntensity}
            onChangeText={setLightIntensity}
            editable={!loading}
          />

          <EnvironmentField
            label="Soil moisture"
            hint="Moisture percentage"
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
              <ActivityIndicator
                color="#FFFFFF"
                style={styles.submitLoader}
              />

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
  hint: string;
  unit: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
};

function EnvironmentField({
  label,
  hint,
  unit,
  value,
  onChangeText,
  editable,
}: EnvironmentFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.fieldUnit}>
          {unit}
        </Text>
      </View>

      <View
        style={[
          styles.inputRow,
          !editable && styles.inputRowDisabled,
        ]}
      >
        <TextInput
          style={styles.input}
          inputMode="decimal"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          placeholderTextColor="#9AB0A1"
          editable={editable}
          selectTextOnFocus
          accessibilityLabel={label}
        />

        <Text style={styles.unit}>
          {unit}
        </Text>
      </View>

      <Text style={styles.fieldHint}>
        {hint}
      </Text>
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
    paddingTop: 27,
    paddingBottom: 32,
  },

  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
    paddingRight: 15,
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

  subtitle: {
    color: "#658575",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  stepBadge: {
    backgroundColor: "#DDF1E2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  stepText: {
    color: "#2D7A4B",
    fontSize: 12,
    fontWeight: "800",
  },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCEBE0",
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 18,
    padding: 13,
  },

  progressTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressText: {
    color: "#527763",
    fontSize: 11,
    fontWeight: "700",
  },

  progressPercent: {
    color: "#2D7A4B",
    fontSize: 11,
    fontWeight: "900",
  },

  progressTrack: {
    backgroundColor: "#E5F0E8",
    borderRadius: 5,
    height: 7,
    overflow: "hidden",
  },

  progressFill: {
    backgroundColor: "#2D7A4B",
    borderRadius: 5,
    height: "100%",
  },

  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
    marginTop: 24,
  },

  sectionTitle: {
    color: "#234A32",
    fontSize: 18,
    fontWeight: "800",
  },

  sectionHint: {
    color: "#82998A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  removeText: {
    color: "#B54848",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },

  requiredText: {
    color: "#7C9A87",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
  },

  imagePicker: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#A5D5B5",
    borderRadius: 22,
    borderWidth: 1.5,
    height: 242,
    justifyContent: "center",
    overflow: "hidden",
  },

  imagePickerSelected: {
    borderColor: "#69A77D",
  },

  imagePickerPressed: {
    opacity: 0.84,
  },

  placeholder: {
    alignItems: "center",
    paddingHorizontal: 22,
  },

  cameraCircle: {
    alignItems: "center",
    backgroundColor: "#DDF1E2",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: 13,
    width: 64,
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
    marginTop: 6,
    textAlign: "center",
  },

  chooseButton: {
    backgroundColor: "#E7F4EA",
    borderRadius: 11,
    marginTop: 15,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  chooseButtonText: {
    color: "#2D7A4B",
    fontSize: 12,
    fontWeight: "900",
  },

  image: {
    height: "100%",
    width: "100%",
  },

  imageOverlay: {
    backgroundColor: "rgba(23, 60, 42, 0.84)",
    borderRadius: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    right: 12,
  },

  changeImageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  imageCheck: {
    alignItems: "center",
    backgroundColor: "#2D7A4B",
    borderColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    top: 12,
    width: 32,
  },

  imageCheckText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  tipCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFDF5",
    borderColor: "#F0E7C7",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 14,
    padding: 14,
  },

  tipIcon: {
    alignItems: "center",
    backgroundColor: "#F5EBCB",
    borderRadius: 11,
    height: 23,
    justifyContent: "center",
    marginRight: 10,
    width: 23,
  },

  tipIconText: {
    color: "#B18B36",
    fontSize: 13,
    fontWeight: "900",
  },

  tipCopy: {
    flex: 1,
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

  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  field: {
    marginTop: 11,
    width: "48%",
  },

  fieldHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  label: {
    color: "#477D5C",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },

  fieldUnit: {
    color: "#83A08D",
    fontSize: 10,
    fontWeight: "800",
  },

  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D2E6D8",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 11,
  },

  inputRowDisabled: {
    backgroundColor: "#F0F5F1",
    opacity: 0.75,
  },

  input: {
    color: "#1B4332",
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },

  unit: {
    color: "#7A9984",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  fieldHint: {
    color: "#91A99A",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },

  submitButton: {
    alignItems: "center",
    backgroundColor: "#2D7A4B",
    borderRadius: 17,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    minHeight: 57,
    shadowColor: "#185C35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
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

  submitLoader: {
    marginRight: 10,
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
    marginTop: 18,
    textAlign: "center",
  },
});