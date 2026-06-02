import { prisma } from "./db";

/**
 * Fire-and-forget error logger. Writes to ErrorLog table for the admin
 * monitoring panel. Never throws (logging failures must not cascade).
 *
 * Usage:
 *   try { ... } catch (e) {
 *     await logError({ source: "api", route: "/api/posts", error: e });
 *     ...
 *   }
 */

export type ErrorSource =
  | "api"
  | "worker"
  | "newsletter"
  | "push"
  | "ai"
  | "cron"
  | "other";

export interface LogErrorArgs {
  source: ErrorSource;
  route?: string;
  error: unknown;
  severity?: "warn" | "error" | "fatal";
  metadata?: Record<string, unknown>;
}

export async function logError(args: LogErrorArgs): Promise<void> {
  const { source, route, error, severity = "error", metadata } = args;
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack : undefined;

  try {
    await prisma.errorLog.create({
      data: {
        source,
        route: route ?? null,
        message: message.slice(0, 2000),
        stack: stack?.slice(0, 8000) ?? null,
        severity,
        metadata: metadata ? JSON.stringify(metadata).slice(0, 4000) : null,
      },
    });
  } catch {
    /* swallow — never let logging fail the caller */
  }
}
