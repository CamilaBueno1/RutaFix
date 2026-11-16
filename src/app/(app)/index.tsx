import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Animated,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Easing,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { useVehiculos } from '@/hooks/useVehiculos';
import { sincronizarNotificacionesMantenimiento } from '@/services/notificaciones.service';
import { BotonCerrarSesion } from '@/components/ui/BotonCerrarSesion';
import { FondoClaymorphism } from '@/components/ui/FondoClaymorphism';
import { TIPOS_VEHICULOS } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { FormularioVehiculo } from '@/components/vehiculos/FormularioVehiculo';
import {
  ICONOS_TIPO_VEHICULO,
  TarjetaVehiculo,
} from '@/components/vehiculos/TarjetaVehiculo';
import { NavegacionInferior } from '@/components/ui/NavegacionInferior';

type CreationStep = 'category' | 'form' | 'success';

const COLORES_TIPO_SELECCION: Record<TipoVehiculo, { fondo: string; icono: string }> = {
  car: { fondo: '#EFF6FF', icono: '#0F172A' },
  motorcycle: { fondo: '#FFFBEB', icono: '#B45309' },
  bicycle: { fondo: '#ECFDF5', icono: '#047857' },
  scooter: { fondo: '#ECFEFF', icono: '#0E7490' },
};

const DESCRIPCIONES_TIPO: Record<TipoVehiculo, string> = {
  car: 'Sedán, hatchback, SUV o camioneta.',
  motorcycle: 'Moto urbana, scooter deportiva o de viaje.',
  bicycle: 'Bicicleta de ruta, montaña, fixie o urbana.',
  scooter: 'Monopatín eléctrico y micromovilidad.',
};

