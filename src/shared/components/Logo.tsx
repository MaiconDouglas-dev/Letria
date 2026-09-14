import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, font, spacing } from '../theme';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'symbol';
  showTagline?: boolean;
  style?: ViewStyle;
}

/**
 * Componente da Logo Oficial do Letria
 * Usa a imagem transparente em alta definição com a paleta oficial da marca.
 */
export function Logo({ size = 80, variant = 'full', showTagline = false, style }: LogoProps) {
  const isSymbol = variant === 'symbol';
  const source = isSymbol
    ? require('../../../assets/symbol.png')
    : require('../../../assets/logo.png');

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
        accessibilityLabel="Logo Letria"
      />
      {showTagline && (
        <View style={styles.textContainer}>
          <Text style={styles.tagline}>Ler é um novo começo.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
});
