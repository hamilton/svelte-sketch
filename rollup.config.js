import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import childProcess from 'child_process';

const production = !process.env.ROLLUP_WATCH;
import fs from "fs";
import rimraf from "rimraf";
import { mainJS, indexHTML, globalCSS } from "./assets.js";

function makeDir(dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function createFile(path, content) {
    fs.writeFileSync(path, content);
}

// make public.
makeDir('_site');
makeDir('_site/bundle');
createFile('_site/index.html', indexHTML);
createFile('_site/global.css', globalCSS);
createFile('_entry.js', mainJS("./App.svelte"));

function serve() {
	let server;

	function toExit() {
		if (server) {
			console.log('remove!!');
			rimraf('_site');
            server.kill(0);
        }
	}

	return {
		writeBundle() {
			if (server) return;
			server = childProcess.spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: '_entry.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: '_site/build/bundle.js'
	},
	plugins: [
		svelte({
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('_site'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};