import { Stack } from 'expo-router';
import React from 'react';

import { ServicesProvider } from '../src/services/ServicesProvider';

export default function RootLayout() {
  return (
    <ServicesProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ServicesProvider>
  );
}
