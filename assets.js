const mainJS = (file) => `
import App from '${file}';

const app = new App({
	target: document.body,
});

export default app;
`


const indexHTML = ({css, title}) => {
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

	<link rel='icon'e type='image/png' href='/favicon.png'>
	${stylesheet}

	<script type="module" src='/dist/_entry.js'></script>
</head>

<body>
</body>
</html>
`};

const globalCSS = `
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

module.exports = { mainJS, indexHTML, globalCSS };