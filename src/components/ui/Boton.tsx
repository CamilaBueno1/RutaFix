import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

interface PropiedadesBoton extends TouchableOpacityProps {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'peligro' | 'borde';
  cargando?: boolean;
  clasePersonalizada?: string;
}

export function Boton({
  titulo,
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  clasePersonalizada = '',
  ...resto
}: PropiedadesBoton) {
  let claseEstiloBoton = 'rounded-xl py-3.5 px-5 flex-row items-center justify-center';
  let claseEstiloTexto = 'text-base font-bold text-center';

  switch (variante) {
    case 'secundario':
      claseEstiloBoton += ' bg-slate-100 active:bg-slate-200';
      claseEstiloTexto += ' text-slate-800';
      break;
    case 'peligro':
      claseEstiloBoton += ' bg-red-600 active:bg-red-700';
      claseEstiloTexto += ' text-white';
      break;
    case 'borde':
      claseEstiloBoton += ' bg-transparent border-2 border-blue-600 active:bg-blue-50';
      claseEstiloTexto += ' text-blue-600';
      break;
    default:
      claseEstiloBoton += ' bg-blue-600 active:bg-blue-700 shadow-sm';
      claseEstiloTexto += ' text-white';
      break;
  }

  if (disabled || cargando) {
    claseEstiloBoton += ' opacity-50';
  }

  const claseFinal = `${claseEstiloBoton} ${clasePersonalizada} ${className}`.trim();

  return (
    <TouchableOpacity
      className={claseFinal}
      disabled={disabled || cargando}
      activeOpacity={0.75}
      {...resto}
    >
      {cargando ? (
        <ActivityIndicator
          color={variante === 'borde' || variante === 'secundario' ? '#2563EB' : '#FFFFFF'}
        />
      ) : (
        <Text className={claseEstiloTexto}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

export const Button = Boton;
