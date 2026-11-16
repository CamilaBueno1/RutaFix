import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto as Text } from '@/components/ui/Texto';

type Seccion = 'panel' | 'garaje';

const SECCIONES: {
  clave: Seccion;
  etiqueta: string;
  icono: keyof typeof Ionicons.glyphMap;
  ruta: '/(app)/panel' | '/(app)';
}[] = [
  { clave: 'panel', etiqueta: 'Panel', icono: 'grid-outline', ruta: '/(app)/panel' },
  { clave: 'garaje', etiqueta: 'Garaje', icono: 'albums-outline', ruta: '/(app)' },
];

interface NavegacionInferiorProps {
  activa: Seccion;
}

export function NavegacionInferior({ activa }: NavegacionInferiorProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t border-ruta-blue-line bg-white px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {SECCIONES.map((seccion) => {
        const seleccionada = seccion.clave === activa;

        return (
          <TouchableOpacity
            key={seccion.clave}
            accessibilityRole="button"
            accessibilityState={{ selected: seleccionada }}
            accessibilityLabel={seccion.etiqueta}
            className="min-h-12 flex-1 items-center justify-center gap-0.5"
            onPress={() => {
              if (!seleccionada) router.replace(seccion.ruta);
            }}
          >
            <Ionicons
              name={seccion.icono}
              size={20}
              color={seleccionada ? '#2563EB' : '#94A3B8'}
            />
            <Text
              className={`text-[10px] ${
                seleccionada ? 'font-bold text-ruta-blue' : 'font-medium text-[#94A3B8]'
              }`}
            >
              {seccion.etiqueta}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
