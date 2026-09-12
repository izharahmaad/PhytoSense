import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { predictPlantHealth } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export default function CaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [temperature, setTemperature] = useState("28");
  const [humidity, setHumidity] = useState("55");
  const [lightIntensity, setLightIntensity] = useState("40000");
  const [soilMoisture, setSoilMoisture] = useState("35");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission is required to capture a leaf image.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!imageUri) {
      Alert.alert("Please capture a leaf image first.");
      return;
    }
    setLoading(true);
    try {
      const result = await predictPlantHealth(imageUri, {
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        lightIntensity: parseFloat(lightIntensity),
        soilMoisture: parseFloat(soilMoisture),
      });
      navigation.navigate("Result", { result });
    } catch (err) {
      Alert.alert("Prediction failed", "Check that the backend server is running and reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.imagePickerText}>Tap to capture leaf image</Text>
        )}
      </Pressable>

      <Text style={styles.label}>Temperature (°C)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={temperature} onChangeText={setTemperature} />

      <Text style={styles.label}>Humidity (%)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={humidity} onChangeText={setHumidity} />

      <Text style={styles.label}>Light Intensity (lux)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={lightIntensity} onChangeText={setLightIntensity} />

      <Text style={styles.label}>Soil Moisture (%)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={soilMoisture} onChangeText={setSoilMoisture} />

      <Pressable style={styles.submitButton} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Analyze Plant</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f1f8f4" },
  imagePicker: { height: 220, borderRadius: 12, borderWidth: 1.5, borderColor: "#95d5b2", justifyContent: "center", alignItems: "center", marginBottom: 20, backgroundColor: "#fff" },
  imagePickerText: { color: "#52796f" },
  image: { width: "100%", height: "100%", borderRadius: 12 },
  label: { fontSize: 13, color: "#2d6a4f", marginBottom: 4, marginTop: 10, fontWeight: "600" },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#d8f3dc" },
  submitButton: { backgroundColor: "#2d6a4f", padding: 16, borderRadius: 10, marginTop: 24, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
