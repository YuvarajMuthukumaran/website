// Runs the chatbot/booking API (../../chatbot/server) in sandbox mode for the
// website: in-memory database seeded with the doctor directory, stub HMS,
// login codes echoed to the page, and CORS/cookies set up for localhost:3000.
// Real patient data is never touched. Usage: node scripts/api-sandbox.mjs
import path from "node:path";
import { pathToFileURL } from "node:url";

const server = path.resolve(import.meta.dirname, "..", "..", "..", "chatbot", "server");
process.chdir(server); // so server/.env (GROQ_API_KEY) is picked up
Object.assign(process.env, {
  PORT: process.env.PORT ?? "8788",
  CLIENT_ORIGIN: "http://localhost:3000,http://localhost:3100", // dev server, local production build
  OTP_DEV_ECHO: "true",
  COOKIE_SECURE: "false",
  TRUST_PROXY: "0",
});
await import(pathToFileURL(path.join(server, "scripts", "sandbox.js")).href);
