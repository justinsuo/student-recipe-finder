// babel-preset-expo (SDK 56) wires up Reanimated/Worklets automatically.
//
// The app shares the web app's business logic and the cross-platform glue
// instead of duplicating it. Those live outside the mobile project, so they are
// linked into node_modules as @waivy/web (-> ../src) and @waivy/shared
// (-> ../shared/src) — see scripts/link-shared.js (runs on postinstall). Metro
// only resolves shared code through node_modules (it refuses relative imports
// that escape the project root), so module-resolver rewrites our friendly
// aliases to those package names:
//   @/...       -> @waivy/web/...      (web app: recipes, engines, AI clients)
//   @shared/... -> @waivy/shared/...   (kv + config facades, sync engine)
//   ~/...       -> ./src/...           (this app's own code)
// The `@/...` imports *inside* the shared web files get rewritten the same way,
// so everything resolves consistently.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@shared": "@waivy/shared",
            "@": "@waivy/web",
            "~": "./src",
          },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
    ],
  };
};
