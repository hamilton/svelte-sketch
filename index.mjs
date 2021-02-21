#!/usr/bin/env node

import yargs from "yargs";
import * as helpers from "yargs/helpers";
import path from "path";
import fs from "fs";
import snowpack from 'snowpack';
import rimraf from "rimraf";
import { mainJS, indexHTML, globalCSS } from "./assets.mjs";

const { createConfiguration, startServer } = snowpack;

const args = yargs(helpers.hideBin(process.argv));
// gather any css files in args.argv

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

const ENTRY = "../gtest/App.svelte";

const fullPath = path.resolve(ENTRY);
const componentName = getFilename(ENTRY);
const rootDir = getDirectory(fullPath);



makeDir('_site');
makeDir('_site/bundle');
// get css files and put them into site.
const cssFile = args.argv.css;
if (cssFile) {
    const fileContents = fs.readFileSync(path.resolve(cssFile)).toString();
    createFile(`_site/${getFilename(cssFile)}`, fileContents);
} else {
    createFile('_site/global.css', globalCSS);
}
createFile('_site/index.html', indexHTML({
    css: cssFile ? getFilename(cssFile) : undefined,
    title: componentName
}));

createFile(`${rootDir}/_entry.js`, mainJS(ENTRY));

function createMount() {
    // get all css files and place them in site.
    const mountPoint = {
        [rootDir]: "/dist",
        _site: "/"
    };
    return mountPoint;
}

const config = createConfiguration({
    mount: createMount(),
    exclude: ['**/node_modules/**/*', "rollup.config.js", 'sp.js'],
    plugins: [
        '@snowpack/plugin-svelte'
    ],
    "packageOptions": {
        "source": "remote"
      }
});

const server = await startServer({config});
const {contents} = server.loadUrl('/dist/_entry.js');
console.log(contents);

function bye() {
    rimraf.sync("_site");
    fs.unlinkSync(`${rootDir}/_entry.js`);
    process.exit();
}

process.on("SIGINT", bye);
