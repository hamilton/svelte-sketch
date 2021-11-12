#!/usr/bin/env node

import yargs from "yargs";
import path from "path";
import fs from "fs";
import tmp from "tmp";
import open from "open";
import { bold, gray, green } from "kleur";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import cdn from "./plugin-cdn";

import { watch } from "rollup";
import rollupSvelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

import { fileURLToPath } from "url";
import { createServer } from "vite";

import { mainJS, indexHTML, globalCSS, favicon } from "./assets";

export async function cli(argv) {
  // @ts-ignore
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const args = yargs(argv.slice(1))
    .command(
      "watch <component>",
      "watch component for changes and serve on 8080",
      {
        component: {
          type: "string",
        },
      }
    )
    .command("build <component>", "build component")
    .example("$0 watch ./C.svelte", "watch ExampleComponent.svelte")
    .example(
      "$0 watch ./C.svelte --css style.css",
      "add local style.css & watch"
    )
    .array("css")
    .option("css <stylesheets>", {
      type: "array",
      describe: "path(s) to global stylesheets to append to entrypoint",
    })
    .number("port")
    .option("port <portnumber>", {
      type: "array",
      describe: "port number (default 8080)",
    })
    .help();
  console.log(argv);
  const parsedOptions = args.argv;
  // @ts-ignore
  const entryComponent = parsedOptions.component;
  // @ts-ignore
  const mode = parsedOptions._[0];
  // @ts-ignore
  const port = parsedOptions.port || 8042;

  if (mode === "bundle") {
    console.error("bundle not implemented yet.");
    process.exit();
  }

  if (!(mode === "watch" || mode === "build")) {
    console.error("must choose only one: watch or build");
    process.exit();
  }

  if (!entryComponent) {
    console.error("the entrypoint must be listed");
    process.exit();
  }

  function getDirectory(file) {
    return file.split("/").slice(0, -1).join("/");
  }

  function getFilename(file) {
    return file.split("/").slice(-1)[0];
  }

  function setupTemporaryDir() {
    return tmp.dirSync({
      mode: 0o777,
      prefix: "protosvelte",
      unsafeCleanup: true,
    });
  }

  function createFile(path, content) {
    fs.writeFileSync(path, content);
  }

  const entryComponentPath = path.resolve(entryComponent);
  const entryComponentName = getFilename(entryComponent);
  const entryComponentDir = getDirectory(entryComponentPath);
  const tempDirObj = setupTemporaryDir();
  const tempDir = tempDirObj.name;

  const rootServerPath = (filename) => `${tempDir}/${filename}`;
  const staticAssetPath = (filename) => rootServerPath(`public/${filename}`);

  fs.mkdirSync(`${tempDir}/public`);

  console.log(green("Protosvelte"));

  console.log();
  console.log(
    "entrypoint",
    bold().underline().green(entryComponentName),
    "from",
    green(`${entryComponentDir}/`)
  );

  if (parsedOptions.css) {
    const _cssPath = path.resolve(parsedOptions.css[0]).split("/");
    const _cssTo = _cssPath.slice(0, -1).join("/");
    const _cssF = _cssPath.slice(-1)[0];
    console.log(
      "stylesheet",
      bold().underline().green(_cssF),
      "from",
      green(_cssTo + "/")
    );
  }
  console.log(gray(" ◭ ◬ △ ◮ "), `Server root for repl`, green(tempDir));
  console.log();
  console.log();
  createFile(staticAssetPath(`_entry.js`), mainJS(entryComponentPath));

  /** add all mentioned css files here. */
  if (mode === "watch" || mode === "build") {
    let cssFile;
    if (parsedOptions.css) {
      [cssFile] = parsedOptions.css;
    }

    if (cssFile) {
      const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
      createFile(staticAssetPath(getFilename(cssFile)), fileContents);
    } else {
      createFile(staticAssetPath("global.css"), globalCSS);
    }
    createFile(
      rootServerPath("index.html"),
      indexHTML({
        css: cssFile ? getFilename(cssFile) : undefined,
        title: entryComponentName,
      })
    );

    createFile(staticAssetPath("favicon.svg"), favicon);

    const plugins = [svelte(), cdn("skypack")];

    const config = {
      mode: mode === "watch" ? "development" : "production",
      root: tempDir,
      plugins,
      publicDir: rootServerPath("public/"),
      server: {
        port: port,
        fs: {
          allow: [entryComponentDir],
        },
      },
    };

    if (mode === "watch") {
      open(`http://localhost:${port}`);
      const server = await createServer(config);
      await server.listen();
    } else if (mode === "build") {
      const f = fs.readFileSync(staticAssetPath("_entry.js")).toString();
      console.log(commonjs, rollupSvelte, resolve);
      const bundle = await watch({
        input: staticAssetPath("_entry.js"),
        plugins: [rollupSvelte(), resolve({ browser: true }), commonjs()],
        onwarn: (msg) => {
          console.log();
          console.log(msg);
          console.log();
        },
      });
    }
  }

  function byebye() {
    tempDirObj.removeCallback();
    process.exit();
  }

  process.on("SIGINT", byebye);
}
