import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Texto as Text } from '@/components/ui/Texto';

interface PropiedadesBoton extends TouchableOpacityProps {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'peligro' | 'borde';
  cargando?: boolean;
  clasePersonalizada?: string;
  icono?: keyof typeof Ionicons.glyphMap;
}

export function Boton({
  titulo,
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  clasePersonalizada = '',
  icono,
  ...resto
}: PropiedadesBoton) {
  let claseEstiloBoton =
    'min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl px-5 py-3.5';
  let claseEstiloTexto = 'text-base font-bold text-center';

  switch (variante) {
    case 'secundario':
      claseEstiloBoton += ' bg-ruta-inset active:bg-ruta-soft';
      claseEstiloTexto += ' text-ruta-ink';
      break;
    case 'peligro':
      claseEstiloBoton += ' bg-ruta-clay-dark active:bg-[#7B3823]';
      claseEstiloTexto += ' text-white';
      break;
    case 'borde':
      claseEstiloBoton += ' border border-ruta-sage bg-transparent active:bg-ruta-sage-soft';
      claseEstiloTexto += ' text-ruta-sage';
      break;
    default:
      claseEstiloBoton +=
        ' bg-ruta-sage shadow-md shadow-[#242725]/5 active:bg-ruta-sage-dark active:scale-[0.98]';
      claseEstiloTexto += ' text-white';
      break;
  }

  if (disabled || cargando) {
    claseEstiloBoton += ' opacity-60';
  }

  const claseFinal = `${claseEstiloBoton} ${clasePersonalizada} ${className}`.trim();
  const colorIcono =
    variante === 'borde' || variante === 'secundario' ? '#36533C' : '#FFFFFF';

  return (
    <TouchableOpacity
      className={claseFinal}
      disabled={disabled || cargando}
      activeOpacity={0.8}
      {...resto}
    >
      {cargando ? (
        <ActivityIndicator
          color={variante === 'borde' || variante === 'secundario' ? '#36533C' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          <Text className={claseEstiloTexto}>{titulo}</Text>
          {icono ? <Ionicons name={icono} size={20} color={colorIcono} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export const Button = Boton;
