import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PropiedadesPantalla extends ViewProps {
  className?: string;
  sinInferior?: boolean;
}

export function Pantalla({
  className = '',
  style,
  sinInferior = false,
  children,
  ...resto
}: PropiedadesPantalla) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 ${className}`.trim()}
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: sinInferior ? 0 : insets.bottom,
        },
        style,
      ]}
      {...resto}
    >
      {children}
    </View>
  );
}

export const Screen = Pantalla;
