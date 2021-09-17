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
import fancyHeader from "./fancy-header";

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

    const ENTRY = args.argv.component;
    const mode = args.argv._[0];

    if (mode === 'bundle') {
        console.error("bundle not implemented yet.");
        process.exit();
    }

    if (mode === 'watch' && mode === 'build') {
        console.error("must choose only one: watch or build");
        process.exit();
    }

    if (!ENTRY) {
        console.error("the entrypoint must be listed");
        process.exit();
    }

    fancyHeader();

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

    const fullPath = path.resolve(ENTRY);
    const componentName = getFilename(ENTRY);
    const rootDir = getDirectory(fullPath);
    const tempDirObj = setupTemporaryDir();
    const tempDir = tempDirObj.name;
    fs.mkdirSync(`${tempDir}/public`);

    const outOfRootToMainComponent = path.relative(tempDir, rootDir);

    console.log();
    console.log(
        gray(' ◳ ◲ ◱ ◰ '),
        "entrypoint",
        bold().underline().green(componentName),
        "from",
        green(`${fullPath.split('/').slice(0, -1).join('/')}/`)
    )
    
    if (args.argv.css) {
        const _cssPath = path.resolve(args.argv.css[0]).split("/");
        const _cssTo = _cssPath.slice(0, -1).join('/');
        const _cssF = _cssPath.slice(-1)[0];
        console.log(
            gray(" ◴ ◵ ◶ ◷ "),
            'stylesheet',
            bold().underline().green(_cssF),
            'from',
            green(_cssTo + "/")
        )
    }
    console.log(
        gray(' ◭ ◬ △ ◮ '),
        `Server root for repl`,
        green(tempDir)
    );
    console.log();
    console.log();
    console.log();
    
    createFile(`${tempDir}/public/_entry.js`, mainJS(`${rootDir}/${componentName}`));

    if (mode === 'watch' || mode === 'build') {
        let cssFile;
        if (args.argv.css) {
            [cssFile] = args.argv.css;
        }

        if (cssFile) {
            const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
            createFile(`${tempDir}/public/${getFilename(cssFile)}`, fileContents);
        } else {
            createFile(`${tempDir}/public/global.css`, globalCSS);
        }
        createFile(`${tempDir}/index.html`, indexHTML({
            css: cssFile ? getFilename(cssFile) : undefined,
            title: componentName
        }));

        createFile(`${tempDir}/public/favicon.svg`, favicon);

        const plugins = [svelte(), cdn("skypack")];
        
        const config = {
            mode: "development",
            root: tempDir,
            plugins,
            publicDir: `${tempDir}/public/`,
            server: {
                port: 8042
            },
        };

        console.log(
            gray(' ◭ ◬ △ ◮ '),
            `Project Root`,
            green(config.root)
        );
        
        if (mode === 'watch') {
            //open('http://localhost:8042');
            // @ts-ignore
            const server = await createServer({ configFile: false, ...config });
            await server.listen();
        } else if (mode === 'build') {
           console.log("Building is not quite supported yet. Check back in a future release.")
           console.log();
            //await build({ config });
        }
    }

    function byebye() {
        fs.unlinkSync(`${rootDir}/_entry.js`);
        tempDirObj.removeCallback();
        process.exit();
    }

    process.on("SIGINT", byebye);

}