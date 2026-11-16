import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { useAuth } from '@/context/AuthProvider';
import { useVehiculos } from '@/hooks/useVehiculos';
import { TIPOS_VEHICULOS } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';

export default function MisVehiculosScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
    <Pantalla sinInferior className="bg-[#F8FBFF]">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-ruta-navy-deep">
            <MaterialCommunityIcons name="car-side" size={25} color="#FBBF24" />
          </View>
          <View>
            <Text className="text-sm font-extrabold tracking-tight text-ruta-navy">
              Ruta<Text className="text-ruta-blue">Fix</Text>
              <Text className="text-ruta-amber"> • </Text>
              <Text className="font-semibold text-ruta-blue-muted">Garaje</Text>
            </Text>
            <Text className="mt-0.5 max-w-56 text-xs text-ruta-blue-muted" numberOfLines={1}>
              {user?.email || 'Mis vehículos'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Agregar vehículo"
          className="h-10 w-10 items-center justify-center rounded-full border border-ruta-blue-line bg-white shadow-sm"
          onPress={agregarVehiculo}
        >
          <Ionicons name="add" size={23} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View className="px-5 pb-3">
        <View className="mb-2 self-start flex-row items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-ruta-blue" />
          <Text className="text-[11px] font-bold uppercase tracking-wide text-ruta-blue">
            Mis vehículos
          </Text>
        </View>
        <Text className="text-[26px] font-extrabold leading-tight tracking-tight text-ruta-navy-deep">
          ¡Hola! Tu garaje te espera.
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-ruta-blue-muted">
          Monitorea el kilometraje y mantenimiento de cada vehículo al instante.
        </Text>
      </View>

      <View className="mx-5 mb-2 flex-row items-center gap-3 rounded-2xl border border-ruta-blue-line bg-white px-3.5 py-3 shadow-sm">
        <View className="h-11 w-11 items-center justify-center rounded-xl border border-[#DBEAFE] bg-ruta-blue-soft">
          <Ionicons name="car-sport" size={23} color="#2563EB" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-2xl font-extrabold leading-none text-ruta-navy-deep">
              {vehiculos.length}
            </Text>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Registrados
            </Text>
          </View>
          <Text className="mt-0.5 text-xs font-medium text-[#475569]">
            Vehículos activos en tu flota
          </Text>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        className="mx-5 mb-2 min-h-14 flex-row items-center justify-between rounded-2xl bg-ruta-navy-deep p-3.5 shadow-lg shadow-ruta-navy/15"
        onPress={agregarVehiculo}
        activeOpacity={0.85}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-ruta-amber">
            <Ionicons name="add" size={23} color="#0F172A" />
          </View>
          <View>
            <Text className="text-[14.5px] font-bold text-white">Agregar vehículo</Text>
            <Text className="mt-0.5 text-[11px] text-[#CBD5E1]">
              Auto, moto, bicicleta o scooter
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {vehiculos.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-center gap-2 px-5 py-3"
          data={[
            { valor: 'todos' as const, etiqueta: 'Todos', cantidad: vehiculos.length },
            ...TIPOS_VEHICULOS.map((tipo) => ({
              valor: tipo.valor,
              etiqueta: {
                car: 'Autos',
                motorcycle: 'Motos',
                bicycle: 'Bicicletas',
                scooter: 'Scooters',
              }[tipo.valor],
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
                className={`rounded-full border-2 px-3.5 py-1.5 ${
                  activo
                    ? 'border-ruta-navy-deep bg-ruta-navy-deep'
                    : 'border-ruta-blue-line bg-white shadow-sm'
                }`}
                onPress={() => setTipoSeleccionado(item.valor)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activo ? 'text-white' : 'text-[#334155]'
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
          <ActivityIndicator size="large" color="#2563EB" />
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
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-6 py-14">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-ruta-blue-soft">
                <Ionicons name="car-outline" size={38} color="#2563EB" />
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
                  className="mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ruta-navy-deep px-5"
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
