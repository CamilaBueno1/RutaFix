import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Animated,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Easing,
  Modal,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { useVehiculos } from '@/hooks/useVehiculos';
import { sincronizarNotificacionesMantenimiento } from '@/services/notificaciones.service';
import { TIPOS_VEHICULOS } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { FormularioVehiculo } from '@/components/vehiculos/FormularioVehiculo';
import {
  COLORES_TIPO_VEHICULO,
  ICONOS_TIPO_VEHICULO,
  TarjetaVehiculo,
} from '@/components/vehiculos/TarjetaVehiculo';
import { NavegacionInferior } from '@/components/ui/NavegacionInferior';

type CreationStep = 'category' | 'form' | 'success';

interface VehicleCreationFlowProps {
  step: CreationStep;
  type: TipoVehiculo;
  onSelectType: (type: TipoVehiculo) => void;
  onContinue: () => void;
  onClose: () => void;
  onSaved: () => void;
}

function VehicleCreationFlow({
  step,
  type,
  onSelectType,
  onContinue,
  onClose,
  onSaved,
}: VehicleCreationFlowProps) {
  if (step === 'form') {
    return (
      <FormularioVehiculo
        key={type}
        initialType={type}
        allowTypeChange={false}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (step === 'success') {
    return (
      <Pantalla className="items-center justify-center bg-ruta-canvas px-6">
        <View className="w-full items-center rounded-2xl border border-ruta-line bg-ruta-surface p-7 shadow-lg shadow-[#242725]/5">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-2xl bg-ruta-sage-soft">
            <Ionicons name="checkmark-circle" size={46} color="#4D6B53" />
          </View>
          <Text className="text-center text-2xl font-extrabold text-ruta-ink">
            ¡Ya está en tu garaje!
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-ruta-muted">
            Tu vehículo quedó guardado. Ahora puedes filtrar tu garaje por categoría.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="mt-6 min-h-[52px] w-full items-center justify-center rounded-xl bg-ruta-sage py-3.5"
            onPress={onClose}
          >
            <Text className="text-sm font-bold text-white">Ver mi garaje</Text>
          </TouchableOpacity>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla className="bg-ruta-canvas">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar selección de categoría"
          className="h-11 w-11 items-center justify-center rounded-xl border border-ruta-line bg-ruta-surface shadow-sm"
          onPress={onClose}
          hitSlop={8}
        >
          <Ionicons name="close" size={21} color="#514F48" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[11px] font-semibold tracking-wide text-ruta-sage">
            Nuevo en tu garaje
          </Text>
          <Text className="mt-0.5 text-xs text-ruta-muted">Paso 1 de 2</Text>
        </View>
        <View className="h-11 w-11" />
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold leading-8 text-ruta-ink">
            ¿Qué vehículo vas a agregar?
          </Text>
          <Text className="mt-2 text-sm leading-5 text-ruta-muted">
            Selecciona el tipo de transporte para preparar su ficha y mantenimiento.
          </Text>
        </View>

        <View className="gap-3">
          {TIPOS_VEHICULOS.map((vehicleType) => {
            const selected = type === vehicleType.valor;
            const colors = COLORES_TIPO_VEHICULO[vehicleType.valor];
            return (
              <TouchableOpacity
                key={vehicleType.valor}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-[88px] flex-row items-start rounded-2xl border p-4 ${
                  selected
                    ? 'border-2 border-ruta-sage bg-ruta-surface shadow-sm shadow-[#242725]/5'
                    : 'border-ruta-line bg-ruta-surface'
                }`}
                onPress={() => onSelectType(vehicleType.valor)}
                activeOpacity={0.82}
              >
                <View
                  className="mr-3.5 h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.fondo }}
                >
                  <MaterialCommunityIcons
                    name={ICONOS_TIPO_VEHICULO[vehicleType.valor]}
                    size={29}
                    color={colors.icono}
                  />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-base font-semibold text-ruta-ink">
                    {vehicleType.etiqueta}
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-ruta-muted">
                    {vehicleType.valor === 'car'
                      ? 'Auto, sedán, hatchback o SUV.'
                      : vehicleType.valor === 'motorcycle'
                        ? 'Moto urbana, scooter o de viaje.'
                        : vehicleType.valor === 'bicycle'
                          ? 'Bicicleta de ruta, montaña o urbana.'
                          : 'Scooter eléctrico y movilidad ligera.'}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color="#4D6B53" />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color="#C2C8C0" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-5 rounded-xl border border-ruta-line bg-ruta-soft p-3.5">
          <Text className="text-xs leading-5 text-ruta-muted">
            Podrás personalizar el apodo, el kilometraje inicial y los datos del vehículo en el
            siguiente paso.
          </Text>
        </View>
      </ScrollView>

      <View className="px-5 pb-4 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-ruta-sage px-5 py-3.5 shadow-md shadow-[#4D6B53]/15 active:scale-[0.98]"
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <Text className="text-sm font-semibold text-white">Continuar</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-1 min-h-11 items-center justify-center"
          onPress={onClose}
        >
          <Text className="text-sm font-medium text-ruta-muted">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Pantalla>
  );
}

export default function VehiclesListScreen() {
  const router = useRouter();
  const { alta } = useLocalSearchParams<{ alta?: string }>();
  const { user, signOut } = useAuth();
  const { vehiculos, cargando, error, recargar } = useVehiculos();

  const [selectedType, setSelectedType] = useState<TipoVehiculo | 'todos'>('todos');
  const [creationStep, setCreationStep] = useState<CreationStep | null>(() =>
    alta === 'vehiculo' ? 'category' : null
  );
  const [creationType, setCreationType] = useState<TipoVehiculo>('car');
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (alta !== 'vehiculo') return;

    router.setParams({ alta: undefined });
  }, [alta, router]);

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  useEffect(() => {
    if (!creationStep || Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (creationStep === 'form') {
        setCreationStep('category');
      } else {
        setCreationStep(null);
      }
      return true;
    });

    return () => subscription.remove();
  }, [creationStep]);

  const entranceStyle = {
    opacity: entrance,
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };

  useFocusEffect(
    useCallback(() => {
      sincronizarNotificacionesMantenimiento().catch((error: unknown) => {
        console.warn('No se pudieron sincronizar los avisos de mantenimiento:', error);
      });
    }, [])
  );

  const filteredVehicles = useMemo(() => {
    if (selectedType === 'todos') return vehiculos;
    return vehiculos.filter((v) => v.type === selectedType);
  }, [vehiculos, selectedType]);

  const handleSignOut = () => {
    setSignOutError(null);
    setSignOutVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      setSignOutLoading(true);
      setSignOutError(null);
      await signOut();
      setSignOutVisible(false);
    } catch (error: unknown) {
      setSignOutError(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión. Intenta de nuevo.'
      );
    } finally {
      setSignOutLoading(false);
    }
  };

  const closeCreation = () => {
    if (creationStep === 'form') {
      setCreationStep('category');
      return;
    }
    setCreationStep(null);
  };

  const handleVehicleSaved = () => {
    setSelectedType('todos');
    setCreationStep('success');
    void recargar();
  };

  if (creationStep) {
    return (
      <VehicleCreationFlow
        step={creationStep}
        type={creationType}
        onSelectType={setCreationType}
        onContinue={() => setCreationStep('form')}
        onClose={closeCreation}
        onSaved={handleVehicleSaved}
      />
    );
  }

  return (
    <Pantalla sinInferior className="bg-ruta-canvas">
      <Animated.View
        className="relative overflow-hidden rounded-b-[28px] bg-ruta-sage-soft px-5 pb-5 pt-3"
        style={entranceStyle}
      >
        <View className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#DCE7DE]" />
        <View className="absolute right-32 top-28 h-12 w-12 rounded-full bg-ruta-clay-soft" />
        <View className="relative">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-xl border border-ruta-line bg-ruta-surface shadow-sm">
                <MaterialCommunityIcons name="car-side" size={26} color="#4D6B53" />
              </View>
              <View>
                <Text className="text-[11px] font-semibold tracking-wide text-ruta-sage-dark">
                  RutaFix · Tu garaje
                </Text>
                <Text className="mt-1 max-w-56 text-xs text-ruta-muted" numberOfLines={1}>
                  {user?.email || 'Un lugar para lo que te mueve'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              className="h-10 w-10 items-center justify-center rounded-full border border-ruta-line bg-ruta-surface shadow-sm"
              onPress={handleSignOut}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={20} color="#36533C" />
            </TouchableOpacity>
          </View>
          <View className="mt-5">
            <View className="mb-2 self-start flex-row items-center gap-2 rounded-full border border-ruta-sage/15 bg-ruta-surface px-3 py-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-ruta-sage" />
              <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-ruta-sage-dark">
                Panel de control
              </Text>
            </View>
            <Text className="text-[27px] font-bold leading-8 text-ruta-ink">
              ¡Hola! Tu garaje te espera.
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ruta-muted">
              Monitorea la distancia y el mantenimiento de tus vehículos.
            </Text>
          </View>
          <View className="mt-4">
            <View className="flex-row items-center gap-3 rounded-xl border border-ruta-line bg-ruta-surface px-3.5 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-ruta-sage-soft">
                <Ionicons name="albums-outline" size={20} color="#4D6B53" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-ruta-ink">{vehiculos.length}</Text>
                <Text className="text-xs font-medium text-ruta-muted">
                  {vehiculos.length === 1 ? 'vehículo registrado' : 'vehículos registrados'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Agregar vehículo"
              className="mt-3 min-h-[58px] flex-row items-center gap-3 rounded-xl bg-ruta-sage px-4 shadow-md shadow-[#4D6B53]/15 active:scale-[0.98]"
              activeOpacity={0.85}
              onPress={() => {
                setCreationType('car');
                setCreationStep('category');
              }}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="add" size={21} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-white">Agregar vehículo</Text>
                <Text className="mt-0.5 text-xs text-white/85">
                  Auto, moto, bicicleta o scooter
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {vehiculos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-center gap-2 px-4 py-4"
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: selectedType === 'todos' }}
            className={`rounded-full border-2 px-4 py-2 ${
              selectedType === 'todos'
                ? 'border-ruta-sage bg-ruta-sage'
                  : 'border-ruta-line bg-ruta-surface shadow-sm shadow-[#242725]/5'
            }`}
            onPress={() => setSelectedType('todos')}
          >
            <Text
              className={`text-xs font-extrabold ${
                selectedType === 'todos' ? 'text-white' : 'text-[#625F57]'
              }`}
            >
              Todos · {vehiculos.length}
            </Text>
          </TouchableOpacity>

          {TIPOS_VEHICULOS.filter((tipo) =>
            vehiculos.some((vehicle) => vehicle.type === tipo.valor)
          ).map((tipo) => {
            const count = vehiculos.filter((vehicle) => vehicle.type === tipo.valor).length;
            const isActive = selectedType === tipo.valor;
            return (
              <TouchableOpacity
                key={tipo.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={`rounded-full border-2 px-4 py-2 ${
                  isActive
                    ? 'border-ruta-sage bg-ruta-sage-soft'
                    : 'border-ruta-line bg-ruta-surface shadow-sm shadow-[#242725]/5'
                }`}
                onPress={() => setSelectedType(tipo.valor)}
              >
                <Text className={`text-xs font-semibold ${isActive ? 'text-ruta-sage-dark' : 'text-ruta-muted'}`}>
                  {tipo.etiqueta} · {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {error ? (
        <View className="mx-4 mt-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3">
          <Text className="text-xs font-medium text-ruta-clay-dark">{error}</Text>
        </View>
      ) : null}

      {cargando && vehiculos.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#4D6B53" />
          <Text className="mt-3 text-sm text-ruta-muted">Cargando tus vehículos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaVehiculo
              vehiculo={item}
              onPress={() => router.push(`/(app)/vehiculo/${item.id}`)}
            />
          )}
          contentContainerClassName="px-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={cargando}
              onRefresh={recargar}
              colors={['#4D6B53']}
            />
          }
          ListEmptyComponent={
            <Animated.View className="items-center justify-center px-6 py-14" style={entranceStyle}>
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-2xl border border-ruta-line bg-ruta-sage-soft shadow-md shadow-[#242725]/5">
                <View className="h-16 w-16 items-center justify-center rounded-xl bg-ruta-surface">
                  <MaterialCommunityIcons name="car-side" size={36} color="#4D6B53" />
                </View>
              </View>
              <Text className="mb-2 text-xl font-bold text-ruta-ink">
                {selectedType === 'todos' ? 'Tu garaje empieza aquí' : 'Aún no tienes de esta categoría'}
              </Text>
              <Text className="mb-5 max-w-70 text-center text-sm leading-5 text-ruta-muted">
                {selectedType === 'todos'
                  ? 'Agrega tu auto, moto, bicicleta o scooter y empieza a cuidar cada kilómetro.'
                  : `No tienes registros en la categoría "${TIPOS_VEHICULOS.find((t) => t.valor === selectedType)?.etiqueta}".`}
              </Text>
              {vehiculos.length === 0 ? (
                <Text className="text-xs font-semibold text-ruta-sage">
                  Empieza con el botón “Agregar vehículo” de arriba.
                </Text>
              ) : null}
            </Animated.View>
          }
        />
      )}

      <Modal
        visible={signOutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutVisible(false)}
      >
        <View className="flex-1 justify-center bg-ruta-ink/35 px-6">
          <View className="rounded-2xl border border-ruta-line bg-ruta-surface p-6 shadow-xl shadow-[#242725]/10">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-xl bg-ruta-clay-soft">
              <Ionicons name="log-out-outline" size={26} color="#984629" />
            </View>
            <Text className="text-2xl font-bold text-ruta-ink">¿Nos vemos pronto?</Text>
            <Text className="mt-2 text-sm leading-5 text-ruta-muted">
              Tu garaje estará aquí cuando regreses.
            </Text>
            {signOutError ? (
              <View className="mt-4 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3">
                <Text className="text-xs font-medium text-ruta-clay-dark">{signOutError}</Text>
              </View>
            ) : null}
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                accessibilityRole="button"
                className="min-h-[52px] flex-1 items-center justify-center rounded-xl bg-ruta-inset py-3.5"
                onPress={() => setSignOutVisible(false)}
                disabled={signOutLoading}
              >
                <Text className="text-sm font-semibold text-ruta-ink">Me quedo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                className={`min-h-[52px] flex-1 items-center justify-center rounded-xl bg-ruta-clay-dark py-3.5 ${
                  signOutLoading ? 'opacity-70' : ''
                }`}
                onPress={() => void confirmSignOut()}
                disabled={signOutLoading}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Cerrar sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <NavegacionInferior activa="garaje" />
    </Pantalla>
  );
}
