import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PropiedadesEntradaTexto extends TextInputProps {
  etiqueta: string;
  error?: string;
  textoAyuda?: string;
}

export function EntradaTexto({
  etiqueta,
  error,
  textoAyuda,
  className = '',
  secureTextEntry = false,
  ...resto
}: PropiedadesEntradaTexto) {
  const [mostrarContrasena, setMostrarContrasena] = React.useState(false);
  let claseInput = 'bg-slate-50 border rounded-xl px-4 py-3 text-slate-900 text-base';

  if (error) {
    claseInput += ' border-red-500 bg-red-50/50';
  } else {
    claseInput += ' border-slate-300 focus:border-blue-500';
  }

  return (
    <View className="mb-4 w-full">
      <Text className="text-sm font-semibold text-slate-700 mb-1.5">{etiqueta}</Text>
      {secureTextEntry ? (
        <View
          className={`flex-row items-center rounded-xl border bg-slate-50 px-4 ${
            error ? 'border-red-500 bg-red-50/50' : 'border-slate-300'
          }`}
        >
          <TextInput
            className={`flex-1 py-3 text-base text-slate-900 ${className}`.trim()}
            placeholderTextColor="#94A3B8"
            secureTextEntry={!mostrarContrasena}
            {...resto}
          />
          <TouchableOpacity
            onPress={() => setMostrarContrasena((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
          >
            <Ionicons
              name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TextInput
          className={`${claseInput} ${className}`.trim()}
          placeholderTextColor="#94A3B8"
          secureTextEntry={false}
          {...resto}
        />
      )}
      {error ? (
        <Text className="text-red-500 text-xs mt-1.5 font-medium">{error}</Text>
      ) : textoAyuda ? (
        <Text className="text-slate-500 text-xs mt-1.5">{textoAyuda}</Text>
      ) : null}
    </View>
  );
}

export const Input = EntradaTexto;
