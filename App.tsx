import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, SafeAreaView, StyleSheet } from "react-native";
import { TokenListScreen } from "./src/screens/TokenListScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <TokenListScreen />
      <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
});

