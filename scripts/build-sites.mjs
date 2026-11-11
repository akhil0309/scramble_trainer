import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const docs = resolve(root, "docs");
const [html, script, styles, hosting] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "app.js"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, ".openai/hosting.json"), "utf8")
]);

const worker = `const ASSETS = ${JSON.stringify({
  "/": [html, "text/html; charset=utf-8"],
  "/index.html": [html, "text/html; charset=utf-8"],
  "/app.js": [script, "text/javascript; charset=utf-8"],
  "/styles.css": [styles, "text/css; charset=utf-8"]
})};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = ASSETS[url.pathname];
    if (!asset) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(request.method === "HEAD" ? null : asset[0], {
      headers: {
        "content-type": asset[1],
        "cache-control": url.pathname === "/" || url.pathname === "/index.html"
          ? "no-cache"
          : "public, max-age=3600",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer"
      }
    });
  }
};
`;

await rm(dist, { recursive: true, force: true });
await rm(docs, { recursive: true, force: true });
await mkdir(resolve(dist, "server"), { recursive: true });
await mkdir(resolve(dist, ".openai"), { recursive: true });
await mkdir(docs, { recursive: true });
await writeFile(resolve(dist, "server/index.js"), worker);
await writeFile(resolve(dist, ".openai/hosting.json"), hosting);
await writeFile(resolve(docs, "index.html"), html);
await writeFile(resolve(docs, "app.js"), script);
await writeFile(resolve(docs, "styles.css"), styles);
await writeFile(resolve(docs, ".nojekyll"), "");
