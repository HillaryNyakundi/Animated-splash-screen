# Animated Splash Screen

A small [Expo](https://expo.dev) app demonstrating a **typewriter splash screen**: on
launch, a word is typed out one letter at a time, held for a beat, then erased
letter by letter — after which the Home screen is revealed.

Built with Expo Router (SDK 54), React Native 0.81, and React 19.

## The effect

The splash lives in [`components/AnimatedSplash.tsx`](components/AnimatedSplash.tsx)
and runs a four-phase sequence:

1. **Typing** — letters appear left → right.
2. **Holding** — the full word rests for a moment.
3. **Erasing** — letters disappear left → right (leftmost first).
4. **Done** — it calls `onFinish`, which hides the splash and shows Home.

Rather than growing and shrinking a substring (which makes text slide around),
every letter is always rendered in a fixed slot and only its **opacity** is
toggled. A single counter drives both passes — revealing letters from the left
while typing, and hiding them from the left while erasing — so the word stays
centered and no letter ever moves.

### Tuning it

All timing and the word itself are constants at the top of
[`AnimatedSplash.tsx`](components/AnimatedSplash.tsx):

| Constant | Meaning |
| --- | --- |
| `WORD` | The text that gets typed and erased |
| `TYPE_SPEED` | Milliseconds between each letter appearing |
| `ERASE_SPEED` | Milliseconds between each letter disappearing |
| `HOLD_MS` | Pause on the full word before erasing |
| `END_HOLD` | Pause on the empty line before revealing Home |

## Project structure

```
app/
  _layout.tsx     Root layout — renders the Stack and overlays the splash
  index.tsx       Home screen (revealed after the splash finishes)
components/
  AnimatedSplash.tsx   The typewriter splash animation
```

The splash and Home are connected by a single contract: `_layout.tsx` keeps a
`splashDone` flag and passes an `onFinish` callback to the splash. Home is
mounted underneath from the start; when the animation ends, `onFinish` flips the
flag and the overlay is removed.

## Get started

Install dependencies (this repo uses [pnpm](https://pnpm.io), but `npm` works too):

```bash
pnpm install
```

Start the app:

```bash
pnpm start
```

From the Expo dev server you can open it in an
[Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), an
[iOS simulator](https://docs.expo.dev/workflow/ios-simulator/),
[Expo Go](https://expo.dev/go), or the web:

```bash
pnpm android
pnpm ios
pnpm web
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — file-based routing
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
