import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// How long the single left -> right slide takes (slower = bigger number).
const SLIDE_DURATION = 4000;
// Extra pause after the slide finishes before showing Home.
const HOLD_AFTER_SLIDE = 800;
// Gap kept between the text and the screen edges.
const EDGE_PADDING = 16;

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const [textWidth, setTextWidth] = useState(0);
  // 0 = far left, 1 = far right. Drives both position and the fade.
  const progress = useSharedValue(0);

  useEffect(() => {
    // Wait until we've measured the text so we know how far it can travel.
    if (!textWidth) return;

    progress.value = withTiming(1, { duration: SLIDE_DURATION });

    // Reveal Home after the slide finishes (plus a short pause).
    const timer = setTimeout(onFinish, SLIDE_DURATION + HOLD_AFTER_SLIDE);
    return () => clearTimeout(timer);
  }, [onFinish, progress, width, textWidth]);

  const textStyle = useAnimatedStyle(() => {
    const distance = width - textWidth - EDGE_PADDING * 2;
    return {
      transform: [
        { translateX: progress.value * distance },
        // Shrink a touch over the last stretch so it recedes into the screen.
        { scale: interpolate(progress.value, [0.7, 1], [1, 0.6], "clamp") },
      ],
      // Fade out over the final 30% of the trip -> disappears at the right.
      opacity: interpolate(progress.value, [0.7, 1], [1, 0], "clamp"),
    };
  });

  return (
    <Animated.View style={styles.container}>
      <Animated.Text
        style={[styles.text, textStyle]}
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
      >
        Medium Splash
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1221",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: EDGE_PADDING,
  },
  text: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
  },
});
