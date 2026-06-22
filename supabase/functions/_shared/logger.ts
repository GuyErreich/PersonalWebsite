/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/** Structured JSON logger for Supabase Edge Functions (Deno). */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const resolveMinLevel = (): LogLevel => {
  const raw = (Deno.env.get("LOG_LEVEL") ?? "info").trim().toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
};

const MIN_LOG_LEVEL = resolveMinLevel();

const shouldLog = (level: LogLevel): boolean => LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[MIN_LOG_LEVEL];

const writeLog = (level: LogLevel, scope: string, message: string, bindings: LogContext): void => {
  if (!shouldLog(level)) {
    return;
  }

  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg: message,
    ...bindings,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const createLoggerImpl = (scope: string, bindings: LogContext): Logger => ({
  debug(message: string, context?: LogContext): void {
    writeLog("debug", scope, message, { ...bindings, ...context });
  },

  info(message: string, context?: LogContext): void {
    writeLog("info", scope, message, { ...bindings, ...context });
  },

  warn(message: string, context?: LogContext): void {
    writeLog("warn", scope, message, { ...bindings, ...context });
  },

  error(message: string, context?: LogContext): void {
    writeLog("error", scope, message, { ...bindings, ...context });
  },

  child(childBindings: LogContext): Logger {
    return createLoggerImpl(scope, { ...bindings, ...childBindings });
  },
});

/** Creates a scoped logger. Optional bindings are included on every log line. */
export const createLogger = (scope: string, bindings: LogContext = {}): Logger =>
  createLoggerImpl(scope, bindings);
