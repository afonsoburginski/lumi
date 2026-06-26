import React from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

import { fonts } from '@/theme/fonts';
import type { StoryPage } from '@/types/domain';

import { BOOK } from './constants';

/**
 * Ilustração full-bleed da página esquerda. As artes são recortadas na MESMA
 * proporção da página (~0.63, igual ao PDF), então `cover` preenche a página
 * inteira sem cortar os personagens nem deixar barras.
 */
export const Illustration = React.memo(({ page }: { page: StoryPage }) => (
  <Image source={{ uri: page.imageUri }} style={styles.illo} contentFit="cover" transition={120} />
));
Illustration.displayName = 'Illustration';

/** Cantinho de papel dobrado no rodapé direito. */
function PageCurl() {
  return (
    <View style={styles.curl} pointerEvents="none">
      <Svg width={30} height={30} viewBox="0 0 30 30">
        <Path d="M30 0 L30 30 L0 30 Z" fill="rgba(0,0,0,0.10)" />
        <Path d="M30 8 L30 30 L8 30 Z" fill="#FBF7EE" />
        <Path d="M30 8 L8 30" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
      </Svg>
    </View>
  );
}

/** Página de papel creme: autor + texto serifado com drop-cap + cantinho dobrado. */
export const TextPage = React.memo(({ page, author }: { page: StoryPage; author: string }) => (
  <View style={styles.paper}>
    <RNText style={styles.author}>{author}</RNText>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <RNText style={styles.body}>
        <RNText style={styles.dropCap}>{page.text.slice(0, 1)}</RNText>
        {page.text.slice(1)}
      </RNText>
    </ScrollView>
    <PageCurl />
  </View>
));
TextPage.displayName = 'TextPage';

const styles = StyleSheet.create({
  illo: { width: '100%', height: '100%', backgroundColor: '#1a1726' },
  paper: { flex: 1, backgroundColor: BOOK.paper, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10 },
  author: {
    color: BOOK.inkSoft,
    fontFamily: fonts.serifMedium,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'right',
    marginBottom: 6,
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-start' },
  body: { color: BOOK.ink, fontFamily: fonts.serif, fontSize: 18, lineHeight: 25 },
  dropCap: { color: BOOK.ink, fontFamily: fonts.serifBold, fontSize: 40, lineHeight: 36 },
  curl: { position: 'absolute', right: 0, bottom: 0 },
});
