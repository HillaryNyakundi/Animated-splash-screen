# Animation Architecture

How the launch animation works and how every piece connects — from the moment a
user taps the icon to the Home screen appearing.

## The big picture

The app has a **three-stage launch**, and each stage is drawn by a different
layer of the system:

```
┌─ tap icon ─────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. NATIVE SPLASH          2. ANIMATED SPLASH         3. HOME           │
│     (OS, static)              (React, typewriter)        (React, Lottie)│
│                                                                         │
│  medium.png on #0B1221  →  "Medium Splash" types    →  Welcome.json     │
│                            in and erases out           loops forever    │
│                                                                         │
│  drawn before JS runs      drawn once React mounts     revealed when    │
│                            over the top of Home        splash finishes  │
└─────────────────────────────────────────────────────────────────────────┘
```

The trick to making this feel like one smooth experience is that stages 1 and 2
**share the same `#0B1221` background** and are handed off at a precise moment so
there's never a blank flash.

## Why there are two splashes

When a user taps the app icon, the operating system starts the app process, but
**no JavaScript is running yet**. React — and therefore anything you animate in
React — cannot draw until a chain of native startup completes:

```
tap icon
  → OS starts the app process        (native)
  → JS engine (Hermes) boots          (native)
  → JS bundle loads & executes        (native → JS)
  → React mounts the component tree   (JS)
  → only now can AnimatedSplash draw
```

Something must fill that gap, and it can't be the animation, because the engine
that would run it isn't alive yet. That "something" is the **native splash** — a
static image the OS paints on its own. This is not an Expo limitation; every
mobile app works this way. So the design goal is not "make the animation first"
(impossible) but "make the seam between native and animated invisible".

## The files and their roles

| File | Role in the animation |
| --- | --- |
| [`app.json`](../app.json) | Configures the **native splash** (`expo-splash-screen` plugin: logo + `#0B1221` background) and the app icon. |
| [`app/_layout.tsx`](../app/_layout.tsx) | The **conductor**. Holds the native splash open, overlays the animated splash on Home, and coordinates the handoffs. |
| [`components/AnimatedSplash.tsx`](../components/AnimatedSplash.tsx) | The **typewriter animation**. Types the word in, erases it, and reports two moments back to the layout. |
| [`app/index.tsx`](../app/index.tsx) | The **Home screen** with the looping Lottie animation, mounted underneath the splash the whole time. |

## Stage 1 → 2: the native-to-animated handoff

This is coordinated entirely by [`app/_layout.tsx`](../app/_layout.tsx) using two
`expo-splash-screen` calls and a callback.

**Step A — hold the native splash open.** At module load (before the component
even renders), the layout calls:

```ts
SplashScreen.preventAutoHideAsync();
```

By default the native splash auto-dismisses the instant React mounts, which would
briefly reveal a blank/Home frame before the animation is ready. This call tells
the OS: *don't hide yet — I'll tell you when.*

**Step B — mount the animated splash over Home.** The layout renders the
navigation `Stack` (which mounts Home) and, on top of it, the `AnimatedSplash` —
but only while a `splashDone` flag is false:

```tsx
<Stack screenOptions={{ headerShown: false }} />
{!splashDone && (
  <AnimatedSplash
    onReady={() => SplashScreen.hideAsync()}   // stage 1 → 2 handoff
    onFinish={() => setSplashDone(true)}        // stage 2 → 3 handoff
  />
)}
```

**Step C — hide the native splash at the exact right frame.** The animated splash
fills the screen with the same `#0B1221`. The moment it has actually laid out its
first frame, it fires `onReady`, and the layout calls `SplashScreen.hideAsync()`.
Because the animated splash is already painted (same color) when the native one
disappears, the switch is invisible — it looks like one continuous dark screen.

## Inside the animated splash

[`components/AnimatedSplash.tsx`](../components/AnimatedSplash.tsx) drives the whole
typewriter effect from just **two pieces of state**:

