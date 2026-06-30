import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// How long one shimmer sweep (left -> right) takes.
const SWEEP_DURATION = 1400;
// How many times the highlight sweeps across before showing Home.
const SWEEP_COUNT = 3;
// Short pause after the last sweep before revealing Home.
const HOLD_AFTER = 500;

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  // Width of the bright highlight band that slides across the text.
  const [bandWidth] = useState(() => Math.round(width * 0.6));
  // 0 = band fully off the left edge, 1 = band fully off the right edge.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION, easing: Easing.linear }),
      SWEEP_COUNT,
      false,
    );

    const timer = setTimeout(onFinish, SWEEP_DURATION * SWEEP_COUNT + HOLD_AFTER);
    return () => clearTimeout(timer);
  }, [onFinish, progress]);

  const bandStyle = useAnimatedStyle(() => {
    // Travel from just left of the screen to just past the right edge.
    const start = -bandWidth;
    const end = width;
    return {
      transform: [{ translateX: start + progress.value * (end - start) }],
    };
  });

  return (
    <View style={styles.container}>
      <MaskedView
        style={styles.mask}
        maskElement={
          <View style={styles.maskWrap}>
            <Text style={styles.text}>Medium Splash</Text>
          </View>
        }
      >
        {/* Base (dim) color of the text. */}
        <View style={[StyleSheet.absoluteFill, styles.base]} />
        {/* Bright highlight band that sweeps across, revealing the shimmer. */}
        <Animated.View style={[styles.bandWrap, bandStyle, { width: bandWidth }]}>
          <AnimatedGradient
            colors={["transparent", "#ffffff", "transparent"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1221",
    justifyContent: "center",
    alignItems: "center",
  },
  mask: {
    height: 60,
    width: "100%",
  },
  maskWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  base: {
    // Dim version of the text that the highlight sweeps over.
    backgroundColor: "#3A4A66",
  },
  bandWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  text: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "700",
  },
});
