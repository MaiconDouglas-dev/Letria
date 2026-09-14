import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../src/services/ServicesProvider';
import { colors as defaultColors, shadows } from '../../src/shared/theme';

export default function TabsLayout() {
  const { colors = defaultColors, isDark } = useServices();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: isDark ? colors.border : colors.borderLight,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trilha',
          tabBarLabel: 'Trilha',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} isDark={isDark} />,
          tabBarAccessibilityLabel: 'Aba Trilha de Aprendizado',
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Revisar',
          tabBarLabel: 'Revisar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔁" focused={focused} isDark={isDark} />,
          tabBarAccessibilityLabel: 'Aba de Revisão e Prática',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Conquistas',
          tabBarLabel: 'Conquistas',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} isDark={isDark} />,
          tabBarAccessibilityLabel: 'Aba de Conquistas e Progresso',
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Apoio',
          tabBarLabel: 'Apoio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} badge isDark={isDark} />,
          tabBarAccessibilityLabel: 'Aba de Apoio e WhatsApp',
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, focused, badge, isDark }: { emoji: string; focused: boolean; badge?: boolean; isDark?: boolean }) {
  return (
    <View
      style={[
        styles.iconWrapper,
        focused && {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : defaultColors.bgSubtle,
        },
      ]}
    >
      <Text style={styles.iconText}>{emoji}</Text>
      {badge && <View style={styles.badgeDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 66,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...shadows.subtle,
  },
  tabItem: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  iconWrapper: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapperFocused: {
    backgroundColor: defaultColors.bgSubtle,
  },
  iconText: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: defaultColors.emerald,
  },
});

