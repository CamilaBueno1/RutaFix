import React from 'react';
import { Text as NativeText, type TextProps } from 'react-native';

interface PropiedadesTexto extends TextProps {
  className?: string;
}

function obtenerFuente(className: string) {
  const clases = new Set(className.split(/\s+/));

  if (clases.has('font-extrabold')) return 'PlusJakartaSans_800ExtraBold';
  if (clases.has('font-bold')) return 'PlusJakartaSans_700Bold';
  if (clases.has('font-semibold')) return 'PlusJakartaSans_600SemiBold';
  if (clases.has('font-medium')) return 'PlusJakartaSans_500Medium';
  return 'PlusJakartaSans_400Regular';
}

export function Texto({ className = '', style, ...resto }: PropiedadesTexto) {
  return (
    <NativeText
      {...resto}
      className={className}
      style={[{ fontFamily: obtenerFuente(className) }, style]}
    />
  );
}
