import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Texto as Text } from '@/components/ui/Texto';

interface PropiedadesBotonGoogle {
  onPress: () => void;
  cargando?: boolean;
  variante?: 'base' | 'oficial';
}

export function BotonGoogle({
  onPress,
  cargando = false,
  variante = 'base',
}: PropiedadesBotonGoogle) {
  const estiloOficial = variante === 'oficial';

  return (
    <TouchableOpacity
      className={`min-h-[52px] w-full flex-row items-center justify-center gap-3 border bg-ruta-surface py-3.5 active:bg-ruta-canvas ${
        estiloOficial
          ? 'rounded-full border-ruta-blue-line shadow-sm shadow-ruta-navy/5'
          : 'rounded-xl border-ruta-line'
      }`}
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      activeOpacity={0.8}
    >
      {cargando ? (
        <ActivityIndicator color="#5D705E" />
      ) : (
        <>
          <View className="h-7 w-7 items-center justify-center rounded-full border border-[#E8E8E1] bg-white">
            <Text className="text-base font-extrabold text-[#4285F4]">G</Text>
          </View>
          <Text
            className={`text-ruta-ink ${
              estiloOficial ? 'text-[15.5px] font-bold' : 'text-sm font-semibold'
            }`}
          >
            Continuar con Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
