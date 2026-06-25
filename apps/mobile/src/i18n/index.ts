import { I18n } from 'i18n-js';

import ptBR from './pt-BR';

/**
 * i18n do app. Hoje só PT-BR; adicionar um novo idioma = novo dicionário aqui.
 * Uso: `t('home.greetingUser', { name })`.
 */
export const i18n = new I18n({ 'pt-BR': ptBR });

i18n.defaultLocale = 'pt-BR';
i18n.locale = 'pt-BR';
i18n.enableFallback = true;

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
