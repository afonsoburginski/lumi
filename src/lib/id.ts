/** Gera um id curto e razoavelmente único (suficiente para uso local/offline). */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}

/** Data local no formato YYYY-MM-DD (para a quota diária). */
export function todayLocal(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
