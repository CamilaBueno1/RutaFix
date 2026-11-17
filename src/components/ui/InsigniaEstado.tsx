import React from 'react';
import { View } from 'react-native';
import { Texto as Text } from '@/components/ui/Texto';
import type { ResultadoEstadoServicio } from '@/utils/estadoServicio';

interface PropiedadesInsigniaEstado {
  resultado: ResultadoEstadoServicio;
  mostrarMotivo?: boolean;
}

export function InsigniaEstado({ resultado, mostrarMotivo = false }: PropiedadesInsigniaEstado) {
  return (
    <View className="items-start">
      <View
        className="flex-row items-center px-3 py-1.5 rounded-full border"
        style={{
          backgroundColor: resultado.colorFondo,
          borderColor: resultado.colorTexto + '40',
        }}
      >
        <View
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: resultado.colorTexto }}
        />
        <Text
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: resultado.colorTexto }}
        >
          {resultado.etiqueta}
        </Text>
      </View>
      {mostrarMotivo && resultado.motivo ? (
        <Text className="mt-1.5 text-xs font-medium text-[#77786F]">
          {resultado.motivo}
        </Text>
      ) : null}
    </View>
  );
}

export const StatusBadge = InsigniaEstado;
