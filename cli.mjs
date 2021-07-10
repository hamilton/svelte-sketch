#!/usr/bin/env node

import yargs from "yargs";
import * as helpers from "yargs/helpers";
import path from "path";
import fs from "fs";
import snowpack from 'snowpack';
import rimraf from "rimraf";
import { mainJS, indexHTML, globalCSS, favicon } from "./assets.mjs";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { createConfiguration, startServer, build } = snowpack;

const args = yargs(helpers.hideBin(process.argv))
    .command('watch <component>', 'watch component for changes and serve on 8080', {
        component: {
            type: 'string'
        }
    })
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

if (mode === 'watch' && mode === 'compile') {
    console.error("must choose only one: watch or compile");
    process.exit();
}

if (!ENTRY) {
    console.error("the entrypoint must be listed");
    process.exit();
}

function getDirectory(file) {
    return file.split('/').slice(0, -1).join('/');
}

function getFilename(file) {
    return file.split('/').slice(-1)[0];
}


function makeDir(dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function createFile(path, content) {
    fs.writeFileSync(path, content);
}

const fullPath = path.resolve(ENTRY);
const componentName = getFilename(ENTRY);
const rootDir = getDirectory(fullPath);
const siteDir = `${__dirname}/_site`;

function createMount() {
    // get all css files and place them in site.
    const mountPoint = {
        [rootDir]: "/dist",
        [siteDir]: "/"
    };
    return mountPoint;
}

// make the entry one way for both watch and compile modes.
createFile(`${rootDir}/_entry.js`, mainJS(ENTRY));

if (mode === 'watch' || mode === 'build') {
    makeDir(siteDir);
    makeDir(`${siteDir}/bundle`);
    // get css files and put them into site.
    let cssFile;
    if (args.argv.css) {
        [cssFile] = args.argv.css;
    }

    if (cssFile) {
        const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
        createFile(`${siteDir}/${getFilename(cssFile)}`, fileContents);
    } else {
        createFile(`${siteDir}/global.css`, globalCSS);
    }
    createFile(`${siteDir}/index.html`, indexHTML({
        css: cssFile ? getFilename(cssFile) : undefined,
        title: componentName
    }));

    createFile(`${siteDir}/favicon.svg`, favicon);


    const config = createConfiguration({
        mount: createMount(),
        exclude: ['**/node_modules/**/*', "rollup.config.js"],
        plugins: [
            '@snowpack/plugin-svelte'
        ],
        packageOptions: {
            "source": "remote",
        },
        root: __dirname,
    });
    if (mode === 'watch') {
        const server = await startServer({config});
    }
}

function byebye() {
    rimraf.sync("_site");
    fs.unlinkSync(`${rootDir}/_entry.js`);
    process.exit();
}

process.on("SIGINT", byebye);
