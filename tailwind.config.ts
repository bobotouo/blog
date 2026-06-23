import type { Config } from "tailwindcss";
import { colors, shadows } from "./utils/design-tokens";

export default {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        paper: colors.background,
        pencil: colors.foreground,
        erased: colors.muted,
        marker: colors.accent,
        pen: colors.secondary,
        postit: colors.postIt,
      },
      fontFamily: {
        heading: ['"Kalam"', "cursive"],
        body: ['"Patrick Hand"', "cursive"],
        sans: ['"Patrick Hand"', "cursive"],
      },
      boxShadow: {
        hand: shadows.standard,
        "hand-lg": shadows.emphasized,
        "hand-subtle": shadows.subtle,
        "hand-hover": shadows.hover,
      },
    },
  },
  plugins: [],
} satisfies Config;
