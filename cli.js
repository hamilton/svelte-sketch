#!/usr/bin/env node

import yargs from "yargs";
import * as helpers from "yargs/helpers";
import path from "path";
import fs from "fs";
import * as snowpack from 'snowpack';
import tmp from "tmp";
import open from "open";
import { bold, gray, green } from 'kleur';
const metadata = require('./package.json');
import { mainJS, indexHTML, globalCSS, favicon } from "./assets.mjs";

import { fileURLToPath } from 'url';

const _titleLength = 99;

function shuffle(str) {
    let a = str.split("");
    let n =  a.length;

    for(let i = n - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

function space(str) {
    const spacer =  Array.from({length: ~~(Math.abs(_titleLength - str.length) / 2)}).fill(' ').join('');
    return `${spacer}${str}${spacer}`;
}

function repeat(str) {
    return Array.from({length: ~~((_titleLength + str.length) / (str.length))}).fill(str).join('').slice(0,_titleLength + 1);
}


//const CHAR = '◉ ◍ ◳ ◲ ◱ ◰ ◴ ◵ ◶ ◷ ◧ ◩ ◪ ◨ ◫ ◎ ● ';
const CHAR = '◳◲◱◰';
const UPPER = CHAR.split('').reverse().join("").trim();//shuffle(CHAR);
//const THIRD = '◴◵◶◷'
const THIRD = Math.random() > .5 ? 
    '▲△▴▵▶▷▸⍟▹►▻▼▽▾▿◀◁◂◃◄◅◸◹◺◿▮▭▬▯▰▱◍◭◮◦◊◈▢◎◕◔◓◒◑◐⇶' :
    '▁▂▃▄▅▆▇█';
//const THIRD = '▁▂▃▄▅▆▇█'
//const THIRD = '⏧'
//const THIRD = '▁▂▃▄▅▆▇█';
//const THIRD = '▖▗▘▙▚▛▜▝▞▟'
const FIRST = CHAR.slice(0,1);
const titleText = "PROTOSVELTE";

console.clear();
console.log();
console.log();
console.log();
console.log(gray(shuffle(repeat(THIRD))));
console.log(bold(repeat(UPPER)));
console.log();

console.log(space(`${titleText} ${metadata.version}`));
console.log();

console.log(bold(repeat(CHAR)));
console.log(gray(shuffle(repeat(THIRD))));
console.log();
console.log();

function createMount(root, site) {
    // get all css files and place them in site.
    const mountPoint = {
        [root]: "/dist",
        [site]: "/"
    };
    return mountPoint;
}

export async function cli(argv) {
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

    function setupTemporaryDir() {
        return tmp.dirSync({ mode: 0o777, prefix: 'protosvelte', unsafeCleanup: true });
    }

    function createFile(path, content) {
        fs.writeFileSync(path, content);
    }

    const fullPath = path.resolve(ENTRY);
    const componentName = getFilename(ENTRY);
    const rootDir = getDirectory(fullPath);
    const tempDir = setupTemporaryDir();
    const siteDir = tempDir.name;

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
        const _cssF = _cssPath.slice(-1);
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
    //const siteDir = `${__dirname}/_site`;

    // make the entry one way for both watch and compile modes.
    createFile(`${rootDir}/_entry.js`, mainJS(ENTRY));

    if (mode === 'watch' || mode === 'build') {
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
            mode: "development",
            mount: createMount(rootDir, siteDir),
            exclude: ['**/node_modules/**/*', "rollup.config.js"],
            plugins: [
                ['@snowpack/plugin-svelte']
            ],
            packageOptions: {
                "source": "remote",
                "cache": `${siteDir}`
            },
            devOptions: { 
                port: 8042,
                hmrPort: 8042,
                hmr: true
             },
            root: __dirname,
        });
        console.log(config);
        if (mode === 'watch') {
            open('http://localhost:8042');
            const server = await startServer({config});
            console.log('serve is active');
            //server.onFileChange()
        }
    }

    function byebye() {
        fs.unlinkSync(`${rootDir}/_entry.js`);
        tempDir.removeCallback();
        process.exit();
    }

    process.on("SIGINT", byebye);

}