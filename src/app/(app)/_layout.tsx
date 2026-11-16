import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="vehiculo/[id]" />
      <Stack.Screen name="vehiculo/formulario" />
      <Stack.Screen name="mantenimiento/formulario" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
