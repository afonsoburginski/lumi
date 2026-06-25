import { apiFetch } from '@/lib/api/client';
import type { AuthResponse, LoginRequest, SignupRequest } from '@lumi/shared';

/** Chamadas de autenticação à API (apps/api). Usadas quando há backend online. */

export async function signupRemote(body: SignupRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function loginRemote(body: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function refreshRemote(refreshToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
