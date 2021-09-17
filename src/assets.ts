export const mainJS = (file:string) => `
import App from '${file}';

const app = new App({
	target: document.body,
});

export default app;`

interface htmlArguments {
	css: string | undefined,
	title: string
}

export const indexHTML = ({css, title} : htmlArguments) => {
	const defaultArguments = {css: undefined, title: "Svignette"};
	const combinedArguments = {...defaultArguments, css, title};
	let stylesheet;
	if (defaultArguments.css) {
		stylesheet = `<link rel='stylesheet' href='/${css}'></link>`
	} else {
		stylesheet = `<link rel='stylesheet' href='/global.css'>`
	}
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset='utf-8'>
	<meta name='viewport' content='width=device-width,initial-scale=1'>

	<title>${combinedArguments.title}</title>

	<link rel='icon' type="image/svg+xml" href='/favicon.svg'>
	${stylesheet}

	<script type="module" src='/_entry.js'></script>
</head>

<body>
</body>
</html>
`};

export const globalCSS = `
html, body {
	position: relative;
	width: 100%;
	height: 100%;
}

body {
	color: #333;
	margin: 0;
	padding: 8px;
	box-sizing: border-box;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

a {
	color: rgb(0,100,200);
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

a:visited {
	color: rgb(0,80,160);
}

label {
	display: block;
}

input, button, select, textarea {
	font-family: inherit;
	font-size: inherit;
	-webkit-padding: 0.4em 0;
	padding: 0.4em;
	margin: 0 0 0.5em 0;
	box-sizing: border-box;
	border: 1px solid #ccc;
	border-radius: 2px;
}

input:disabled {
	color: #ccc;
}

button {
	color: #333;
	background-color: #f4f4f4;
	outline: none;
}

button:disabled {
	color: #999;
}

button:not(:disabled):active {
	background-color: #ddd;
}

button:focus {
	border-color: #666;
}
`

export const favicon = `
<svg viewBox="0 0 380 380" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">
    <g transform="matrix(1,0,0,1,-329.91,-210)">
        <g>
            <g transform="matrix(1.75,0.433013,0.433013,1.25,-562.917,-325)">
                <path d="M433.013,350L606.218,450" style="fill:none;stroke:rgb(255,0,0);stroke-width:16.42px;"/>
            </g>
            <path d="M606.218,350L433.013,450" style="fill:none;stroke:rgb(255,0,0);stroke-width:32px;"/>
            <g transform="matrix(1,-5.22959e-16,-5.11591e-16,1.5,1.36424e-13,-200)">
                <path d="M519.615,300L519.615,500" style="fill:none;stroke:rgb(255,0,0);stroke-width:25.1px;"/>
            </g>
        </g>
    </g>
</svg>

`