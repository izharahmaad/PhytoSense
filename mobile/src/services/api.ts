import { Alert } from "react-native";

const SERVER_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "http://192.168.0.197:8001";

export const API_BASE_URL =
  `${SERVER_URL}/api/v1`;

export type PredictionResponse = {
  health_score: number;
  stress_level: string;
  stress_probabilities: Record<string, number>;
  cause_probabilities: Record<string, number>;
  environmental_attribution: Record<
    string,
    unknown
  >;
  recommendation: string;
};

export type HistoryItem = {
  id: number;
  created_at: string;
  stress_level: string;
  health_score: number;
  recommendation: string;
  temperature?: number;
  humidity?: number;
  light_intensity?: number;
  soil_moisture?: number;
};

function getDetail(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  ) {
    const detail = (data as { detail?: unknown }).detail;

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
  }

  return "Request failed.";
}

async function parseResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: text,
    };
  }
}

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

  formData.append(
    "temperature",
    String(temperature),
  );

  formData.append(
    "humidity",
    String(humidity),
  );

  formData.append(
    "light_intensity",
    String(lightIntensity),
  );

  formData.append(
    "soil_moisture",
    String(soilMoisture),
  );

  try {
    const response = await fetch(
      `${API_BASE_URL}/predict`,
      {
        method: "POST",
        body: formData,
      },
    );

    const responseData = await parseResponse(response);

    if (!response.ok) {
      const detail = getDetail(responseData);

      if (
        response.status === 422 &&
        detail.includes(
          "model confidence was too low",
        )
      ) {
        Alert.alert(
          "Image not clear enough",
          "Please take a close-up photo of one plant leaf with good lighting.",
        );
      } else {
        Alert.alert(
          "Prediction error",
          detail,
        );
      }

      throw new Error(detail);
    }

    return responseData as PredictionResponse;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Prediction failed.";

    if (
      !message.includes(
        "model confidence was too low",
      ) &&
      !message.includes(
        "Image not clear enough",
      )
    ) {
      Alert.alert(
        "Prediction error",
        message,
      );
    }

    throw error;
  }
}

export async function fetchHistory(): Promise<
  HistoryItem[]
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/history`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const responseData = await parseResponse(response);

    if (!response.ok) {
      const detail = getDetail(responseData);

      throw new Error(
        `History request failed with status ` +
          `${response.status}: ${detail}`,
      );
    }

    if (!Array.isArray(responseData)) {
      throw new Error(
        "Invalid history response format.",
      );
    }

    return responseData as HistoryItem[];
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load assessment history.";

    throw new Error(message);
  }
}