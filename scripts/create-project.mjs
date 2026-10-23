#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const templateDirectory = fileURLToPath(new URL("../templates/web-vite/", import.meta.url));
const arguments_ = process.argv.slice(2);
const noInstall = arguments_.includes("--no-install");
const targetArgument = arguments_.find((argument) => !argument.startsWith("-"));

if (arguments_.includes("--help") || arguments_.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (!targetArgument) {
  printUsage();
  process.exit(1);
}

const targetDirectory = resolve(targetArgument);
const projectName = normalizeProjectName(basename(targetDirectory));
const parentDirectory = dirname(targetDirectory);

if (!projectName) {
  console.error("Choose a project directory with a name that can become a package name.");
  process.exit(1);
}

await mkdir(parentDirectory, { recursive: true });
try {
  const contents = await readdir(targetDirectory);
  if (contents.length > 0) {
    console.error(`Refusing to write into a non-empty directory: ${targetDirectory}`);
    process.exit(1);
  }
} catch (error) {
  if (!isMissingPath(error)) throw error;
}

await mkdir(targetDirectory, { recursive: true });
await cp(templateDirectory, targetDirectory, { recursive: true });

const packageJsonPath = resolve(targetDirectory, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
packageJson.name = projectName;
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Created ${projectName} at ${targetDirectory}`);

if (!noInstall) {
  console.log("Installing dependencies with pnpm…");
  const install = spawnSync("pnpm", ["install"], { cwd: targetDirectory, stdio: "inherit" });
  if (install.error || install.status !== 0) {
    console.error("The project files are ready, but dependency installation failed.");
    console.error("Run `pnpm install` in the new project directory to retry.");
    process.exit(install.status ?? 1);
  }
}

console.log(`\nNext: cd ${targetArgument} && pnpm dev`);

function printUsage() {
  console.log(`Usage: create-ponti-project <directory> [--no-install]

Creates a React + Vite web project wired to @ponti-studios/ui.
Dependencies are installed with pnpm unless --no-install is supplied.`);
}

function normalizeProjectName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/-+$/, "");
}

function isMissingPath(error) {
  return error && typeof error === "object" && "code" in error && error.code === "ENOENT";
}
