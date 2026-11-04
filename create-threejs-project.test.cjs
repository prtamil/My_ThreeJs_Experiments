"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Deliberately omit .js to verify the user's requested command works.
const script = path.join(__dirname, "create-threejs-project");
const template = path.join(__dirname, "Frameworks_and_Engines", "FrameWork_Template_Vite_00");

function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "threejs-generator-test-"));
  t.after(() => {
    // Only recursively remove the specific temporary folder created by this test.
    const relative = path.relative(os.tmpdir(), root);
    assert.ok(!path.isAbsolute(relative) && /^threejs-generator-test-[^\\/]+$/.test(relative));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

function run(cwd, args, options = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd, encoding: "utf8", timeout: 20000, ...options,
  });
}

function success(result) {
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
}

test("help displays usage without creating a project", (t) => {
  const root = sandbox(t);
  const result = run(root, ["--help"]);
  success(result);
  assert.match(result.stdout, /--skip-install/);
  assert.deepEqual(fs.readdirSync(root), []);
});

test("copies into cwd, renames package metadata, and preserves template files", (t) => {
  const root = sandbox(t);
  const originalManifest = fs.readFileSync(path.join(template, "package.json"), "utf8");
  const originalLock = fs.readFileSync(path.join(template, "package-lock.json"), "utf8");
  success(run(root, ["My-Scene", "--skip-install"]));
  const project = path.join(root, "My-Scene");
  const manifest = JSON.parse(fs.readFileSync(path.join(project, "package.json")));
  const lock = JSON.parse(fs.readFileSync(path.join(project, "package-lock.json")));
  assert.equal(manifest.name, "my-scene");
  assert.equal(lock.name, "my-scene");
  assert.equal(lock.packages[""].name, "my-scene");
  function checkFiles(source, target) {
    for (const item of fs.readdirSync(source, { withFileTypes: true })) {
      if ([".git", "node_modules", "dist", ".vite"].includes(item.name)) {
        assert.equal(fs.existsSync(path.join(target, item.name)), false);
      } else if (item.isDirectory()) {
        checkFiles(path.join(source, item.name), path.join(target, item.name));
      } else if (!["package.json", "package-lock.json"].includes(item.name)) {
        assert.deepEqual(fs.readFileSync(path.join(target, item.name)), fs.readFileSync(path.join(source, item.name)));
      }
    }
  }
  checkFiles(template, project);
  assert.equal(fs.readFileSync(path.join(template, "package.json"), "utf8"), originalManifest);
  assert.equal(fs.readFileSync(path.join(template, "package-lock.json"), "utf8"), originalLock);
});

test("supports positional targets and --target, including spaces and missing parents", (t) => {
  const root = sandbox(t);
  success(run(root, ["first", "target with spaces", "--skip-install"]));
  success(run(root, ["second", "--target", path.join(root, "new", "nested"), "--skip-install"]));
  assert.ok(fs.existsSync(path.join(root, "target with spaces", "first", "src", "index.js")));
  assert.ok(fs.existsSync(path.join(root, "new", "nested", "second", "src", "index.js")));
});

test("prompts for a project name when it is omitted", (t) => {
  const root = sandbox(t);
  const result = run(root, ["--skip-install"], { input: "prompted-scene\n" });
  success(result);
  assert.match(result.stdout, /Project name:/);
  assert.ok(fs.existsSync(path.join(root, "prompted-scene", "package.json")));
});

test("rejects invalid names and arguments before writing project files", (t) => {
  const root = sandbox(t);
  for (const args of [
    ["../escape"], ["CON"], ["trailing."], ["bad name"],
    ["scene", "one", "two"], ["scene", "one", "--target", "two"],
    ["scene", "--unknown"],
  ]) {
    const result = run(root, [...args, "--skip-install"]);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /Error:/);
  }
  assert.deepEqual(fs.readdirSync(root), []);
});

test("refuses to overwrite either a file or an existing directory", (t) => {
  const root = sandbox(t);
  fs.mkdirSync(path.join(root, "existing"));
  fs.writeFileSync(path.join(root, "existing", "keep.txt"), "keep");
  fs.writeFileSync(path.join(root, "file"), "keep");
  for (const name of ["existing", "file"]) {
    const result = run(root, [name, "--skip-install"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Destination already exists/);
  }
  assert.deepEqual(fs.readdirSync(path.join(root, "existing")), ["keep.txt"]);
  assert.equal(fs.readFileSync(path.join(root, "file"), "utf8"), "keep");
});

test("rejects destinations within the template", (t) => {
  const root = sandbox(t);
  const result = run(root, ["should-not-exist", "--target", template, "--skip-install"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /outside the template/);
  assert.equal(fs.existsSync(path.join(template, "should-not-exist")), false);
});

for (const exitCode of [0, 7]) {
  test(`runs npm install by default and handles exit code ${exitCode}`, (t) => {
    const root = sandbox(t);
    const bin = path.join(root, "bin");
    fs.mkdirSync(bin);
    const windows = process.platform === "win32";
    fs.writeFileSync(path.join(bin, windows ? "npm.cmd" : "npm"), windows
      ? `@echo off\r\necho %* > install-arguments.txt\r\nexit /b ${exitCode}\r\n`
      : `#!/bin/sh\nprintf '%s' "$*" > install-arguments.txt\nexit ${exitCode}\n`, { mode: 0o755 });
    // A local npm stub exercises installation without network access or downloads.
    const env = { ...process.env };
    const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
    env[pathKey] = `${bin}${path.delimiter}${env[pathKey] || ""}`;
    const result = run(root, ["installed-scene"], { env });
    assert.equal(result.status, exitCode === 0 ? 0 : 1, result.stderr);
    const project = path.join(root, "installed-scene");
    assert.equal(fs.readFileSync(path.join(project, "install-arguments.txt"), "utf8").trim(), "install");
    assert.ok(fs.existsSync(path.join(project, "src", "index.js")));
    if (exitCode) assert.match(result.stderr, /npm install failed.*Run npm install/);
    else assert.match(result.stdout, /installed dependencies/);
  });
}
