import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const distUrl = new URL("../dist/", import.meta.url);
const assetsUrl = new URL("assets/", distUrl);
const assetNames = await readdir(assetsUrl);
const names = ["index.html", ...assetNames.map((name) => `assets/${name}`)];

const contentType = (name) => {
  if (name.endsWith(".html")) return "text/html; charset=utf-8";
  if (name.endsWith(".css")) return "text/css; charset=utf-8";
  if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
};

const files = {};
for (const name of names) {
  const data = await readFile(new URL(name, distUrl));
  const key = `/${name.replaceAll("\\", "/")}`;
  files[key] = { data: data.toString("base64"), type: contentType(name) };
}

const source = [
  `const files=${JSON.stringify(files)};`,
  "const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));",
  "export default {",
  "  async fetch(request) {",
  "    const url = new URL(request.url);",
  "    const key = url.pathname === '/' ? '/index.html' : url.pathname;",
  "    const file = files[key];",
  "    if (!file) return new Response('Not found', { status: 404 });",
  "    return new Response(decode(file.data), { headers: { 'content-type': file.type, 'cache-control': key === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable' } });",
  "  },",
  "};",
  "",
].join("\n");

await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/server/index.js", import.meta.url), source);
