import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chrome (barra) imersivo estilo Gemini Storybook: aparece e some sozinho.
 * Um toque na tela alterna a visibilidade; some sozinho após `timeoutMs`.
 * NUNCA pausa/navega (modo infantil: toques não interrompem a história) — só
 * mostra/esconde os controles. Começa visível por ~timeoutMs (dica) e some.
 */
export function useAutoHideChrome(timeoutMs = 2800) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const arm = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setVisible(false), timeoutMs);
  }, [clear, timeoutMs]);

  useEffect(() => {
    arm(); // dica inicial: mostra e some sozinho
    return clear;
  }, [arm, clear]);

  /** Reexibe e reinicia o timer (ex.: ao navegar pelas setas). */
  const show = useCallback(() => {
    setVisible(true);
    arm();
  }, [arm]);

  /** Toque na tela: visível → some; oculto → aparece (e re-arma o timer). */
  const toggle = useCallback(() => {
    setVisible((v) => {
      if (v) {
        clear();
        return false;
      }
      arm();
      return true;
    });
  }, [arm, clear]);

  return { visible, show, toggle };
}
