// Builds and validates the local shadcn-compatible registry from src/.
// Usage: node registry/scripts/build-registry.mjs [--check]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const registryDir = join(root, "registry");
const outDir = join(registryDir, "public", "r");
const checkOnly = process.argv.includes("--check");
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
  "ponti-theme": "dist/styles.css",
};
const TARGET_MAP = {
  utils: "lib/utils.ts", spinner: "components/ui/spinner.tsx", button: "components/ui/button.tsx",
  input: "components/ui/input.tsx", checkbox: "components/ui/checkbox.tsx", label: "components/ui/label.tsx",
  separator: "components/ui/separator.tsx", tooltip: "components/ui/tooltip.tsx", dialog: "components/ui/dialog.tsx",
  command: "components/ui/command.tsx", "bottom-sheet": "components/ui/bottom-sheet.tsx",
  "segmented-control": "components/ui/segmented-control.tsx",
  "badge": "components/ui/badge.tsx", "card": "components/ui/card.tsx",
  "progress": "components/ui/progress.tsx", "skeleton": "components/ui/skeleton.tsx",
  "alert": "components/ui/alert.tsx", "empty-state": "components/ui/empty-state.tsx",
  "section-intro": "components/ui/section-intro.tsx", "surface-panel": "components/ui/surface-panel.tsx",
  "filter-chip": "components/ui/filter-chip.tsx", "active-filters-bar": "components/ui/active-filters-bar.tsx",
  "ponti-theme": "src/ponti-theme.css",
};
const RELATIVE_IMPORTS = {
  "../../lib/utils": "@/lib/utils",
  "../feedback/spinner": "@/components/ui/spinner",
  "./dialog": "@/components/ui/dialog",
  "./filter-chip": "@/components/ui/filter-chip",
};

function fail(message) { throw new Error(message); }
function sourcePath(source) {
  const relative = SOURCE_MAP[source] ?? `src/components/${source}.tsx`;
  if (!relative.startsWith("src/") && relative !== "dist/styles.css") fail(`source must be an approved project or generated path: ${source}`);
  return join(root, relative);
}
function writeOrCheck(path, content) {
  if (checkOnly) {
    let current;
    try { current = readFileSync(path, "utf8"); } catch { fail(`generated registry file is missing: ${path}`); }
    if (current !== content) fail(`generated registry file is stale: ${path}; run node registry/scripts/build-registry.mjs`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

const registry = JSON.parse(readFileSync(join(registryDir, "registry.json"), "utf8"));
if (!registry.name || !Array.isArray(registry.items)) fail("registry requires a name and items array");
const names = new Set();
for (const item of registry.items) {
  if (!item.name || names.has(item.name)) fail(`missing or duplicate registry item name: ${item.name}`);
  names.add(item.name);
  if (!item.title || !item.description || !item.type || !Array.isArray(item.files) || item.files.length === 0) {
    fail(`item ${item.name} needs title, description, type, and at least one file`);
  }
}
for (const item of registry.items) {
  for (const dependency of item.registryDependencies ?? []) {
    if (!names.has(dependency)) fail(`item ${item.name} references unknown registry dependency ${dependency}`);
  }
  const builtFiles = item.files.map((file) => {
    if (!file.source || !file.target) fail(`item ${item.name} has a file without source or target`);
    let content = readFileSync(sourcePath(file.source), "utf8");
    for (const [from, to] of Object.entries(RELATIVE_IMPORTS)) content = content.replaceAll(`from "${from}"`, `from "${to}"`);
    if (/from ["'](?:\.\.\/\.\.\/lib\/|\.\.\/feedback\/)/.test(content)) {
      fail(`item ${item.name} has an unrewritten kit-relative import in ${file.source}`);
    }
    return { path: file.target, content, type: file.type ?? item.type };
  });
  const built = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name, type: item.type, title: item.title, description: item.description,
    dependencies: item.dependencies, registryDependencies: item.registryDependencies,
    files: builtFiles,
  };
  for (const key of ["dependencies", "registryDependencies"]) if (built[key] === undefined) delete built[key];
  writeOrCheck(join(outDir, `${item.name}.json`), `${JSON.stringify(built, null, 2)}\n`);
}
const index = { ...registry, items: registry.items.map(({ files, url, ...item }) => item) };
writeOrCheck(join(registryDir, "public", "registry.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Registry ${checkOnly ? "validated" : "built"}: ${registry.items.length} items`);
