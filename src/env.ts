export interface EnvConfig {
  baseUrl: string;
  superuserEmail: string;
  superuserPassword: string;
  timeoutMs: number;
}

export function loadEnv(): EnvConfig {
  const baseUrl = process.env.POCKETBASE_URL?.replace(/\/+$/, "");
  const superuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL;
  const superuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD;
  const timeoutMs = Number(process.env.POCKETBASE_API_TIMEOUT_MS ?? 15_000);

  const missing: string[] = [];
  if (!baseUrl) missing.push("POCKETBASE_URL");
  if (!superuserEmail) missing.push("POCKETBASE_SUPERUSER_EMAIL");
  if (!superuserPassword) missing.push("POCKETBASE_SUPERUSER_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      `pocketbase-mcp: missing required env var(s): ${missing.join(", ")}`,
    );
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      `pocketbase-mcp: POCKETBASE_API_TIMEOUT_MS must be a positive number`,
    );
  }

  return {
    baseUrl: baseUrl!,
    superuserEmail: superuserEmail!,
    superuserPassword: superuserPassword!,
    timeoutMs,
  };
}
