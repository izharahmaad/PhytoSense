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
  temperature?: number;
  humidity?: number;
  light_intensity?: number;
  soil_moisture?: number;
  health_score: number;
  stress_level: string;
  recommendation: string;
};

type BackendResponse = {
  detail?: unknown;
};

function parseDetail(
  data: BackendResponse | unknown,
): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  ) {
    const detail = (data as BackendResponse).detail;

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

  return null;
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

function createHttpError(
  status: number,
  data: unknown,
): Error & {
  response?: {
    status: number;
    data: unknown;
  };
} {
  const detail =
    parseDetail(data) ??
    `Request failed with HTTP ${status}.`;

  const error = new Error(detail) as Error & {
    response?: {
      status: number;
      data: unknown;
    };
  };

  error.response = {
    status,
    data,
  };

  return error;
}

function createNetworkError(
  error: unknown,
): Error & {
  request?: boolean;
} {
  const message =
    error instanceof Error
      ? error.message
      : "Network request failed.";

  const networkError = new Error(
    `The backend could not be reached. ` +
      `Make sure it is running and your phone is ` +
      `connected to the same Wi-Fi network. ` +
      `Details: ${message}`,
  ) as Error & {
    request?: boolean;
  };

  networkError.request = true;

  return networkError;
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

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/predict`,
      {
        method: "POST",
        body: formData,
      },
    );
  } catch (error) {
    throw createNetworkError(error);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw createHttpError(response.status, data);
  }

  return data as PredictionResponse;
}

export async function fetchHistory(): Promise<
  HistoryItem[]
> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/history`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );
  } catch (error) {
    throw createNetworkError(error);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw createHttpError(response.status, data);
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "The history response has an invalid format.",
    );
  }

  return data as HistoryItem[];
}

export async function checkBackendHealth(): Promise<{
  status: string;
  service?: string;
}> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/health`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );
  } catch (error) {
    throw createNetworkError(error);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw createHttpError(response.status, data);
  }

  return data as {
    status: string;
    service?: string;
  };
}

export function showApiError(
  title: string,
  error: unknown,
): void {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  Alert.alert(title, message);
}