- `phase` — where we are: `"typing" | "holding" | "erasing" | "done"`.
- `count` — a single number whose meaning **changes with the phase**: during
  typing it's "how many letters are revealed from the left"; during erasing it's
  "how many letters are hidden from the left".

### The phase state machine

A single `useEffect` re-runs whenever `phase` or `count` changes. Each run
schedules **exactly one** timer for the current situation and returns a cleanup
that clears it — so timers never pile up and nothing fires after unmount. The
phases hand off like a relay:

```
typing  ── count 0→N, one letter every TYPE_SPEED ms ──► holding
holding ── wait HOLD_MS, then reset count to 0 ─────────► erasing
erasing ── count 0→N, one letter every ERASE_SPEED ms ─► done
done    ── call onFinish() ────────────────────────────► (layout hides splash)
```

So the counter climbs 0→N twice: the first climb *reveals* letters, and after a
pause and reset, the second climb *hides* them.

### Why letters never move (the opacity trick)

The naive approach — rendering a growing/shrinking substring — makes the text
physically change width, so a centered word jitters and re-centers on every
letter. Instead, **every letter is always rendered** in its own fixed slot, and
only its `opacity` is toggled:

```ts
const isVisible = (i) => {
  if (phase === "typing")  return i < count;   // light up left → right
  if (phase === "holding") return true;         // all on
  if (phase === "erasing") return i >= count;   // go dark left → right
  return false;                                 // done: all off
};
```

Because transparent letters still occupy their space, the word block stays
perfectly centered and no visible letter ever shifts. Typing and erasing are the
same row of letters — you're just flipping which ones are lit, from opposite ends
of the same counter.

### The two signals it sends back

The animated splash is deliberately decoupled from what the app does with it — it
only reports two moments through callbacks the layout provides:

- **`onReady`** — fired once from the container's `onLayout` (guarded by a
  `reported` ref so it only fires the first time). This is the "I've painted my
  first frame" signal that triggers the native-splash hide.
- **`onFinish`** — fired when `phase` reaches `"done"`. This is the "animation is
  over" signal that tells the layout to drop the overlay.

## Stage 2 → 3: revealing Home

Home ([`app/index.tsx`](../app/index.tsx)) is **not** navigated to at the end — it
was mounted underneath the splash from the very start, already running its Lottie
animation. When `onFinish` fires, the layout flips `splashDone` to `true`, React
stops rendering the `AnimatedSplash` overlay, and the Home screen that was always
there becomes visible.

Home itself is simple: a `LottieView` loads
[`assets/lotties/Welcome.json`](../assets/lotties/Welcome.json) with `autoPlay`
and `loop`, sized explicitly (Lottie has no intrinsic size), above a welcome
message.

## End-to-end timeline

```
tap icon
  │
  ├─ OS paints native splash            (app.json: medium.png on #0B1221)
  │
  ├─ JS loads, React mounts _layout.tsx
  │     • preventAutoHideAsync() already ran → native splash still up
  │     • Stack mounts Home (Lottie starts looping, hidden underneath)
  │     • AnimatedSplash mounts over the top (same #0B1221)
  │
  ├─ AnimatedSplash lays out first frame → onReady → hideAsync()
  │     • native splash disappears behind the identical animated one (no flash)
  │
  ├─ typing → holding → erasing          (the typewriter effect plays)
  │
  ├─ phase = done → onFinish → splashDone = true
  │
  └─ overlay removed → Home (Lottie) is revealed
```

## The one contract to remember

Everything hinges on a single, small contract between the layout and the splash:

> The layout owns *what happens*; the splash owns *when*. The splash never
> touches the native splash, navigation, or Home directly — it just calls
> `onReady` ("I'm painted") and `onFinish` ("I'm done"), and the layout decides
> what those mean.

This is what keeps the animation reusable and the launch logic in one place.
