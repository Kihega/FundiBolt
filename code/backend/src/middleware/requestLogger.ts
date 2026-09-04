import { Request, Response, NextFunction } from "express";
import { colorize } from "../utils/terminalColors";

// Logs every incoming request to the terminal - method, path, status
// code, and response time - so requests from the mobile app (or anywhere
// else) actually show up while the server is running, not just errors.
// Colored by status range, the same convention most HTTP loggers use:
// green for success, cyan for redirects, yellow for client errors, red
// for server errors.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const statusColor = res.statusCode >= 500 ? "red" : res.statusCode >= 400 ? "yellow" : res.statusCode >= 300 ? "cyan" : "green";
    console.log(`${req.method} ${req.originalUrl} ${colorize(String(res.statusCode), statusColor)} - ${durationMs}ms`);
  });

  next();
}
