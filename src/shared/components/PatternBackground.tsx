import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Estampa decorativa de livros e letrinhas (manual, págs. 8–9).
 * Estática, sem animação — respeita movimento reduzido por padrão.
 * Livros 18–25% de opacidade, letras 12–18%; nunca intercepta toque
 * nem é lida por leitor de tela.
 */
const TILE = [
  { c: '📖', o: 0.2, s: 34, t: 12, l: 18, r: -8 },
  { c: 'a', o: 0.15, s: 30, t: 60, l: 200, r: 0 },
  { c: '📕', o: 0.18, s: 40, t: 130, l: 120, r: 10 },
  { c: 'e', o: 0.14, s: 24, t: 190, l: 30, r: 0 },
  { c: 'L', o: 0.16, s: 36, t: 200, l: 250, r: 0 },
  { c: '📗', o: 0.22, s: 30, t: 250, l: 220, r: -12 },
  { c: 'o', o: 0.13, s: 28, t: 290, l: 90, r: 0 },
  { c: 'u', o: 0.15, s: 22, t: 40, l: 300, r: 0 },
] as const;

export function PatternBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <View key={row} style={[styles.tile, { top: row * 320 }]}>
          {TILE.map((p, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                top: p.t,
                left: p.l,
                fontSize: p.s,
                opacity: p.o,
                transform: [{ rotate: `${p.r}deg` }],
                color: '#14251F',
              }}
            >
              {p.c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { position: 'absolute', left: 0, right: 0, height: 320 },
});
