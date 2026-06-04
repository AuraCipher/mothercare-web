// ─────────────────────────────────────────────────
// Mother Care School — Logger
// Development: verbose with timestamps + colors
// Production:  errors & warnings only, clean
// ─────────────────────────────────────────────────

import config from '@/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isServer = typeof window === 'undefined';

// Server-side ANSI colors
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
} as const;

function timestamp(): string {
  const d = new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function serverColor(level: LogLevel, color: string, msg: string): void {
  const ts = `${colors.dim}${timestamp()}${colors.reset}`;
  const tag = `${color}[${level.toUpperCase()}]${colors.reset}`;
  const prefix = `${ts} ${tag}`;

  switch (level) {
    case 'error':
      console.error(prefix, msg);
      break;
    case 'warn':
      console.warn(prefix, msg);
      break;
    default:
      console.log(prefix, msg);
      break;
  }
}

function clientColor(level: LogLevel, msg: string): void {
  const ts = timestamp();
  const iconMap: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  const prefix = `${iconMap[level]} ${ts}`;

  switch (level) {
    case 'error':
      console.error(prefix, msg);
      break;
    case 'warn':
      console.warn(prefix, msg);
      break;
    case 'info':
      console.info(prefix, msg);
      break;
    default:
      console.log(prefix, msg);
      break;
  }
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = config.isDev ? 0 : 2; // dev=all, prod=warn+
  return LOG_ORDER[level] >= minLevel;
}

function log(level: LogLevel, msg: string): void {
  if (!shouldLog(level)) return;

  if (isServer) {
    const colorMap: Record<LogLevel, string> = {
      debug: colors.cyan,
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
    };
    serverColor(level, colorMap[level], msg);
  } else {
    clientColor(level, msg);
  }
}

export const logger = {
  debug: (msg: string) => log('debug', msg),
  info: (msg: string) => log('info', msg),
  warn: (msg: string) => log('warn', msg),
  error: (msg: string) => log('error', msg),
};

export default logger;
