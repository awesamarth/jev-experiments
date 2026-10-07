import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "extensions/feed-referee");
const manifest = JSON.parse(await readFile(join(source, "manifest.json"), "utf8"));
if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(manifest.version)) {
  throw new Error("Invalid extension manifest version");
}

// Explicit allowlist: never recursively zip a workspace or browser profile.
const files = [
  "manifest.json",
  "core.js",
  "ai-style.js",
  "worker.js",
  "content.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "privacy.html",
].sort();

const manifestFiles: string[] = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  ...manifest.content_scripts.flatMap((script: { js: string[]; css?: string[] }) => [...script.js, ...(script.css ?? [])]),
  ...Object.values<string>(manifest.icons ?? {}),
  ...Object.values<string>(manifest.action.default_icon ?? {}),
];
for (const file of manifestFiles) {
  if (!files.includes(file)) throw new Error(`Manifest references unpackaged file: ${file}`);
}
for (const file of files) {
  if (!(await lstat(join(source, file))).isFile()) {
    throw new Error(`Expected a regular runtime file, not a link or directory: ${file}`);
  }
}

const outputDirectory = join(root, "dist");
const filename = `feed-referee-v${manifest.version}.zip`;
const archive = join(outputDirectory, filename);
const staging = await mkdtemp(join(tmpdir(), "feed-referee-release-"));
try {
  const folder = join(staging, "feed-referee");
  await mkdir(folder);
  for (const file of files) await copyFile(join(source, file), join(folder, file));
  // Build a new archive so removed files cannot survive from an older package.
  const temporaryArchive = join(staging, filename);
  execFileSync("zip", ["-X", "-q", temporaryArchive, ...files.map((file) => `feed-referee/${file}`)], { cwd: staging });
  const bytes = await readFile(temporaryArchive);
  const digest = createHash("sha256").update(bytes).digest("hex");
  await mkdir(outputDirectory, { recursive: true });
  await copyFile(temporaryArchive, archive);
  await writeFile(`${archive}.sha256`, `${digest}  ${filename}\n`);
  console.log(`Packaged ${files.length} runtime files (${bytes.length.toLocaleString()} bytes)`);
  console.log(archive);
  console.log(`${archive}.sha256`);
  console.log("Local artifacts only. Nothing tagged, pushed, or published.");
} finally {
  await rm(staging, { recursive: true, force: true });
}
