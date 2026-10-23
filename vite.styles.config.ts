import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/styles/build.ts",
      formats: ["es"],
      fileName: "styles-build",
      cssFileName: "styles",
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
