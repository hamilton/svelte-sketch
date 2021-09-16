import { VERSION } from "svelte/compiler";
import fetch from "node-fetch";
import fs from "fs";

// import { compile } from "svelte/compile";

// let cached = {
// 	dom: {},
// 	ssr: {}
// };

export let packagesUrl = "https://cdn.skypack.dev/";
export let svelteUrl = `${packagesUrl}/svelte`;
let current_id = 0;

let cached = {
	dom: {},
	ssr: {}
};

const ABORT = { aborted: true };

const fetch_cache = new Map();
function fetch_if_uncached(url) {
	if (fetch_cache.has(url)) {
		console.log("		> Fetch Cache < ", url);

		return fetch_cache.get(url);
	}
	// if it starts with /, let's go for it?
	let promise;
	if (url[0] === '/') {
		promise = new Promise(resolve => {
			const body = fs.readFileSync(url).toString();
			resolve({
				url, body
			})
		})
	} else {
		promise = fetch(url)
		.then(async r => {
			if (r.ok) {
				return {
					url: r.url,
					body: await r.text()
				};
			}
			throw new Error(await r.text());
		})
		.catch(err => {
			fetch_cache.delete(url);
			throw err;
		});
	}
	
	fetch_cache.set(url, promise);
	return promise;
}

async function follow_redirects(url) {
	const res = await fetch_if_uncached(url);
	return res.url;
}

function compare_to_version(major, minor, patch) {
	console.log(VERSION)
	const v = VERSION.match(/^(\d+)\.(\d+)\.(\d+)/);
	return (v[1] - major) || (v[2] - minor) || (v[3] - patch);
}

function is_legacy_package_structure() {
	return compare_to_version(3, 4, 4) <= 0;
}

function has_loopGuardTimeout_feature() {
	return compare_to_version(3, 14, 0) >= 0;
}
const lookup = {};

export default function plugin() {
	return {
		name: "skit-plugin",
		async resolveId(importee, importer) {

			// const resolution = await this.resolve(source, undefined, { skipSelf: true });
			// // If it cannot be resolved, return `null` so that Rollup displays an error
			// if (!resolution) return null;
			// return `${resolution.id}?entry-proxy`;

			// what am I supposed to do here, exactly?
			if (importee.includes('client.mjs.mjs')) {
				return `${importee.slice(0, -4)}`;
			}
			//if (uid !== current_id) throw ABORT;

			// importing from Svelte
			if (importee === `svelte`) return `${svelteUrl}/index.mjs`;
			if (importee.startsWith(`svelte/`)) {
				return is_legacy_package_structure() ?
					`${svelteUrl}/${importee.slice(7)}.mjs` :
					`${svelteUrl}/${importee.slice(7)}/index.mjs`;
			}

			// importing one Svelte runtime module from another
			if (importer && importer.startsWith(svelteUrl)) {
				const resolved = new URL(importee, importer).href;
				if (resolved.endsWith('.mjs')) return resolved;
				return is_legacy_package_structure() ?
					`${resolved}.mjs` :
					`${resolved}/index.mjs`;
			}

			// importing from another file in REPL
			if (importee in lookup) return importee;
			if ((importee + '.js') in lookup) return importee + '.js';
			if ((importee + '.json') in lookup) return importee + '.json';

			// remove trailing slash
			if (importee.endsWith('/')) importee = importee.slice(0, -1);

			// importing from a URL
			if (importee.startsWith('http:') || importee.startsWith('https:')) return importee;

			// importing from (probably) unpkg
			if (importee.startsWith('.')) {
				const url = new URL(importee, importer).href;
				//self.postMessage({ type: 'status', uid, message: `resolving ${url}` });

				return await follow_redirects(url);
			}

			else {
				// console.log("fetching from unpkg", importee, importer);
				// if importee has 
				// fetch from unpkg
				//self.postMessage({ type: 'status', uid, message: `resolving ${importee}` });

				if (importer in lookup) {
					// console.log('importer in lookup.');
					const match = /^(@[^/]+\/)?[^/]+/.exec(importee);
					if (match) imports.add(match[0]);
				}

				try {
					const pkg_url = await follow_redirects(`${packagesUrl}/${importee}/package.json`);
					const pkg_json = (await fetch_if_uncached(pkg_url)).body;
					const pkg = JSON.parse(pkg_json);

					if (pkg.svelte || pkg.module || pkg.main) {
						const url = pkg_url.replace(/\/package\.json$/, '');
						return new URL(pkg.svelte || pkg.module || pkg.main, `${url}/`).href;
					}
				} catch (err) {
					// ignore
				}

				return await follow_redirects(`${packagesUrl}/${importee}`);
			}
		},
		async load(resolved) {
			if (resolved in lookup) return lookup[resolved].source;

			if (!fetch_cache.has(resolved)) {
				//self.postMessage({ type: 'status', uid, message: `fetching ${resolved}` });
			}
			const res = await fetch_if_uncached(resolved);
			console.log(res.body)
			return res.body;
		},
	}
}