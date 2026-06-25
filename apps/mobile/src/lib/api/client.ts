import { config } from '@/config';
import type { ApiError } from '@lumi/shared';

/** Erro lançado quando não há backend configurado (modo mock/offline). */
export class ApiUnavailableError extends Error {
  constructor() {
    super('API indisponível (sem apiUrl / modo offline)');
    this.name = 'ApiUnavailableError';
  }
}

/** Erro de resposta da API (status >= 400). */
export class ApiResponseError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
    this.name = 'ApiResponseError';
  }
}

// Token de acesso em memória. O authStore chama setAccessToken após login real.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Cliente HTTP da API (apps/api). Base URL vem de config (EXPO_PUBLIC_API_URL).
 * Lança ApiUnavailableError quando não há backend → o repositório cai no mock/offline.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config.apiUrl) throw new ApiUnavailableError();

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      error: 'unknown',
      message: `HTTP ${res.status}`,
    }))) as ApiError;
    throw new ApiResponseError(res.status, body);
  }
  return res.json() as Promise<T>;
}
