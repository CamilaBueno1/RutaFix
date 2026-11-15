import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface PropiedadesBotonGoogle {
  onPress: () => void;
  cargando?: boolean;
}

export function BotonGoogle({ onPress, cargando = false }: PropiedadesBotonGoogle) {
  return (
    <TouchableOpacity
      className="w-full flex-row items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3.5 active:bg-slate-50"
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      activeOpacity={0.75}
    >
      {cargando ? (
        <ActivityIndicator color="#2563EB" />
      ) : (
        <>
          <Text className="text-xl font-bold text-blue-600">G</Text>
          <Text className="text-base font-semibold text-slate-700">Continuar con Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
