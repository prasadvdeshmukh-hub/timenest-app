import dotenv from "dotenv";
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

dotenv.config();

const port = process.env.PORT || 4173;
const root = process.cwd();

function createFirebaseConfigPayload() {
  const firebase = {
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
  };

  return {
    firebase,
    hasFirebaseConfig: Boolean(
      firebase.apiKey &&
      firebase.authDomain &&
      firebase.projectId &&
      firebase.appId
    ),
    auth: {
      emailPasswordEnabled: process.env.TIMENEST_EMAIL_PASSWORD_AUTH !== "false",
      googleEnabled: process.env.TIMENEST_GOOGLE_AUTH !== "false",
      phoneEnabled: process.env.TIMENEST_PHONE_AUTH !== "false",
      useEmulator: process.env.FIREBASE_AUTH_USE_EMULATOR === "true",
      emulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1",
      emulatorPort: Number(process.env.FIREBASE_AUTH_EMULATOR_PORT || "9099"),
      disableAppVerificationForTesting:
        process.env.FIREBASE_AUTH_DISABLE_APP_VERIFICATION_FOR_TESTING === "true"
    }
  };
}

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
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;

  if (requestPath === "/app-config.json") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify(createFirebaseConfigPayload()));
    return;
  }

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
  console.log(`TIMENEST preview available at http://localhost:${port}`);
});
