import { Stack } from "expo-router";
import { useState } from "react";
import AnimatedSplash from "@/components/AnimatedSplash";

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </>
  );
}
