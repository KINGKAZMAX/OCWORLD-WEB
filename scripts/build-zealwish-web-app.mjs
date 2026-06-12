import { build } from "esbuild";
import { resolve } from "node:path";

const root = process.cwd();

await build({
  entryPoints: [resolve(root, "frontend-v4/src/v6/zealwish-web-app.jsx")],
  outfile: resolve(root, "frontend-v4/src/v6/zealwish-web-app.js"),
  bundle: true,
  format: "iife",
  globalName: "ZEALWISHWebAppBundle",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  tsconfigRaw: {
    compilerOptions: {
      jsx: "react",
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
    },
  },
});
