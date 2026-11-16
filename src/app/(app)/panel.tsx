import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { NavegacionInferior } from '@/components/ui/NavegacionInferior';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { useAuth } from '@/context/AuthProvider';
import { useMantenimiento } from '@/hooks/useMantenimiento';
import { useVehiculos } from '@/hooks/useVehiculos';
import { COLORES_TIPO_VEHICULO, ICONOS_TIPO_VEHICULO } from '@/components/vehiculos/TarjetaVehiculo';

function distanciaDelVehiculo(
  tipo: 'car' | 'motorcycle' | 'bicycle' | 'scooter',
  distancia: number | null
) {
  if (distancia == null || (tipo === 'bicycle' && distancia === 0)) {
    return tipo === 'bicycle' ? 'Distancia sin registrar' : 'Kilometraje sin registrar';
  }
  return `${distancia.toLocaleString()} km`;
}

export default function PanelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { vehiculos, cargando, error, recargar } = useVehiculos();
  const vehiculo = vehiculos[0];
  const distancia = vehiculo?.type === 'bicycle' && vehiculo.current_km === 0
    ? null
    : vehiculo?.current_km ?? null;
  const {
    registros,
    estadoServicio,
    cargando: cargandoMantenimientos,
    error: errorMantenimientos,
    recargar: recargarMantenimientos,
  } = useMantenimiento(vehiculo?.id, distancia);

  const actualizar = useCallback(async () => {
    await Promise.all([recargar(), recargarMantenimientos()]);
  }, [recargar, recargarMantenimientos]);

  const abrirGaraje = () => router.push('/(app)');
  const agregarVehiculo = () =>
    router.push({ pathname: '/(app)', params: { alta: 'vehiculo' } });

  const etiquetaEstado = estadoServicio.etiqueta;
  const estadoPendiente = estadoServicio.estado === 'proximo' || estadoServicio.estado === 'vencido';

  return (
    <Pantalla sinInferior className="bg-ruta-canvas">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6 pt-3"
        refreshControl={
          <RefreshControl
            refreshing={cargando || Boolean(vehiculo && cargandoMantenimientos)}
            onRefresh={() => void actualizar()}
            colors={['#4D6B53']}
            tintColor="#4D6B53"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-ruta-sage shadow-sm">
              <MaterialCommunityIcons name="car-side" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-lg font-extrabold text-ruta-ink">
                <Text className="text-ruta-sage-dark">Ruta</Text>Fix
              </Text>
              <Text className="text-xs text-ruta-muted">Tu centro de mando</Text>
            </View>
          </View>
          <View className="rounded-full border border-ruta-line bg-ruta-surface px-3 py-2">
            <Text className="text-xs font-semibold text-ruta-sage-dark">
              {vehiculos.length} {vehiculos.length === 1 ? 'vehículo' : 'vehículos'}
            </Text>
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-[27px] font-extrabold leading-8 text-ruta-ink">
            Hola, {user?.user_metadata?.name || 'tu ruta te espera'}.
          </Text>
          <Text className="mt-2 text-sm leading-5 text-ruta-muted">
            Dale a cada viaje el cuidado que merece.
          </Text>
        </View>

        {error ? (
          <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
            <Ionicons name="alert-circle-outline" size={18} color="#984629" />
            <Text className="flex-1 text-xs leading-5 text-ruta-clay-dark">{error}</Text>
          </View>
        ) : null}

        {vehiculo ? (
          <View className="mb-5 overflow-hidden rounded-[26px] border border-ruta-sage-dark/20 bg-ruta-sage-dark shadow-md shadow-[#242725]/10">
            <View className="flex-row items-center gap-3 border-b border-white/15 p-4">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: COLORES_TIPO_VEHICULO[vehiculo.type].fondo }}
              >
                <MaterialCommunityIcons
                  name={ICONOS_TIPO_VEHICULO[vehiculo.type]}
                  size={25}
                  color={COLORES_TIPO_VEHICULO[vehiculo.type].icono}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-white/75">
                  En tu garaje
                </Text>
                <Text className="mt-0.5 text-lg font-bold text-white" numberOfLines={1}>
                  {vehiculo.name}
                </Text>
                <Text className="text-xs text-white/75" numberOfLines={1}>
                  {[vehiculo.brand, vehiculo.model, vehiculo.year].filter(Boolean).join(' · ') ||
                    'Detalles por completar'}
                </Text>
              </View>
              <View
                className={`rounded-full px-3 py-1.5 ${
                  estadoPendiente ? 'bg-ruta-clay-soft' : 'bg-white/15'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    estadoPendiente ? 'text-ruta-clay-dark' : 'text-white'
                  }`}
                >
                  {etiquetaEstado}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-4">
              <View>
                <Text className="text-xs text-white/70">
                  {vehiculo.type === 'bicycle' ? 'Distancia actual' : 'Kilometraje actual'}
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-white">
                  {distanciaDelVehiculo(vehiculo.type, vehiculo.current_km)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-2 rounded-xl bg-white px-4"
                onPress={() => router.push(`/(app)/vehiculo/${vehiculo.id}`)}
              >
                <Text className="text-xs font-bold text-ruta-sage-dark">Ver detalle</Text>
                <Ionicons name="arrow-forward" size={16} color="#36533C" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-start gap-2 border-t border-white/15 bg-black/10 px-4 py-3">
              <Ionicons name="construct-outline" size={16} color="#EAF0EB" />
              <Text className="flex-1 text-xs leading-5 text-white/85">
                {estadoServicio.motivo || 'Todavía no hay mantenimientos programados.'}
              </Text>
            </View>
          </View>
        ) : (
          <View className="mb-5 items-center rounded-[26px] border border-ruta-line bg-ruta-surface px-6 py-8">
            {cargando ? (
              <ActivityIndicator size="large" color="#4D6B53" />
            ) : (
              <>
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-ruta-sage-soft">
                  <MaterialCommunityIcons name="garage-variant" size={34} color="#4D6B53" />
                </View>
                <Text className="text-center text-lg font-bold text-ruta-ink">
                  Tu garaje empieza aquí
                </Text>
                <Text className="mt-2 text-center text-sm leading-5 text-ruta-muted">
                  Agrega un vehículo para organizar sus datos y mantenimientos.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ruta-sage px-5"
                  onPress={agregarVehiculo}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text className="text-sm font-bold text-white">Agregar vehículo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {errorMantenimientos ? (
          <View className="mb-4 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
            <Text className="text-xs leading-5 text-ruta-clay-dark">{errorMantenimientos}</Text>
          </View>
        ) : null}

        {vehiculo ? (
          <View className="mb-5 flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-ruta-line bg-ruta-surface p-4">
              <View className="mb-3 h-9 w-9 items-center justify-center rounded-xl bg-ruta-sage-soft">
                <Ionicons name="build-outline" size={19} color="#4D6B53" />
              </View>
              <Text className="text-xl font-extrabold text-ruta-ink">{registros.length}</Text>
              <Text className="mt-1 text-xs leading-4 text-ruta-muted">
                {registros.length === 1 ? 'mantenimiento registrado' : 'mantenimientos registrados'}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-1 rounded-2xl border border-ruta-line bg-ruta-surface p-4"
              onPress={() => router.push(`/(app)/vehiculo/${vehiculo.id}`)}
            >
              <View className="mb-3 h-9 w-9 items-center justify-center rounded-xl bg-ruta-clay-soft">
                <Ionicons name="time-outline" size={19} color="#984629" />
              </View>
              <Text className="text-sm font-bold text-ruta-ink">Historial</Text>
              <Text className="mt-1 text-xs leading-4 text-ruta-muted">Ver el detalle del vehículo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mb-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-base font-bold text-ruta-ink">Acciones rápidas</Text>
              <Text className="mt-0.5 text-xs text-ruta-muted">Continúa donde lo necesitas</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              accessibilityRole="button"
              className="min-h-[104px] flex-1 items-center justify-center rounded-2xl border border-ruta-line bg-ruta-surface px-3 py-4"
              onPress={() => router.push('/(app)/mis-vehiculos')}
            >
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-ruta-sage-soft">
                <Ionicons name="car-outline" size={21} color="#36533C" />
              </View>
              <Text className="text-center text-sm font-bold text-ruta-ink">Mis vehículos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="min-h-[104px] flex-1 items-center justify-center rounded-2xl bg-ruta-sage px-3 py-4"
              onPress={agregarVehiculo}
            >
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="add" size={23} color="#FFFFFF" />
              </View>
              <Text className="text-center text-sm font-bold text-white">Agregar vehículo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-1 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-ruta-ink">Tu garaje</Text>
            <Text className="mt-0.5 text-xs text-ruta-muted">
              {vehiculos.length} {vehiculos.length === 1 ? 'vehículo configurado' : 'vehículos configurados'}
            </Text>
          </View>
          {vehiculos.length > 0 ? (
            <TouchableOpacity
              accessibilityRole="link"
              className="flex-row items-center gap-1 px-2 py-2"
              onPress={abrirGaraje}
            >
              <Text className="text-xs font-bold text-ruta-sage-dark">Ver garaje</Text>
              <Ionicons name="chevron-forward" size={16} color="#36533C" />
            </TouchableOpacity>
          ) : null}
        </View>
        {vehiculos.slice(0, 3).map((item) => (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            className="mt-2 flex-row items-center gap-3 rounded-xl border border-ruta-line bg-ruta-surface p-3"
            onPress={() => router.push(`/(app)/vehiculo/${item.id}`)}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: COLORES_TIPO_VEHICULO[item.type].fondo }}
            >
              <MaterialCommunityIcons
                name={ICONOS_TIPO_VEHICULO[item.type]}
                size={21}
                color={COLORES_TIPO_VEHICULO[item.type].icono}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ruta-ink" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="mt-0.5 text-xs text-ruta-muted">
                {distanciaDelVehiculo(item.type, item.current_km)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#686E69" />
          </TouchableOpacity>
        ))}
        {vehiculos.length > 3 ? (
          <TouchableOpacity
            accessibilityRole="link"
            className="mt-3 min-h-11 items-center justify-center rounded-xl border border-ruta-line bg-ruta-surface"
            onPress={() => router.push('/(app)/mis-vehiculos')}
          >
            <Text className="text-sm font-semibold text-ruta-sage-dark">
              Ver los {vehiculos.length - 3} vehículos restantes
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <NavegacionInferior activa="panel" />
    </Pantalla>
  );
}