const ETIQUETAS_TIPO: Record<TipoVehiculo, string> = {
  car: 'Auto / SUV',
  motorcycle: 'Moto',
  bicycle: 'Bicicleta',
  scooter: 'Scooter / Movilidad eléctrica',
};

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
      <Pantalla className="items-center justify-center bg-[#F8FBFF] px-6">
        <View className="w-full items-center rounded-2xl border border-ruta-blue-line bg-white p-7 shadow-lg shadow-ruta-navy/5">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-2xl bg-ruta-success-soft">
            <Ionicons name="checkmark-circle" size={46} color="#059669" />
          </View>
          <Text className="text-center text-2xl font-extrabold text-ruta-ink">
            ¡Ya está en tu garaje!
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-ruta-muted">
            Tu vehículo quedó guardado. Ahora puedes filtrar tu garaje por categoría.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="mt-6 min-h-[52px] w-full items-center justify-center rounded-xl bg-ruta-navy-deep py-3.5"
            onPress={onClose}
          >
            <Text className="text-sm font-bold text-white">Ver mi garaje</Text>
          </TouchableOpacity>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla className="bg-[#F8FBFF]">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar selección de categoría"
          className="h-10 w-10 items-center justify-center rounded-xl border border-ruta-blue-line bg-white shadow-sm"
          onPress={onClose}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color="#334155" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-1.5 rounded-full border border-ruta-blue-line bg-[#F1F5F9] px-3 py-1.5">
          <View className="h-2 w-2 rounded-full bg-ruta-cyan" />
          <Text className="text-xs font-semibold tracking-tight text-[#334155]">
            Paso 1 de 2 • Tipo de transporte
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center">
          <MaterialCommunityIcons name="car-side" size={22} color="#94A3B8" />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-5 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5">
          <Text className="text-[24px] font-extrabold leading-[30px] tracking-tight text-ruta-navy-deep">
            ¿Qué vehículo vas a agregar?
          </Text>
          <Text className="mt-1.5 text-sm leading-[23px] text-ruta-blue-muted">
            Selecciona el tipo de transporte para preparar su ficha y plan de mantenimiento.
          </Text>
        </View>

        <View className="gap-3">
          {TIPOS_VEHICULOS.map((vehicleType) => {
            const selected = type === vehicleType.valor;
            const colors = COLORES_TIPO_SELECCION[vehicleType.valor];
            return (
              <TouchableOpacity
                key={vehicleType.valor}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-[82px] flex-row items-center justify-between rounded-2xl p-3.5 shadow-sm ${
                  selected
                    ? 'border-2 border-ruta-navy-deep bg-white'
                    : 'border border-ruta-blue-line bg-white'
                }`}
                onPress={() => onSelectType(vehicleType.valor)}
                activeOpacity={0.82}
              >
                <View className="flex-row items-center">
                  <View
                    className="mr-3.5 h-12 w-12 items-center justify-center rounded-xl border border-ruta-blue-soft"
                    style={{ backgroundColor: colors.fondo }}
                  >
                    <MaterialCommunityIcons
                      name={ICONOS_TIPO_VEHICULO[vehicleType.valor]}
                      size={27}
                      color={colors.icono}
                    />
                  </View>
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-bold text-ruta-navy-deep">
                        {ETIQUETAS_TIPO[vehicleType.valor]}
                      </Text>
                      {selected ? (
                        <Text className="rounded bg-ruta-navy-deep px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Activo
                        </Text>
                      ) : null}
                    </View>
                    <Text className="mt-0.5 text-[12.5px] leading-[18px] text-ruta-blue-muted">
                      {DESCRIPCIONES_TIPO[vehicleType.valor]}
                    </Text>
                  </View>
                </View>
                <View
                  className={`mr-1 h-5 w-5 items-center justify-center rounded-full ${
                    selected ? 'bg-ruta-navy-deep' : 'border-2 border-[#CBD5E1] bg-white'
                  }`}
                >
                  {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-4 flex-row items-start gap-3 rounded-2xl border border-[#D6E6FF] bg-[#EFF6FF] p-3.5">
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text className="flex-1 text-[12.5px] leading-5 text-[#475569]">
            Podrás personalizar el apodo, kilometraje inicial y datos técnicos en el siguiente paso.
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-6 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          className="relative min-h-14 flex-row items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ruta-navy-deep px-5 shadow-lg shadow-ruta-navy/10 active:scale-[0.99]"
          onPress={onContinue}
          activeOpacity={0.85}
        >
          <View className="absolute -right-2 -top-3 h-8 w-8 rotate-45 bg-ruta-amber" />
          <Text className="text-base font-semibold text-white">Continuar</Text>
          <Text className="text-xl font-bold text-ruta-amber">→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-3 min-h-11 items-center justify-center"
          onPress={onClose}
        >
          <Text className="text-[15px] font-medium text-ruta-blue-muted">Volver al garaje</Text>
        </TouchableOpacity>
        <View className="mt-3 h-[2px] w-36 self-center rounded-full bg-ruta-cyan">
          <View className="absolute left-1/2 top-[-1px] h-1 w-1 rounded-full bg-ruta-amber" />
        </View>
      </View>
    </Pantalla>
  );
}

export default function VehiclesListScreen() {
  const router = useRouter();
  const { alta } = useLocalSearchParams<{ alta?: string }>();
  const { user } = useAuth();
  const { vehiculos, cargando, error, recargar } = useVehiculos();

  const [selectedType, setSelectedType] = useState<TipoVehiculo | 'todos'>('todos');
  const [creationStep, setCreationStep] = useState<CreationStep | null>(() =>
    alta === 'vehiculo' ? 'category' : null
  );
  const [creationType, setCreationType] = useState<TipoVehiculo>('car');
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
    <Pantalla sinInferior className="bg-[#EAF2FB]">
      <FondoClaymorphism />
      <Animated.View
        className="relative overflow-hidden rounded-b-[28px] bg-[#EDF5FC] px-5 pb-5 pt-3"
        style={entranceStyle}
      >
        <View className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#DBEAFE]" />
        <View className="absolute right-32 top-28 h-12 w-12 rounded-full bg-[#FEF3C7]" />
        <View className="relative">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-xl border border-ruta-blue-line bg-white shadow-sm">
                <MaterialCommunityIcons name="car-side" size={26} color="#192841" />
              </View>
              <View>
                <Text className="text-sm font-extrabold tracking-tight text-ruta-navy">
                  Ruta<Text className="text-ruta-blue">Fix</Text>
                </Text>
                <Text className="mt-0.5 max-w-56 text-xs text-ruta-blue-muted" numberOfLines={1}>
                  {user?.email || 'Tu espacio para lo que te mueve'}
                </Text>
              </View>
            </View>
            <BotonCerrarSesion />
          </View>
          <View className="mt-5">
            <Text className="text-[28px] font-extrabold leading-[34px] tracking-tight text-ruta-navy-deep">
              Garaje
            </Text>
          </View>
          <View className="mt-4">
            <View className="flex-row items-center gap-3 rounded-2xl border border-ruta-blue-line bg-white px-3.5 py-3 shadow-sm">
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
              {vehiculos.length > 0 ? (
                <View className="flex-row items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-ruta-success-soft px-2.5 py-1">
                  <Ionicons name="checkmark-circle" size={15} color="#059669" />
                  <Text className="text-[11px] font-bold text-ruta-success">Registrados</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Agregar vehículo"
              className="mt-4 min-h-16 flex-row items-center justify-between rounded-2xl bg-ruta-navy-deep p-3.5 shadow-lg shadow-ruta-navy/15 active:scale-[0.99]"
              activeOpacity={0.85}
              onPress={() => {
                setCreationType('car');
                setCreationStep('category');
              }}
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
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
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
                ? 'border-ruta-navy-deep bg-ruta-navy-deep'
                : 'border-ruta-blue-line bg-white shadow-sm shadow-ruta-navy/5'
            }`}
            onPress={() => setSelectedType('todos')}
          >
            <View className="flex-row items-center gap-1.5">
              <Text className={`text-[12.5px] font-bold ${selectedType === 'todos' ? 'text-white' : 'text-[#334155]'}`}>
                Todos
              </Text>
              <View className="rounded-full bg-ruta-amber px-1.5 py-0.5">
                <Text className="text-[10px] font-extrabold text-ruta-navy-deep">{vehiculos.length}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {TIPOS_VEHICULOS.map((tipo) => {
            const count = vehiculos.filter((vehicle) => vehicle.type === tipo.valor).length;
            const isActive = selectedType === tipo.valor;
            const etiqueta = {
              car: 'Autos',
              motorcycle: 'Motos',
              bicycle: 'Bicicletas',
              scooter: 'Scooters',
            }[tipo.valor];
            return (
              <TouchableOpacity
                key={tipo.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={`rounded-full border-2 px-4 py-2 ${
                  isActive
                    ? 'border-ruta-navy-deep bg-ruta-navy-deep'
                    : 'border-ruta-blue-line bg-white shadow-sm shadow-ruta-navy/5'
                }`}
                onPress={() => setSelectedType(tipo.valor)}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[12.5px] font-semibold ${isActive ? 'text-white' : 'text-[#334155]'}`}>
                    {etiqueta}
                  </Text>
                  <View className={`rounded-full px-1.5 py-0.5 ${isActive ? 'bg-ruta-amber' : 'bg-[#F1F5F9]'}`}>
                    <Text className="text-[10px] font-bold text-[#475569]">{count}</Text>
                  </View>
                </View>
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
          <ActivityIndicator size="large" color="#2563EB" />
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
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <Animated.View className="items-center justify-center px-6 py-14" style={entranceStyle}>
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-2xl border border-ruta-blue-line bg-ruta-blue-soft shadow-md shadow-ruta-navy/5">
                <View className="h-16 w-16 items-center justify-center rounded-xl bg-white">
                  <MaterialCommunityIcons name="car-side" size={36} color="#2563EB" />
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
                <Text className="text-xs font-semibold text-ruta-blue">
                  Empieza con el botón “Agregar vehículo” de arriba.
                </Text>
              ) : null}
            </Animated.View>
          }
        />
      )}

      <NavegacionInferior activa="garaje" />
    </Pantalla>
  );
}
