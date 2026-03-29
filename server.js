import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const port = process.env.PORT || 4173;
const root = process.cwd();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

createServer((request, response) => {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = normalize(join(root, requestPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`TimeNest preview available at http://localhost:${port}`);
});
