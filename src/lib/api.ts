export type ApiError = {
  error: { message: string; code?: string; details?: unknown };
};

export type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  accessToken?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiPayloadErrorMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const error = payload.error;
  if (!isRecord(error)) return undefined;
  const message = error.message;
  return typeof message === "string" && message ? message : undefined;
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export function getErrorStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const status = err.status;
  return typeof status === "number" ? status : undefined;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "content-type": "application/json" }),
    ...(options.headers ?? {}),
  };

  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg = getApiPayloadErrorMessage(json) ?? `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json as T;
}
