import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Texto as Text } from '@/components/ui/Texto';

interface PropiedadesEntradaTexto extends TextInputProps {
  etiqueta?: string;
  error?: string;
  textoAyuda?: string;
  icono?: keyof typeof Ionicons.glyphMap;
  variante?: 'base' | 'oficial';
}

export function EntradaTexto({
  etiqueta,
  error,
  textoAyuda,
  icono,
  variante = 'base',
  className = '',
  secureTextEntry = false,
  onFocus,
  onBlur,
  multiline,
  ...resto
}: PropiedadesEntradaTexto) {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const estiloOficial = variante === 'oficial';

  const claseContenedor = error
    ? 'border-ruta-clay bg-ruta-clay-soft'
    : enfocado
      ? estiloOficial
        ? 'border-ruta-blue bg-ruta-surface'
        : 'border-ruta-sage bg-ruta-surface'
      : estiloOficial
        ? 'border-ruta-blue-line bg-ruta-blue-input'
        : 'border-ruta-line bg-ruta-surface';

  return (
    <View className={`w-full ${estiloOficial ? 'mb-3.5' : 'mb-4'}`}>
      {etiqueta ? (
        <Text className="mb-1.5 text-[13px] font-semibold text-ruta-ink">{etiqueta}</Text>
      ) : null}

      <View
        className={`flex-row items-center border px-3.5 ${
          estiloOficial ? 'min-h-[52px] rounded-2xl' : 'rounded-xl'
        } ${claseContenedor}`}
      >
        {icono ? (
          <Ionicons
            name={icono}
            size={19}
            color={enfocado ? (estiloOficial ? '#2563EB' : '#4D6B53') : estiloOficial ? '#192841' : '#727972'}
            style={{ marginRight: 10 }}
          />
        ) : null}

        <TextInput
          className={`flex-1 py-3.5 font-ruta text-base text-ruta-ink ${className}`.trim()}
          placeholderTextColor={estiloOficial ? '#7F91A4' : '#727972'}
          secureTextEntry={secureTextEntry ? !mostrarContrasena : false}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(event) => {
            setEnfocado(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setEnfocado(false);
            onBlur?.(event);
          }}
          {...resto}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setMostrarContrasena((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={10}
          >
            <Ionicons
              name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color="#727972"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1.5 text-xs font-medium text-ruta-clay-dark">{error}</Text>
      ) : textoAyuda ? (
        <Text className="mt-1.5 text-xs text-ruta-muted">{textoAyuda}</Text>
      ) : null}
    </View>
  );
}

export const Input = EntradaTexto;
