export const COLORS = {
  cyan: {
    light: "#b3d9ff",
    dark: "cyan"
  },
  pink: {
    light: "#e6ffb3",
    dark: "pink"
  },
  lightgreen: {
    light: "#b3b3ff",
    dark: "lightgreen"
  },
  magenta: {
    light: "#ffd9b3",
    dark: "magenta"
  },
  cornflowerblue: {
    light: "#ffb3ff",
    dark: "cornflowerblue"
  },
  orange: {
    light: "#b3ffb3",
    dark: "orange"
  },
  green: {
    light: "#ffff80",
    dark: "green"
  },
  red: {
    light: "#d1e0e0",
    dark: "red"
  }
} as const;

export type Color = typeof COLORS[keyof typeof COLORS];
