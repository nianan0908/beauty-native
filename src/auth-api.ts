import type { Role } from "./types";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  roles: Role[];
  permissions: string[];
  tenantId: string | null;
  storeIds: string[];
  entityId: string | null;
}

interface TokenResponse {
  accessToken: string;
  tokenType: "bearer";
  expiresIn: number;
  user: AuthUser;
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
  detail?: string;
}

let accessToken: string | null = null;
let refreshPromise: Promise<AuthUser> | null = null;

async function errorFrom(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
  return new Error(payload?.message ?? payload?.detail ?? fallback);
}

async function tokenRequest(path: string, init: RequestInit): Promise<AuthUser> {
  const response = await fetch(`${apiOrigin}/auth${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    accessToken = null;
    throw await errorFrom(response, "登录服务暂不可用，请稍后重试。");
  }
  const payload = await response.json() as TokenResponse;
  accessToken = payload.accessToken;
  return payload.user;
}

async function refreshSession(): Promise<AuthUser> {
  if (!refreshPromise) {
    refreshPromise = tokenRequest("/refresh", { method: "POST" })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export const authApi = {
  login: (username: string, password: string) => tokenRequest("/login", {
    method: "POST",
    body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
  }),
  refresh: refreshSession,
  async logout(): Promise<void> {
    accessToken = null;
    await fetch(`${apiOrigin}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch(() => undefined);
  },
};

export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const request = () => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(input, { ...init, credentials: "include", headers });
  };

  let response = await request();
  if (response.status !== 401) return response;

  try {
    await refreshSession();
  } catch {
    return response;
  }
  response = await request();
  return response;
}
