import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import CaptureScreen from "../screens/CaptureScreen";
import ResultScreen from "../screens/ResultScreen";
import HistoryScreen from "../screens/HistoryScreen";
import { PredictionResult } from "../services/api";

export type RootStackParamList = {
  Home: undefined;
  Capture: undefined;
  Result: { result: PredictionResult };
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#1b4332" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "PhytoSense" }} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: "New Assessment" }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Assessment Result" }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
    </Stack.Navigator>
  );
}
