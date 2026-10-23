// Builds shadcn-compatible registry output from src/.
// Usage: node registry/scripts/build-registry.mjs
// Reads registry/registry.json, inlines + rewrites component sources,
// writes registry/public/registry.json and registry/public/r/*.json.
// Host registry/public/ statically; consumers add it as a namespace:
//   { "registries": { "@ponti": "https://<host>/registry.json" } }
// then: npx shadcn@latest add @ponti/button
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const registryDir = join(root, "registry");
const outDir = join(registryDir, "public", "r");

// Explicit source map. Convention fallback: src/components/<source>.tsx,
// except "lib" which maps to src/lib/utils.ts.
const SOURCE_MAP = {
  lib: "src/lib/utils.ts",
  "feedback/spinner": "src/components/feedback/spinner.tsx",
  "primitives/button": "src/components/primitives/button.tsx",
  "forms/input": "src/components/forms/input.tsx",
  "forms/checkbox": "src/components/forms/checkbox.tsx",
  "forms/label": "src/components/forms/label.tsx",
  "primitives/separator": "src/components/primitives/separator.tsx",
  "overlays/dialog": "src/components/overlays/dialog.tsx",
  "overlays/command": "src/components/overlays/command.tsx",
  "overlays/bottom-sheet": "src/components/overlays/bottom-sheet.tsx",
  "overlays/tooltip": "src/components/overlays/tooltip.tsx",
  "primitives/segmented-control": "src/components/primitives/segmented-control.tsx",
};

function sourcePath(source) {
  if (SOURCE_MAP[source]) return join(root, SOURCE_MAP[source]);
  return join(root, "src", "components", `${source}.tsx`);
}

// Registry target paths, keyed by registry item name.
function targetFor(itemName, files) {
  const targets = {
    utils: "lib/utils.ts",
    spinner: "components/ui/spinner.tsx",
    button: "components/ui/button.tsx",
    input: "components/ui/input.tsx",
    checkbox: "components/ui/checkbox.tsx",
    label: "components/ui/label.tsx",
    separator: "components/ui/separator.tsx",
    tooltip: "components/ui/tooltip.tsx",
    dialog: "components/ui/dialog.tsx",
    command: "components/ui/command.tsx",
    "bottom-sheet": "components/ui/bottom-sheet.tsx",
    "segmented-control": "components/ui/segmented-control.tsx",
  };
  return targets[itemName] ?? files[0]?.target ?? `components/ui/${itemName}.tsx`;
}

// Rewrite kit-relative imports to consumer aliases:
//   ../../lib/utils       -> @/lib/utils   (registry:lib item)
//   ../feedback/spinner   -> @/components/ui/spinner (registry dep target)
function rewriteImports(content) {
  return content
    .replaceAll(`from "../../lib/utils"`, `from "@/lib/utils"`)
    .replaceAll(`from "../feedback/spinner"`, `from "@/components/ui/spinner"`)
    .replaceAll(`from "./dialog"`, `from "@/components/ui/dialog"`);
}

const registry = JSON.parse(readFileSync(join(registryDir, "registry.json"), "utf8"));
mkdirSync(outDir, { recursive: true });

const index = { ...registry, items: [] };

for (const item of registry.items) {
  if (item.files.length !== 1 || !item.files[0].source) {
    throw new Error(`item "${item.name}" must declare exactly one { source } file`);
  }
  const content = rewriteImports(readFileSync(sourcePath(item.files[0].source), "utf8"));
  if (content.includes("../../lib/") || content.includes("../feedback/")) {
    throw new Error(`item "${item.name}" has unrewritten relative imports`);
  }
  const built = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
    files: [
      {
        path: item.files[0].target,
        content,
        type: item.type,
      },
    ],
  };
  for (const key of ["dependencies", "registryDependencies"]) {
    if (built[key] === undefined) delete built[key];
  }
  writeFileSync(join(outDir, `${item.name}.json`), `${JSON.stringify(built, null, 2)}\n`);
  index.items.push({ ...item, files: undefined, url: undefined });
}

writeFileSync(join(registryDir, "public", "registry.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Registry built: ${index.items.length} items -> registry/public/`);
