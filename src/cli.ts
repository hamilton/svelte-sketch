#!/usr/bin/env node

// @ts-ignore
import yargs from "yargs";
// @ts-ignore
import * as helpers from "yargs/helpers";
import path from "path";
import fs from "fs";
import * as snowpack from 'snowpack';
import tmp from "tmp";
import open from "open";
import { bold, gray, green } from 'kleur';

import { svelte } from '@sveltejs/vite-plugin-svelte';
// @ts-ignore
import resolveRemoteDependencies from "./plugin";

import { fileURLToPath } from 'url';
import { createServer } from "vite";

import { mainJS, indexHTML, globalCSS, favicon } from "./assets";
import fancyHeader from "./fancy-header";


function createMount(root:string, site:string) {
    // get all css files and place them in site.
    const mountPoint = {
        [root]: "/dist",
        [site]: "/"
    };
    return mountPoint;
}

export async function cli(argv:object) {
    // @ts-ignore
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const { createConfiguration, startServer, build } = snowpack;

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
    const tempDir = setupTemporaryDir();
    const siteDir = tempDir.name;
    fs.mkdirSync(`${siteDir}/public`);

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
        green(tempDir.name)
    );
    console.log();
    console.log();
    console.log();

    console.log(ENTRY)
    // make the entry one way for both watch and compile modes.
    //createFile(`${siteDir}/public/_entry.js`, mainJS(ENTRY));
    createFile(`${siteDir}/public/_entry.js`, mainJS(`${rootDir}/${ENTRY}`));

    if (mode === 'watch' || mode === 'build') {
        let cssFile;
        if (args.argv.css) {
            [cssFile] = args.argv.css;
        }

        if (cssFile) {
            const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
            createFile(`${siteDir}/public/${getFilename(cssFile)}`, fileContents);
        } else {
            createFile(`${siteDir}/public/global.css`, globalCSS);
        }
        createFile(`${siteDir}/index.html`, indexHTML({
            css: cssFile ? getFilename(cssFile) : undefined,
            title: componentName
        }));

        createFile(`${siteDir}/public/favicon.svg`, favicon);

        /**
         * Create the configuration file.
        */


        const plugins = [resolveRemoteDependencies(), svelte()];

        // const plugins = [['@snowpack/plugin-svelte']];
        // if (mode === 'build') {
        //     plugins.push(['@snowpack/plugin-webpack']);
        // }


        // const config = createConfiguration({
        //     mode: mode === "watch" ? "development" : "production",
        //     mount: createMount(rootDir, siteDir),
        //     exclude: ['**/node_modules/**/*', "rollup.config.js"],
        //     // @ts-ignore
        //     plugins,
        //     packageOptions: {
        //         "source": "remote",
        //         "cache": `${siteDir}`
        //     },
        //     devOptions: { 
        //         port: 8042,
        //         hmrPort: 8042,
        //         hmr: true,
        //      },
        //      buildOptions:{
        //         out: `${rootDir}/_build/`
        //      },
        //      optimize: {
        //          bundle: true
        //      },
        //     root: __dirname,
        // });
        
        const config = {
            mode: "development",
            root: siteDir,
            plugins,
            publicDir: `${siteDir}/public/`,
            server: {
                port: 8042
            }
        };

        console.log(
            gray(' ◭ ◬ △ ◮ '),
            `Project Root`,
            green(config.root)
        );
        
        if (mode === 'watch') {
            //open('http://localhost:8042');
            const server = await createServer({ configFile: false, ...config });
            await server.listen();
        } else if (mode === 'build') {
            /* 
                What would building look like?
                I'm actually not 100% sure, but I think it would probably look like this:
                - entry would be the _entry.js file.
                - output would be a _build directory that had
                - index.html, global.css, any other stylesheets, and a build dir
                    - build would contain the final javascript thing.
                If I could get a list of remote dependencies and just, I don't know,
                npm install them, then I'm good I think. We could make a whole
                npm project.
            */
           //throw new Error("Building is not quite supported yet. Check back in a future release.")
           console.log("Building is not quite supported yet. Check back in a future release.")
           console.log();
            //await build({ config });
        }
    }

    function byebye() {
        fs.unlinkSync(`${rootDir}/_entry.js`);
        tempDir.removeCallback();
        process.exit();
    }

    process.on("SIGINT", byebye);

}