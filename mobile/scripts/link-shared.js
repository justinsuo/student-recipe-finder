/**
 * Links the repo's shared code into node_modules so Metro can resolve it as
 * packages (it refuses relative imports that escape the project root):
 *   node_modules/@waivy/web    -> ../src        (the web app's shared logic)
 *   node_modules/@waivy/shared -> ../shared/src (kv/config facades, sync)
 * Runs on postinstall so the links survive `npm install`.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const scope = path.join(projectRoot, "node_modules", "@waivy");

fs.mkdirSync(scope, { recursive: true });

const links = [
  { name: "web", target: path.join(repoRoot, "src") },
  { name: "shared", target: path.join(repoRoot, "shared", "src") },
];

for (const { name, target } of links) {
  const linkPath = path.join(scope, name);
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath)) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    // not present yet
  }
  const rel = path.relative(scope, target);
  fs.symlinkSync(rel, linkPath, "dir");
  console.log(`linked @waivy/${name} -> ${rel}`);
}
