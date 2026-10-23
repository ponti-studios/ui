// The published root entry owns the one-import stylesheet contract. Keeping
// this wrapper separate means source consumers can import `src/index` without
// resolving a generated dist artifact.
import "../dist/styles.css";

export * from "./index";
