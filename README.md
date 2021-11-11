# svelte-sketch

`svelte-sketch` turns any Svelte component on your filesystem into a full-fledged REPL.
It handles all imports for you, local or remote.

## Get Started

To get started, just run

```bash
npx svelte-sketch watch MyComponent.svelte
# load a stylesheet
npx svelte-sketch watch MyComponent.svelte --css path/to/style.css
# change the port
npx svelte-sketch watch MyComponent.svelte --port 9020
```

Alternatively, you can run

```
npm install -g svelte-sketch
svelte-sketch watch MyComponent.svelte
```