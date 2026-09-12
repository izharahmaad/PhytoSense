import axios from "axios";

// IMPORTANT: replace with your machine's local network IP when testing on a
// physical device, e.g. "http://192.168.1.20:8000". "localhost" only works
// on emulators bound to the same host.
export const API_BASE_URL = "http://192.168.1.100:8000/api/v1";

export interface EnvironmentReading {
  temperature: number;
  humidity: number;
  lightIntensity: number;
  soilMoisture: number;
}

export interface PredictionResult {
  health_score: number;
  stress_level: string;
  stress_probabilities: Record<string, number>;
  cause_probabilities: Record<string, number>;
  environmental_attribution: Record<string, number>;
  recommendation: string;
}

export async function predictPlantHealth(
  imageUri: string,
  env: EnvironmentReading
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: "leaf.jpg",
    type: "image/jpeg",
  } as any);
  formData.append("temperature", String(env.temperature));
  formData.append("humidity", String(env.humidity));
  formData.append("light_intensity", String(env.lightIntensity));
  formData.append("soil_moisture", String(env.soilMoisture));

  const response = await axios.post<PredictionResult>(
    `${API_BASE_URL}/predict`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

export async function fetchHistory() {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
}
