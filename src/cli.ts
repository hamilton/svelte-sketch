#!/usr/bin/env node

// @ts-ignore
import yargs from "yargs";
// @ts-ignore
import * as helpers from "yargs/helpers";
import path from "path";
import fs from "fs";
import tmp from "tmp";
import open from "open";
import { bold, gray, green } from 'kleur';

import { svelte } from '@sveltejs/vite-plugin-svelte';
// @ts-ignore
import cdn from './plugin-cdn';

import { fileURLToPath } from 'url';
import { createServer } from "vite";

import { mainJS, indexHTML, globalCSS, favicon } from "./assets";

export async function cli(argv:object) {
    // @ts-ignore
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const args = yargs(helpers.hideBin(argv))
        .command('watch <component>', 'watch component for changes and serve on 8080', {
            component: {
                type: 'string'
            }
        })
        .command('build <component>', 'build component')
        .example('$0 watch ./C.svelte', 'watch ExampleComponent.svelte')
        .example('$0 watch ./C.svelte --css style.css', 'add local style.css & watch')
        .array("css")
        .option("css <stylesheets>", {type: "array", describe: "path(s) to global stylesheets to append to entrypoint"})
        .help();

    const entryComponent = args.argv.component;
    const mode = args.argv._[0];

    if (mode === 'bundle') {
        console.error("bundle not implemented yet.");
        process.exit();
    }

    if (mode === 'watch' && mode === 'build') {
        console.error("must choose only one: watch or build");
        process.exit();
    }

    if (!entryComponent) {
        console.error("the entrypoint must be listed");
        process.exit();
    }

    function getDirectory(file:string) {
        return file.split('/').slice(0, -1).join('/');
    }

    function getFilename(file:string) {
        return file.split('/').slice(-1)[0];
    }

    function setupTemporaryDir() {
        return tmp.dirSync({ mode: 0o777, prefix: 'protosvelte', unsafeCleanup: true });
    }

    function createFile(path:string, content:string) {
        fs.writeFileSync(path, content);
    }

    // resolve?
    const entryComponentPath = path.resolve(entryComponent);
    const entryComponentName = getFilename(entryComponent);
    const entryComponentDir = getDirectory(entryComponentPath);
    const tempDirObj = setupTemporaryDir();
    const tempDir = tempDirObj.name;

    const rootServerPath = (filename:string) => `${tempDir}/${filename}`;
    const staticAssetPath = (filename:string) => rootServerPath(`public/${filename}`);
    
    fs.mkdirSync(`${tempDir}/public`);

    console.log(green("Skit"));

    console.log();
    console.log(
        "entrypoint",
        bold().underline().green(entryComponentName),
        "from",
        green(`${entryComponentDir}/`)
    );
    
    if (args.argv.css) {
        const _cssPath = path.resolve(args.argv.css[0]).split("/");
        const _cssTo = _cssPath.slice(0, -1).join('/');
        const _cssF = _cssPath.slice(-1)[0];
        console.log(
            'stylesheet',
            bold().underline().green(_cssF),
            'from',
            green(_cssTo + "/")
        );
    }
    console.log(
        gray(' ◭ ◬ △ ◮ '),
        `Server root for repl`,
        green(tempDir)
    );
    console.log();
    console.log();
    createFile(staticAssetPath(`_entry.js`), mainJS(entryComponentPath));

    /** add all mentioned css files here. */
    if (mode === 'watch' || mode === 'build') {
        let cssFile;
        if (args.argv.css) {
            [cssFile] = args.argv.css;
        }

        if (cssFile) {
            const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
            createFile(staticAssetPath(getFilename(cssFile)), fileContents);
        } else {
            createFile(staticAssetPath("global.css"), globalCSS);
        }
        createFile(rootServerPath('index.html'), indexHTML({
            css: cssFile ? getFilename(cssFile) : undefined,
            title: entryComponentName
        }));

        createFile(staticAssetPath("favicon.svg"), favicon);

        const plugins:any[] = [svelte(), cdn("skypack")];
        
        const config = {
            mode: mode === 'watch' ? "development" : "production",
            root: tempDir,
            plugins,
            publicDir: rootServerPath('public/'),
            server: {
                port: 8042,
                fs: {
                    allow: [entryComponentDir]
                  }
            }
        };
        
        if (mode === 'watch') {
            open('http://localhost:8042');
            const server = await createServer(config);
            await server.listen();
        } else if (mode === 'build') {
            console.log();
            console.log("Building is not yet supported. Check back soon!");
            console.log();
        }
    }

    function byebye() {
        fs.unlinkSync(`${entryComponentDir}/_entry.js`);
        tempDirObj.removeCallback();
        process.exit();
    }

    process.on("SIGINT", byebye);

}