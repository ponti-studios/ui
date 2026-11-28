#!/usr/bin/env node
// Packs the library and builds two real apps against the tarball: one with
// Tailwind, one without. Each has to SSR a Button under plain Node and ship CSS
// that styles it. Run `make build` first.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dev = manifest.devDependencies;
const work = mkdtempSync(join(tmpdir(), "ui-consumers-"));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

// --ignore-scripts skips prepack, which would rebuild everything.
run("npm", ["pack", "--ignore-scripts", "--pack-destination", work], root);
const tarball = join(
  work,
  readdirSync(work).find((name) => name.endsWith(".tgz")),
);

const apps = {
  tailwind: {
    css: '@import "tailwindcss";\n@import "@ponti-studios/ui";\n',
    plugins: "[tailwindcss()]",
    pluginImport: 'import tailwindcss from "@tailwindcss/vite";\n',
    devDependencies: {
      tailwindcss: dev.tailwindcss,
      "@tailwindcss/vite": dev["@tailwindcss/vite"],
    },
  },
  plain: {
    css: '@import "@ponti-studios/ui/styles.css";\n',
    plugins: "[]",
    pluginImport: "",
    devDependencies: {},
  },
};

// Classes straight off the default Button, plus a theme token behind them.
const expected = [".bg-primary", ".inline-flex", ".rounded-md", "--primary:"];

for (const [name, app] of Object.entries(apps)) {
  const dir = join(work, name);
  mkdirSync(join(dir, "src"), { recursive: true });
  const write = (file, text) => writeFileSync(join(dir, file), text);

  write(
    "package.json",
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        "@ponti-studios/ui": `file:${tarball}`,
        react: dev.react,
        "react-dom": dev["react-dom"],
      },
      devDependencies: { vite: dev.vite, ...app.devDependencies },
    }),
  );
  write(
    "vite.config.js",
    `import { defineConfig } from "vite";\n${app.pluginImport}export default defineConfig({ plugins: ${app.plugins} });\n`,
  );
  write("src/app.css", app.css);
  write(
    "src/client.js",
    'import "./app.css";\nimport { Button } from "@ponti-studios/ui/primitives";\nconsole.log(Button);\n',
  );
  write("index.html", '<script type="module" src="/src/client.js"></script>\n');
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], dir);
  run("npx", ["vite", "build", "--logLevel", "warn"], dir);

  // Written after the build so Tailwind can't pick our class names up from here.
  // Plain Node on purpose: a stray CSS import in the JS entries dies right here.
  write(
    "ssr.mjs",
    `import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Button } from "@ponti-studios/ui/primitives";
import "@ponti-studios/ui";
const html = renderToString(createElement(Button, null, "hi"));
if (!html.includes("bg-primary")) throw new Error("Button rendered without its classes: " + html);
`,
  );
  run("node", ["ssr.mjs"], dir);

  const assets = join(dir, "dist/assets");
  const css = readdirSync(assets)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(join(assets, file), "utf8"))
    .join("\n");
  const missing = expected.filter((needle) => !css.includes(needle));
  if (missing.length) throw new Error(`${name} app is missing styles: ${missing.join(", ")}`);
  console.log(`ok: ${name} app (${css.length} bytes of CSS)`);
}

rmSync(work, { recursive: true, force: true });
