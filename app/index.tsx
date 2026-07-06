import LottieView from "lottie-react-native";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../assets/lotties/Welcome.json")}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Welcome to the home page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  animation: {
    width: 260,
    height: 260,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    color: "#555",
  },
});
