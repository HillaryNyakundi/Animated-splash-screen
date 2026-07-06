import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// The word that gets typed out and then erased.
const WORD = "Medium Splash";
const LETTERS = WORD.split("");
// Time between each letter appearing while typing.
const TYPE_SPEED = 130;
// Time between each letter disappearing while erasing (usually snappier).
const ERASE_SPEED = 70;
// Pause on the fully typed word before erasing starts.
const HOLD_MS = 900;
// Pause on the empty line after erasing, before revealing Home.
const END_HOLD = 400;

type Phase = "typing" | "holding" | "erasing" | "done";

export default function AnimatedSplash({
  onFinish,
  onReady,
}: {
  onFinish: () => void;
  // Fired once when the splash has laid out its first frame, so the caller can
  // hide the native splash without a blank flash.
  onReady?: () => void;
}) {
  // In "typing" this counts letters revealed from the left (0 -> N).
  // In "erasing" it counts letters hidden from the left (0 -> N).
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const reported = useRef(false);

  // Each render schedules exactly one timer for the current phase, and the
  // cleanup clears it so nothing fires after unmount.
  useEffect(() => {
    if (phase === "typing") {
      if (count >= LETTERS.length) {
        setPhase("holding");
        return;
      }
      const t = setTimeout(() => setCount((c) => c + 1), TYPE_SPEED);
      return () => clearTimeout(t);
    }

    if (phase === "holding") {
      const t = setTimeout(() => {
        setCount(0); // restart the counter, now meaning "erased from left".
        setPhase("erasing");
      }, HOLD_MS);
      return () => clearTimeout(t);
    }

    if (phase === "erasing") {
      if (count >= LETTERS.length) {
        const t = setTimeout(() => setPhase("done"), END_HOLD);
        return () => clearTimeout(t);
      }
      // Hide one more letter from the left -> the word erases left to right.
      const t = setTimeout(() => setCount((c) => c + 1), ERASE_SPEED);
      return () => clearTimeout(t);
    }

    if (phase === "done") {
      onFinish();
    }
  }, [phase, count, onFinish]);

  // Whether letter `i` is currently shown. Every letter always occupies its
  // slot (opacity only) so the word block stays centered and letters never move.
  const isVisible = (i: number) => {
    if (phase === "typing") return i < count;
    if (phase === "holding") return true;
    if (phase === "erasing") return i >= count;
    return false;
  };

  return (
    <View
      style={styles.container}
      onLayout={() => {
        if (reported.current) return;
        reported.current = true;
        onReady?.();
      }}
    >
      <View style={styles.row}>
        {LETTERS.map((ch, i) => (
          <Text key={i} style={[styles.text, { opacity: isVisible(i) ? 1 : 0 }]}>
            {ch}
          </Text>
        ))}
      </View>
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
  row: {
    flexDirection: "row",
  },
  text: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
  },
});
