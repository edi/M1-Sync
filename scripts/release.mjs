import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const bump = process.argv[2];
if (!["patch", "minor", "major"].includes(bump)) {
  console.error("Usage: pnpm release <patch|minor|major>");
  process.exit(1);
}

// Read current version from tauri.conf.json (source of truth)
const tauriConf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf-8"));
const [major, minor, patch] = tauriConf.version.split(".").map(Number);

const newVersion =
  bump === "major" ? `${major + 1}.0.0` :
  bump === "minor" ? `${major}.${minor + 1}.0` :
  `${major}.${minor}.${patch + 1}`;

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
execSync(`git commit -m "release: v${newVersion}"`, { stdio: "inherit" });
execSync(`git tag v${newVersion}`, { stdio: "inherit" });
execSync(`git push && git push origin v${newVersion}`, { stdio: "inherit" });

console.log(`\nReleased v${newVersion} — GitHub Actions will build the release.`);
