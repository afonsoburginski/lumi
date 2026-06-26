import React from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';

import type { WordTiming } from '@/types/domain';

/**
 * Texto da narração com realce de palavra (karaokê). O destaque é dirigido pelo
 * índice da palavra ativa (vindo do controller de narração); sem palavras,
 * renderiza o texto puro. Estilos vêm do player (escuro/overlay no vertical,
 * claro/livro no landscape).
 */
export function KaraokeText({
  text,
  words,
  activeIndex,
  textStyle,
  activeStyle,
}: {
  text: string;
  words?: WordTiming[];
  activeIndex: number;
  textStyle?: StyleProp<TextStyle>;
  activeStyle?: StyleProp<TextStyle>;
}) {
  if (!words || words.length === 0) {
    return <RNText style={textStyle}>{text}</RNText>;
  }

  return (
    <RNText style={textStyle}>
      {words.map((t, i) => (
        <RNText key={`${t.word}-${i}`} style={i === activeIndex ? activeStyle : undefined}>
          {t.word}
          {i < words.length - 1 ? ' ' : ''}
        </RNText>
      ))}
    </RNText>
  );
}
