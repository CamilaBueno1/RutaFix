import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import { TarjetaVehiculo } from '@/components/vehiculos/TarjetaVehiculo';
import { NavegacionInferior } from '@/components/ui/NavegacionInferior';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { useVehiculos } from '@/hooks/useVehiculos';
import { TIPOS_VEHICULOS } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';

export default function MisVehiculosScreen() {
  const router = useRouter();
  const { vehiculos, cargando, error, recargar } = useVehiculos();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoVehiculo | 'todos'>('todos');
  const filtrados = useMemo(
    () =>
      tipoSeleccionado === 'todos'
        ? vehiculos
        : vehiculos.filter((vehiculo) => vehiculo.type === tipoSeleccionado),
    [tipoSeleccionado, vehiculos]
  );

  const agregarVehiculo = () =>
    router.push({ pathname: '/(app)', params: { alta: 'vehiculo' } });

  return (
    <Pantalla sinInferior className="bg-ruta-canvas">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-ruta-sage-dark">
            RutaFix · Tu garaje
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-ruta-ink">Mis vehículos</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Agregar vehículo"
          className="h-11 w-11 items-center justify-center rounded-xl bg-ruta-sage"
          onPress={agregarVehiculo}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text className="px-5 pb-2 text-sm leading-5 text-ruta-muted">
        Revisa tus vehículos y abre su ficha para ver los detalles.
      </Text>

      {vehiculos.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-center gap-2 px-5 py-3"
          data={[
            { valor: 'todos' as const, etiqueta: 'Todos', cantidad: vehiculos.length },
            ...TIPOS_VEHICULOS.filter((tipo) =>
              vehiculos.some((vehiculo) => vehiculo.type === tipo.valor)
            ).map((tipo) => ({
              valor: tipo.valor,
              etiqueta: tipo.etiqueta,
              cantidad: vehiculos.filter((vehiculo) => vehiculo.type === tipo.valor).length,
            })),
          ]}
          keyExtractor={(item) => item.valor}
          renderItem={({ item }) => {
            const activo = tipoSeleccionado === item.valor;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                className={`rounded-full border px-4 py-2 ${
                  activo
                    ? 'border-ruta-sage bg-ruta-sage'
                    : 'border-ruta-line bg-ruta-surface'
                }`}
                onPress={() => setTipoSeleccionado(item.valor)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activo ? 'text-white' : 'text-ruta-muted'
                  }`}
                >
                  {item.etiqueta} · {item.cantidad}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      {error ? (
        <View className="mx-5 mb-3 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
          <Ionicons name="alert-circle-outline" size={18} color="#984629" />
          <Text className="flex-1 text-xs leading-5 text-ruta-clay-dark">{error}</Text>
        </View>
      ) : null}

      {cargando && vehiculos.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4D6B53" />
          <Text className="mt-3 text-sm text-ruta-muted">Cargando tus vehículos...</Text>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={filtrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaVehiculo
              vehiculo={item}
              onPress={() => router.push(`/(app)/vehiculo/${item.id}`)}
            />
          )}
          contentContainerClassName="px-5 pb-5 pt-2"
          refreshControl={
            <RefreshControl
              refreshing={cargando}
              onRefresh={recargar}
              colors={['#4D6B53']}
              tintColor="#4D6B53"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-6 py-14">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-ruta-sage-soft">
                <Ionicons name="car-outline" size={38} color="#4D6B53" />
              </View>
              <Text className="text-center text-lg font-bold text-ruta-ink">
                {vehiculos.length === 0
                  ? 'Tu garaje empieza aquí'
                  : 'No hay vehículos en esta categoría'}
              </Text>
              <Text className="mt-2 max-w-72 text-center text-sm leading-5 text-ruta-muted">
                {vehiculos.length === 0
                  ? 'Agrega un vehículo para organizar sus datos y próximos servicios.'
                  : 'Prueba otra categoría o vuelve a mostrar todos tus vehículos.'}
              </Text>
              {vehiculos.length === 0 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ruta-sage px-5"
                  onPress={agregarVehiculo}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text className="text-sm font-bold text-white">Agregar vehículo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      <NavegacionInferior activa="vehiculos" />
    </Pantalla>
  );
}
