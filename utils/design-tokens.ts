/** Hand-drawn design system tokens */

export const site = {
  name: "波波头的博客",
  tagline: "纸上留痕，笔下有光",
  description: "随手记下的文字、幻想、生活片段",
} as const;

export const colors = {
  background: "#fdfbf7",
  foreground: "#2d2d2d",
  muted: "#e5e0d8",
  accent: "#ff4d4d",
  border: "#2d2d2d",
  secondary: "#2d5da1",
  postIt: "#fff9c4",
  white: "#ffffff",
} as const;

export const wobblyRadius = {
  sm: "180px 15px 180px 15px / 15px 180px 15px 180px",
  md: "255px 15px 225px 15px / 15px 225px 15px 255px",
  lg: "280px 20px 240px 20px / 20px 240px 20px 280px",
  pill: "999px 18px 999px 18px / 18px 999px 18px 999px",
} as const;

export const shadows = {
  standard: "4px 4px 0px 0px #2d2d2d",
  emphasized: "8px 8px 0px 0px #2d2d2d",
  subtle: "3px 3px 0px 0px rgba(45, 45, 45, 0.1)",
  hover: "2px 2px 0px 0px #2d2d2d",
  none: "0px 0px 0px 0px transparent",
} as const;

export type WobblySize = keyof typeof wobblyRadius;
export type HandCardDecoration = "none" | "tape" | "tack" | "postit";
