import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { Texto as Text } from '@/components/ui/Texto';
import { TIPOS_VEHICULOS, type Vehiculo } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';

export const COLORES_TIPO_VEHICULO: Record<TipoVehiculo, { fondo: string; icono: string }> = {
  car: { fondo: '#FFFBEB', icono: '#D97706' },
  motorcycle: { fondo: '#FFFBEB', icono: '#B45309' },
  bicycle: { fondo: '#EFF6FF', icono: '#2563EB' },
  scooter: { fondo: '#ECFEFF', icono: '#0891B2' },
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
      className="mb-3 overflow-hidden rounded-[24px] border border-ruta-blue-line bg-ruta-surface shadow-sm shadow-ruta-navy/5"
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3 p-3.5">
        <View
          className="h-12 w-12 items-center justify-center rounded-xl border border-ruta-blue-line"
          style={{ backgroundColor: COLORES_TIPO_VEHICULO[vehiculo.type].fondo }}
        >
          <MaterialCommunityIcons
            name={ICONOS_TIPO_VEHICULO[vehiculo.type]}
            size={27}
            color={COLORES_TIPO_VEHICULO[vehiculo.type].icono}
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ruta-navy">{vehiculo.name}</Text>
          <Text className="mt-0.5 text-xs font-medium text-ruta-blue-muted">
            {[vehiculo.brand, vehiculo.model, vehiculo.year].filter(Boolean).join(' • ') ||
              'Sin detalles adicionales'}
          </Text>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9]">
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </View>
      </View>

      <View className="h-px bg-ruta-blue-line" />
      <View className="flex-row items-center justify-between bg-[#F8FAFC] px-3.5 py-2.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="speedometer-outline" size={16} color="#2563EB" />
          <Text className="text-[12.5px] font-bold text-[#334155]">{etiquetaDistancia}</Text>
        </View>

        {vehiculo.plate ? (
          <View className="rounded-md border border-ruta-blue-line bg-ruta-surface px-2.5 py-1">
            <Text className="text-[11px] font-extrabold tracking-wide text-ruta-navy">
              {vehiculo.plate.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View className="rounded-md border border-ruta-blue-line bg-ruta-surface px-2.5 py-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-ruta-blue-muted">
              {TIPOS_VEHICULOS.find((tipo) => tipo.valor === vehiculo.type)?.etiqueta ||
                vehiculo.type}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
