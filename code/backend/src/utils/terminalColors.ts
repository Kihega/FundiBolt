// Minimal ANSI color helpers for terminal output - deliberately not a
// dependency (chalk, etc.) since coloring a handful of startup/request
// log lines doesn't need one. Codes reference:
// https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
const CODES = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

export type TerminalColor = keyof Omit<typeof CODES, "reset">;

export function colorize(text: string, color: TerminalColor): string {
  return `${CODES[color]}${text}${CODES.reset}`;
}
