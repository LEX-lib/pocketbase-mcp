import type { EnvConfig } from "./env.js";

export class PocketBaseError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "PocketBaseError";
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** When true, return the raw Response instead of parsed JSON. */
  raw?: boolean;
  /** Skip attaching the Authorization header (e.g. for public endpoints). */
  skipAuth?: boolean;
}

interface LoginResponse {
  token: string;
  record?: { id?: string; email?: string };
}

export class PocketBaseClient {
  private token: string | null = null;
  private loginPromise: Promise<void> | null = null;
  private loginAttempts = 0;
  private readonly maxLoginAttempts = 3;

  constructor(private readonly cfg: EnvConfig) {}

  /** Eagerly authenticate at startup so misconfig fails fast. */
  async bootstrap(): Promise<void> {
    await this.ensureLoggedIn();
    log(`connected to ${this.cfg.baseUrl}`);
  }

  private async ensureLoggedIn(): Promise<void> {
    if (this.token) return;
    if (this.loginPromise) {
      await this.loginPromise;
      return;
    }
    this.loginPromise = this.doLogin().finally(() => {
      this.loginPromise = null;
    });
    await this.loginPromise;
  }

  private async doLogin(): Promise<void> {
    const url = `${this.cfg.baseUrl}/api/collections/_superusers/auth-with-password`;
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: this.cfg.superuserEmail,
          password: this.cfg.superuserPassword,
        }),
      },
      this.cfg.timeoutMs,
    );

    if (!res.ok) {
      const text = await safeText(res);
      this.loginAttempts++;
      if (this.loginAttempts >= this.maxLoginAttempts) {
        throw new PocketBaseError(
          res.status,
          `PocketBase superuser login failed after ${this.maxLoginAttempts} attempts: ${res.status} ${text}`,
        );
      }
      throw new PocketBaseError(
        res.status,
        `PocketBase superuser login failed: ${res.status} ${text}`,
      );
    }

    const data = (await res.json()) as LoginResponse;
    this.token = data.token;
    this.loginAttempts = 0;
    log("superuser authenticated");
  }

  /**
   * Send a request. On 401/403, re-auth once and retry.
   * Returns parsed JSON by default, or the raw Response when opts.raw is true.
   */
  async request<T = unknown>(
    method: string,
    path: string,
    opts: RequestOptions & { raw: true },
  ): Promise<Response>;
  async request<T = unknown>(
    method: string,
    path: string,
    opts?: RequestOptions,
  ): Promise<T>;
  async request<T = unknown>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T | Response> {
    await this.ensureLoggedIn();
    const response = await this.dispatch(method, path, opts);

    if (
      !opts.skipAuth &&
      (response.status === 401 || response.status === 403)
    ) {
      log(`got ${response.status}, refreshing superuser token`);
      this.token = null;
      await this.ensureLoggedIn();
      const retried = await this.dispatch(method, path, opts);
      return this.finalize<T>(retried, opts);
    }

    return this.finalize<T>(response, opts);
  }

  /** Public: build an authenticated URL (used by some tools). */
  resolveUrl(path: string, query?: Record<string, unknown>): string {
    return `${this.cfg.baseUrl}${path}${encodeQuery(query ?? {})}`;
  }

  get baseUrl(): string {
    return this.cfg.baseUrl;
  }

  private async dispatch(
    method: string,
    path: string,
    opts: RequestOptions,
  ): Promise<Response> {
    const url = `${this.cfg.baseUrl}${path}${encodeQuery(opts.query ?? {})}`;
    const headers = new Headers(opts.headers);

    if (!opts.skipAuth && this.token) {
      headers.set("Authorization", this.token);
    }

    const isFormData =
      typeof FormData !== "undefined" && opts.body instanceof FormData;
    if (opts.body !== undefined && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const init: RequestInit = {
      method,
      headers,
      ...(opts.body !== undefined
        ? { body: isFormData ? (opts.body as FormData) : JSON.stringify(opts.body) }
        : {}),
    };

    return fetchWithTimeout(url, init, this.cfg.timeoutMs);
  }

  private async finalize<T>(res: Response, opts: RequestOptions): Promise<T | Response> {
    if (opts.raw) return res;
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!res.ok) {
      throw new PocketBaseError(
        res.status,
        `PocketBase ${res.status}: ${truncate(text, 500)}`,
        safeParse(text),
      );
    }
    if (!text) return undefined as T;
    return safeParse(text) as T;
  }
}

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() =>
    clearTimeout(timer),
  );
}

function encodeQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function safeText(res: Response): Promise<string> {
  try {
    return truncate(await res.text(), 500);
  } catch {
    return "<unreadable body>";
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function log(msg: string): void {
  // stderr only — stdout is the MCP transport.
  // eslint-disable-next-line no-console
  console.error(`[pocketbase-mcp] ${msg}`);
}
