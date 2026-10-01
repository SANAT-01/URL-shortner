// Server-only: the Next.js server reaches the backend directly (no CORS
// needed, since the browser only ever talks to the Next.js server).
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
