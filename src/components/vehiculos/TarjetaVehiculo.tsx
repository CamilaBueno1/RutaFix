import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { Texto as Text } from '@/components/ui/Texto';
import { TIPOS_VEHICULOS, type Vehiculo } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';

export const COLORES_TIPO_VEHICULO: Record<TipoVehiculo, { fondo: string; icono: string }> = {
  car: { fondo: '#EAF0EB', icono: '#4D6B53' },
  motorcycle: { fondo: '#F7EDE8', icono: '#984629' },
  bicycle: { fondo: '#F3F4F0', icono: '#3E5141' },
  scooter: { fondo: '#E1E3DF', icono: '#424842' },
};

export const ICONOS_TIPO_VEHICULO: Record<
  TipoVehiculo,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  car: 'car-side',
  motorcycle: 'motorbike',
  bicycle: 'bicycle',
  scooter: 'scooter',
};

interface TarjetaVehiculoProps {
  vehiculo: Vehiculo;
  onPress: () => void;
}

export function TarjetaVehiculo({ vehiculo, onPress }: TarjetaVehiculoProps) {
  const etiquetaDistancia =
    vehiculo.type === 'bicycle' && (vehiculo.current_km == null || vehiculo.current_km === 0)
      ? 'Distancia sin registrar'
      : vehiculo.current_km == null
        ? 'Kilometraje sin registrar'
        : `${vehiculo.current_km.toLocaleString()} km`;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ver ${vehiculo.name}`}
      className="mb-3 overflow-hidden rounded-2xl border border-ruta-line bg-ruta-surface shadow-sm shadow-[#242725]/5"
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3 p-4">
        <View
          className="h-14 w-14 items-center justify-center rounded-[21px]"
          style={{ backgroundColor: COLORES_TIPO_VEHICULO[vehiculo.type].fondo }}
        >
          <MaterialCommunityIcons
            name={ICONOS_TIPO_VEHICULO[vehiculo.type]}
            size={27}
            color={COLORES_TIPO_VEHICULO[vehiculo.type].icono}
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ruta-ink">{vehiculo.name}</Text>
          <Text className="mt-0.5 text-xs text-ruta-muted">
            {[vehiculo.brand, vehiculo.model, vehiculo.year].filter(Boolean).join(' • ') ||
              'Sin detalles adicionales'}
          </Text>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-ruta-sage-soft">
          <Ionicons name="chevron-forward" size={18} color="#4D6B53" />
        </View>
      </View>

      <View className="mx-4 h-px bg-ruta-line" />
      <View className="flex-row items-center justify-between bg-ruta-soft px-4 py-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="speedometer-outline" size={16} color="#4D6B53" />
          <Text className="text-sm font-semibold text-ruta-ink">{etiquetaDistancia}</Text>
        </View>

        {vehiculo.plate ? (
          <View className="rounded-full border border-ruta-line bg-ruta-surface px-3 py-1">
            <Text className="text-[11px] font-semibold tracking-wide text-ruta-muted">
              {vehiculo.plate.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View className="rounded-full bg-ruta-sage-soft px-3 py-1">
            <Text className="text-[11px] font-semibold text-ruta-sage-dark">
              {TIPOS_VEHICULOS.find((tipo) => tipo.valor === vehiculo.type)?.etiqueta ||
                vehiculo.type}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
