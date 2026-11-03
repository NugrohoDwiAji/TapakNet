import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#072255",
          royal: "#0B4EA2",
          cobalt: "#0B4EA2",
          tech: "#1E69DE",
          sky: "#3B82F6",
          darkNavy: "#041433",
          lightBlue: "#EBF3FE",
        },
      },
    },
  },
  plugins: [],
};
export default config;
