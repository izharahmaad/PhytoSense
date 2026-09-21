import { Alert } from "react-native";

const SERVER_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.197:8001";

export const API_BASE_URL = `${SERVER_URL}/api/v1`;

export type PredictionResponse = {
  health_score: number;
  stress_level: string;
  stress_probabilities: Record<string, number>;
  cause_probabilities: Record<string, number>;
  environmental_attribution: Record<string, unknown>;
  recommendation: string;
};

export async function predictPlant(
  imageUri: string,
  temperature: number,
  humidity: number,
  lightIntensity: number,
  soilMoisture: number,
): Promise<PredictionResponse> {
  const formData = new FormData();

  formData.append("image", {
    uri: imageUri,
    name: "plant.jpg",
    type: "image/jpeg",
  } as any);

  formData.append("temperature", String(temperature));
  formData.append("humidity", String(humidity));
  formData.append("light_intensity", String(lightIntensity));
  formData.append("soil_moisture", String(soilMoisture));

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    let responseData: any = {};

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      responseData = {
        detail: responseText,
      };
    }

    if (!response.ok) {
      const detail =
        responseData.detail ??
        `Prediction failed with status ${response.status}`;

      if (
        response.status === 422 &&
        String(detail).includes("model confidence was too low")
      ) {
        Alert.alert(
          "Image not clear enough",
          "Please take a close-up photo of one plant leaf with good lighting.",
        );
      } else {
        Alert.alert("Prediction error", String(detail));
      }

      throw new Error(String(detail));
    }

    return responseData as PredictionResponse;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Prediction failed.";

    if (!message.includes("model confidence was too low")) {
      Alert.alert("Prediction error", message);
    }

    throw error;
  }
}