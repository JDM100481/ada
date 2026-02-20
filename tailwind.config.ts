import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        digi: {
          blue: "#2375e1"
        }
      }
    }
  },
  plugins: []
};

export default config;
