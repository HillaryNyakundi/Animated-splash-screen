import { Stack } from "expo-router";
import { useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import AnimatedSplash from "@/components/AnimatedSplash";

// Hold the native splash up until the animated splash is ready to draw, so the
// handoff between them is seamless (no blank flash in between).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {!splashDone && (
        <AnimatedSplash
          onReady={() => SplashScreen.hideAsync()}
          onFinish={() => setSplashDone(true)}
        />
      )}
    </>
  );
}
