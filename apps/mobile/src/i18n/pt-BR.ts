/** Dicionário PT-BR. Centraliza os textos do app (ver docs/architecture.md #13). */
export default {
  common: {
    back: 'Voltar',
    cancel: 'Cancelar',
    save: 'Salvar',
    create: 'Criar',
    login: 'Entrar',
    signup: 'Criar conta',
    logout: 'Sair',
  },
  tabs: {
    home: 'Início',
    create: 'Criar',
    library: 'Biblioteca',
    profile: 'Perfil',
  },
  home: {
    greetingGuest: '⭐ Olá! Vamos ler?',
    greetingUser: 'Olá, %{name}! 👋',
    recommendedFor: 'Recomendado para %{band} anos',
    guestQuota: 'Visitante · %{n} leitura(s) grátis hoje',
    emptyOffline: 'Nenhuma história disponível offline ainda.',
  },
  safety: {
    badge: '🛡️ Toda história passa por uma verificação de segurança.',
    friendlyBlock: 'Vamos tentar uma ideia diferente? 🌈',
  },
  offline: {
    banner: 'Você está offline',
    pending: '%{n} ação(ões) pendente(s)',
  },
} as const;
