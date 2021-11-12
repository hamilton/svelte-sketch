#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const yargs_1 = __importDefault(require("yargs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tmp_1 = __importDefault(require("tmp"));
const open_1 = __importDefault(require("open"));
const kleur_1 = require("kleur");
const vite_plugin_svelte_1 = require("@sveltejs/vite-plugin-svelte");
const plugin_cdn_1 = __importDefault(require("./plugin-cdn"));
const rollup_1 = require("rollup");
const rollup_plugin_svelte_1 = __importDefault(require("rollup-plugin-svelte"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const url_1 = require("url");
const vite_1 = require("vite");
const assets_1 = require("./assets");
async function cli(argv) {
    // @ts-ignore
    const __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
    const args = (0, yargs_1.default)(process.argv.slice(1))
        .command('watch <component>', 'watch component for changes and serve on 8080', {
        component: {
            type: 'string'
        }
    })
        .command('build <component>', 'build component')
        .example('$0 watch ./C.svelte', 'watch ExampleComponent.svelte')
        .example('$0 watch ./C.svelte --css style.css', 'add local style.css & watch')
        .array("css")
        .option("css <stylesheets>", { type: "array", describe: "path(s) to global stylesheets to append to entrypoint" })
        .number("port")
        .option("port <portnumber>", { type: "array", describe: "port number (default 8080)" })
        .help();
    const parsedOptions = args.argv;
    // @ts-ignore
    const entryComponent = parsedOptions.component;
    // @ts-ignore
    const mode = parsedOptions._[0];
    // @ts-ignore
    const port = parsedOptions.port || 8042;
    if (mode === 'bundle') {
        console.error("bundle not implemented yet.");
        process.exit();
    }
    if (!(mode === 'watch' || mode === 'build')) {
        console.error("must choose only one: watch or build");
        process.exit();
    }
    if (!entryComponent) {
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
        return tmp_1.default.dirSync({ mode: 0o777, prefix: 'protosvelte', unsafeCleanup: true });
    }
    function createFile(path, content) {
        fs_1.default.writeFileSync(path, content);
    }
    const entryComponentPath = path_1.default.resolve(entryComponent);
    const entryComponentName = getFilename(entryComponent);
    const entryComponentDir = getDirectory(entryComponentPath);
    const tempDirObj = setupTemporaryDir();
    const tempDir = tempDirObj.name;
    const rootServerPath = (filename) => `${tempDir}/${filename}`;
    const staticAssetPath = (filename) => rootServerPath(`public/${filename}`);
    fs_1.default.mkdirSync(`${tempDir}/public`);
    console.log((0, kleur_1.green)("Protosvelte"));
    console.log();
    console.log("entrypoint", (0, kleur_1.bold)().underline().green(entryComponentName), "from", (0, kleur_1.green)(`${entryComponentDir}/`));
    if (parsedOptions.css) {
        const _cssPath = path_1.default.resolve(parsedOptions.css[0]).split("/");
        const _cssTo = _cssPath.slice(0, -1).join('/');
        const _cssF = _cssPath.slice(-1)[0];
        console.log('stylesheet', (0, kleur_1.bold)().underline().green(_cssF), 'from', (0, kleur_1.green)(_cssTo + "/"));
    }
    console.log((0, kleur_1.gray)(' ◭ ◬ △ ◮ '), `Server root for repl`, (0, kleur_1.green)(tempDir));
    console.log();
    console.log();
    createFile(staticAssetPath(`_entry.js`), (0, assets_1.mainJS)(entryComponentPath));
    /** add all mentioned css files here. */
    if (mode === 'watch' || mode === 'build') {
        let cssFile;
        if (parsedOptions.css) {
            [cssFile] = parsedOptions.css;
        }
        if (cssFile) {
            const fileContents = fs_1.default.readFileSync(path_1.default.resolve(cssFile)).toString();
            createFile(staticAssetPath(getFilename(cssFile)), fileContents);
        }
        else {
            createFile(staticAssetPath("global.css"), assets_1.globalCSS);
        }
        createFile(rootServerPath('index.html'), (0, assets_1.indexHTML)({
            css: cssFile ? getFilename(cssFile) : undefined,
            title: entryComponentName
        }));
        createFile(staticAssetPath("favicon.svg"), assets_1.favicon);
        const plugins = [(0, vite_plugin_svelte_1.svelte)(), (0, plugin_cdn_1.default)("skypack")];
        const config = {
            mode: mode === 'watch' ? "development" : "production",
            root: tempDir,
            plugins,
            publicDir: rootServerPath('public/'),
            server: {
                port: port,
                fs: {
                    allow: [entryComponentDir]
                }
            }
        };
        if (mode === 'watch') {
            (0, open_1.default)(`http://localhost:${port}`);
            const server = await (0, vite_1.createServer)(config);
            await server.listen();
        }
        else if (mode === 'build') {
            const f = fs_1.default.readFileSync(staticAssetPath("_entry.js")).toString();
            console.log(plugin_commonjs_1.default, rollup_plugin_svelte_1.default, plugin_node_resolve_1.default);
            const bundle = await (0, rollup_1.watch)({
                input: staticAssetPath("_entry.js"),
                plugins: [
                    (0, rollup_plugin_svelte_1.default)(),
                    (0, plugin_node_resolve_1.default)({ browser: true }),
                    (0, plugin_commonjs_1.default)(),
                ],
                onwarn: (msg) => {
                    console.log();
                    console.log(msg);
                    console.log();
                }
            });
        }
    }
    function byebye() {
        tempDirObj.removeCallback();
        process.exit();
    }
    process.on("SIGINT", byebye);
}
exports.cli = cli;
