#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { parseArgs } = require("node:util");
const { createInterface } = require("node:readline/promises");
const { spawnSync } = require("node:child_process");

// Resolve from this script so it also works when invoked from another directory.
const template = path.join(
  __dirname,
  "Frameworks_and_Engines",
  "FrameWork_Template_Vite_00",
);
const excluded = new Set([".git", "node_modules", "dist", ".vite"]);

const help = `Create a Three.js project from FrameWork_Template_Vite_00.

Usage:
  node create-threejs-project [project-name] [target-folder] [options]

Examples (run from this repository):
  node create-threejs-project
  node create-threejs-project my-scene
  node create-threejs-project my-scene "C:\\Projects"
  node create-threejs-project my-scene --target ./Tutorials
  node create-threejs-project my-scene --skip-install

Options:
  -t, --target <folder>  Parent folder for the project (default: current folder)
      --skip-install     Copy the template without running npm install
  -h, --help             Show this help

If project-name is omitted, you will be prompted for it.
The result is <target-folder>/<project-name>. Existing folders are never replaced.
Dependencies are installed by default. Requires Node.js and npm on PATH.
Use an absolute path to this script when running from another directory.
`;

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) &&
    relative !== ".." && !path.isAbsolute(relative));
}

async function renamePackage(project, name) {
  const packageFile = path.join(project, "package.json");
  const manifest = JSON.parse(await fs.readFile(packageFile, "utf8"));
  manifest.name = name.toLowerCase();
  await fs.writeFile(packageFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const lockFile = path.join(project, "package-lock.json");
  let lock;
  try {
    lock = JSON.parse(await fs.readFile(lockFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  lock.name = manifest.name;
  if (lock.packages?.[""]) lock.packages[""].name = manifest.name;
  await fs.writeFile(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      target: { type: "string", short: "t" },
      "skip-install": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    console.log(help);
    return;
  }
  if (positionals.length > 2 || (positionals[1] && values.target !== undefined)) {
    throw new Error("Use project-name and one target folder. Run with --help for usage.");
  }

  let name = positionals[0];
  if (!name) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    try {
      name = (await prompt.question("Project name: ")).trim();
    } finally {
      prompt.close();
    }
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,213}$/.test(name) ||
      name.endsWith(".") || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
    throw new Error("Project name must start with a letter or number and use only letters, numbers, dots, underscores, or hyphens (maximum 214 characters; no trailing dot or Windows reserved names).");
  }

  const parent = path.resolve(values.target ?? positionals[1] ?? process.cwd());
  const destination = path.join(parent, name);
  const source = await fs.realpath(template);
  if (isWithin(source, destination)) {
    throw new Error("Choose a target outside the template folder.");
  }
  await fs.mkdir(parent, { recursive: true });
  if (isWithin(source, await fs.realpath(parent))) {
    throw new Error("Choose a target outside the template folder.");
  }
  try {
    await fs.mkdir(destination);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error(`Destination already exists: ${destination}. Choose another project name or target.`);
    }
    throw error;
  }

  console.log(`Copying template to ${destination}`);
  await fs.cp(source, destination, {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter: (file) => file === source || !excluded.has(path.basename(file)),
  });
  await renamePackage(destination, name);

  if (!values["skip-install"]) {
    console.log("Installing dependencies...");
    // Only a fixed command is sent to cmd.exe; user paths go through cwd.
    const result = process.platform === "win32"
      ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm install"], {
        cwd: destination, stdio: "inherit",
      })
      : spawnSync("npm", ["install"], { cwd: destination, stdio: "inherit" });
    if (result.error || result.status !== 0) {
      throw new Error(`Project copied to ${destination}, but npm install failed${result.error ? `: ${result.error.message}` : ""}. Run npm install in that folder to retry.`);
    }
  }

  console.log(`\nCreated ${name}${values["skip-install"] ? "" : " and installed dependencies"}.\n`);
  console.log(`  cd "${destination}"`);
  if (values["skip-install"]) console.log("  npm install");
  console.log("  npm run dev");
  console.log("\nStart coding in src/index.js and src/World/World.js.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
