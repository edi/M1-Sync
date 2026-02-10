import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const bump = process.argv[2];
if (!["patch", "minor", "major", "rc"].includes(bump)) {
  console.error("Usage: pnpm release <patch|minor|major|rc>");
  process.exit(1);
}

// Read current version from tauri.conf.json (source of truth)
const tauriConf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf-8"));
const currentVersion = tauriConf.version;
const baseVersion = currentVersion.replace(/-rc\d+$/, "");
const [major, minor, patch] = baseVersion.split(".").map(Number);

let newVersion;
let tagVersion;

if (bump === "rc") {
  // If already on an RC, use the same base version; otherwise bump patch
  const isRC = /-rc\d+$/.test(currentVersion);
  const nextPatch = isRC ? baseVersion : `${major}.${minor}.${patch + 1}`;

  // Find existing RC tags for this version to determine the next RC number
  const existingTags = execSync(`git tag --list "v${nextPatch}-rc*"`, { encoding: "utf-8" }).trim();
  let rcNumber = 1;
  if (existingTags) {
    const rcNumbers = existingTags.split("\n").map(tag => {
      const match = tag.match(/-rc(\d+)$/);
      return match ? Number(match[1]) : 0;
    });
    rcNumber = Math.max(...rcNumbers) + 1;
  }

  newVersion = `${nextPatch}-rc${rcNumber}`;
  tagVersion = newVersion;
} else {
  newVersion =
    bump === "major" ? `${major + 1}.0.0` :
    bump === "minor" ? `${major}.${minor + 1}.0` :
    `${major}.${minor}.${patch + 1}`;
  tagVersion = newVersion;
}

console.log(`Bumping version: ${tauriConf.version} → ${newVersion}`);

// Update tauri.conf.json
tauriConf.version = newVersion;
writeFileSync("src-tauri/tauri.conf.json", JSON.stringify(tauriConf, null, 2) + "\n");

// Update package.json
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
pkg.version = newVersion;
writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

// Update Cargo.toml
const cargo = readFileSync("src-tauri/Cargo.toml", "utf-8");
writeFileSync("src-tauri/Cargo.toml", cargo.replace(/^version = ".*"$/m, `version = "${newVersion}"`));

// Update Cargo.lock
execSync("cargo generate-lockfile", { cwd: "src-tauri", stdio: "inherit" });

// Git commit, tag, and push
execSync(`git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock`, { stdio: "inherit" });
execSync(`git commit -m "release: v${tagVersion}"`, { stdio: "inherit" });
execSync(`git tag v${tagVersion}`, { stdio: "inherit" });
execSync(`git push && git push origin v${tagVersion}`, { stdio: "inherit" });

console.log(`\nReleased v${tagVersion} — GitHub Actions will build the release.`);
