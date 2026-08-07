/**
 * Emits ONLY the native semantic/component tokens (native.tokens.json) as a
 * typed module. Foundations are kept in the dictionary so references resolve,
 * but are filtered out of the output — they already ship via
 * foundations.generated.ts.
 */
export default {
  source: [
    "src/styles/tokens/source/foundations.tokens.json",
    "src/styles/tokens/source/native.tokens.json",
  ],
  platforms: {
    typescript: {
      transformGroup: "js",
      buildPath: "src/styles/tokens/generated/",
      files: [
        {
          destination: "native.generated.ts",
          format: "javascript/esm",
          options: { minify: true },
          filter: (token) => token.filePath.includes("native.tokens.json"),
        },
      ],
    },
  },
};
