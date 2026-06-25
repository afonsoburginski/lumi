/**
 * Configuração por ambiente. Valores vêm de variáveis EXPO_PUBLIC_* (inlinadas
 * pelo Expo em build/runtime) com fallback para dev. Trocar mock↔backend aqui.
 *
 * Ex.: criar um arquivo .env com:
 *   EXPO_PUBLIC_APP_ENV=development
 *   EXPO_PUBLIC_API_URL=http://localhost:3333
 *   EXPO_PUBLIC_USE_MOCKS=true
 */

export type AppEnv = 'development' | 'staging' | 'production';

const env = (process.env.EXPO_PUBLIC_APP_ENV as AppEnv) ?? 'development';

export const config = {
  env,
  isDev: env === 'development',
  /** URL da API desacoplada (apps/api). Vazio = sem backend → usa mocks/offline. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  /** Força o uso dos serviços mock mesmo com apiUrl definida (útil em dev/offline). */
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || !process.env.EXPO_PUBLIC_API_URL,
} as const;
