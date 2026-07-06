# Animated Splash Screen

A small [Expo](https://expo.dev) app demonstrating a polished, two-stage app
launch:

1. A **native splash screen** (a logo on a solid background, drawn by the OS
   before any JavaScript runs).
2. A **typewriter splash screen** that seamlessly takes over — a word is typed
   out one letter at a time, held for a beat, then erased letter by letter.
3. A **Home screen** with a looping [Lottie](https://airbnb.io/lottie/)
   welcome animation.

Built with Expo Router (SDK 54), React Native 0.81, and React 19.

> For a deep dive into how the three stages connect, see
> [docs/animation-architecture.md](docs/animation-architecture.md).

## The launch sequence

```
tap icon → native splash (logo on #0B1221) → typewriter splash → Home (Lottie)
```

### 1. Native splash → animated splash handoff

When an app opens, no JavaScript is running yet, so the very first frame *must*
be a static screen drawn by the OS — that's the native splash, configured via
the [`expo-splash-screen`](https://docs.expo.dev/versions/v54.0.0/sdk/splash-screen/)
plugin in [`app.json`](app.json) (logo `medium.png` on a `#0B1221` background).

To avoid a blank flash when React takes over, [`app/_layout.tsx`](app/_layout.tsx)
calls `SplashScreen.preventAutoHideAsync()` at startup so the native splash
stays up, and only calls `SplashScreen.hideAsync()` once the animated splash has
painted its first frame (via its `onReady` callback). Because both stages share
the same `#0B1221` background, the transition looks continuous.

### 2. The typewriter effect

The animated splash lives in
[`components/AnimatedSplash.tsx`](components/AnimatedSplash.tsx) and runs a
four-phase sequence:

1. **Typing** — letters appear left → right.
2. **Holding** — the full word rests for a moment.
3. **Erasing** — letters disappear left → right (leftmost first).
4. **Done** — it calls `onFinish`, which hides the splash and reveals Home.

Rather than growing and shrinking a substring (which makes text slide around),
every letter is always rendered in a fixed slot and only its **opacity** is
toggled. A single counter drives both passes — revealing letters from the left
while typing, and hiding them from the left while erasing — so the word stays
centered and no letter ever moves.

All timing and the word itself are constants at the top of the file:

| Constant | Meaning |
| --- | --- |
| `WORD` | The text that gets typed and erased |
| `TYPE_SPEED` | Milliseconds between each letter appearing |
| `ERASE_SPEED` | Milliseconds between each letter disappearing |
| `HOLD_MS` | Pause on the full word before erasing |
| `END_HOLD` | Pause on the empty line before revealing Home |

### 3. The Home screen

[`app/index.tsx`](app/index.tsx) renders a looping Lottie animation
([`assets/lotties/Welcome.json`](assets/lotties/Welcome.json)) via
`lottie-react-native`, above a short welcome message.

## Project structure

```
app/
  _layout.tsx     Root layout — native-splash handoff + Stack + animated splash
  index.tsx       Home screen (Lottie welcome animation)
components/
  AnimatedSplash.tsx   The typewriter splash animation
assets/
  images/medium.png    App icon + native splash logo
  lotties/Welcome.json  Home screen Lottie animation
```

The splash and Home are connected by a single contract: `_layout.tsx` keeps a
`splashDone` flag and passes an `onFinish` callback to the splash. Home is
mounted underneath from the start; when the animation ends, `onFinish` flips the
flag and the overlay is removed.

## Running the app

This app uses a config plugin (`expo-splash-screen`) and native modules, so it
**cannot run in Expo Go** — you need a native/dev build.

Install dependencies (this repo uses [pnpm](https://pnpm.io), but `npm` works too):

```bash
pnpm install
```

Generate the native projects and run on a device or emulator:

```bash
pnpm android   # expo run:android
pnpm ios       # expo run:ios
```

If you change native config in `app.json` (splash, icon, plugins), regenerate
the native projects so the changes take effect:

```bash
npx expo prebuild --clean
```

The web build still runs through the dev server:

```bash
pnpm web
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — file-based routing
- [Expo Splash Screen](https://docs.expo.dev/versions/v54.0.0/sdk/splash-screen/)
- [Lottie for React Native](https://airbnb.io/lottie/#/react-native)
