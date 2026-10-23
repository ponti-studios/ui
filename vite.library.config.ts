import { defineConfig } from "vite";

const externalPackages = [
  "@babel/runtime",
  "@base-ui/react",
  "@radix-ui/colors",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "react",
  "react-dom",
  "react-native",
  "tailwind-merge",
];

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        index: "src/package-index.ts",
        "components/primitives/index": "src/components/primitives/index.ts",
        "components/forms/index": "src/components/forms/index.ts",
        "components/feedback/index": "src/components/feedback/index.ts",
        "components/filters/index": "src/components/filters/index.ts",
        "components/overlays/index": "src/components/overlays/index.ts",
        "components/navigation/index": "src/components/navigation/index.ts",
        "components/data-display/index": "src/components/data-display/index.ts",
        "components/layout/index": "src/components/layout/index.ts",
        "lib/index": "src/lib/index.ts",
        "styles/tokens/index": "src/styles/tokens/index.ts",
        "styles/tokens/css-vars": "src/styles/tokens/css-vars.ts",
        "native/index": "src/native/index.ts",
        "hooks/index": "src/hooks/index.ts",
        "auth/index": "src/auth/index.ts",
        "integrations/service-worker": "src/integrations/service-worker.ts",
        "translations/ui-provider": "src/translations/ui-provider.tsx",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: (id) =>
        id === "../dist/styles.css" ||
        externalPackages.some((name) => id === name || id.startsWith(`${name}/`)),
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
});
