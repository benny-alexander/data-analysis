import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#fafaf7",
        mute: "#6b6b6b",
        line: "#e6e4dd",
        accent: "#1f6b5e",
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', "Charter", "Georgia", "serif"],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Inter"', '"Helvetica Neue"', 'sans-serif'],
      },
      maxWidth: {
        prose: "42rem",
      },
    },
  },
  plugins: [],
};

export default config;
