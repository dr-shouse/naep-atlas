import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          map: ["@deck.gl/core", "@deck.gl/layers", "@deck.gl/react", "maplibre-gl", "react-map-gl"],
        },
      },
    },
  },
});
