import { EntradaTexto } from '@/components/ui/EntradaTexto';
import {
  actualizarVehiculo,
  crearVehiculo,
  obtenerVehiculoPorId,
  TIPOS_VEHICULOS,
} from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';

const ICONOS_TIPO_VEHICULO: Record<
  TipoVehiculo,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  car: 'car-side',
  motorcycle: 'motorbike',
  bicycle: 'bicycle',
  scooter: 'scooter',
};

function revealStyle(progress: Animated.Value, distance: number) {
  return {
    opacity: progress,
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
    ],
  };
}

interface FormularioVehiculoProps {
  initialType?: TipoVehiculo;
  allowTypeChange?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
}

export function FormularioVehiculo({
  initialType = 'car',
  allowTypeChange = true,
  onClose,
  onSaved,
}: FormularioVehiculoProps) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const esFlujoPasoDos = !isEditing && !allowTypeChange;

  const [type, setType] = useState<TipoVehiculo>(initialType);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [currentKm, setCurrentKm] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadedVehicleId, setLoadedVehicleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetching = Boolean(id) && loadedVehicleId !== id;
  const [heroEntrance] = useState(() => new Animated.Value(0));
  const [formEntrance] = useState(() => new Animated.Value(0));
  const [footerEntrance] = useState(() => new Animated.Value(0));
  const [iconScale] = useState(() => new Animated.Value(0.65));

  useEffect(() => {
    if (fetching) return;

    const entrance = Animated.stagger(110, [
      Animated.timing(heroEntrance, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formEntrance, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(footerEntrance, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const iconPop = Animated.spring(iconScale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    });

    entrance.start();
    iconPop.start();

    return () => {
      entrance.stop();
      iconPop.stop();
    };
  }, [fetching, footerEntrance, formEntrance, heroEntrance, iconScale]);

  useEffect(() => {
    if (!id) return;

    const vehicleId = id;
    let activo = true;

    async function loadVehicle() {
      try {
        setErrorMessage(null);
        const data = await obtenerVehiculoPorId(vehicleId);

        if (!activo) return;

        if (data) {
          setType(data.type);
          setName(data.name ?? '');
          setBrand(data.brand ?? '');
          setModel(data.model ?? '');
          setYear(data.year ? String(data.year) : '');
          setPlate(data.plate ?? '');
          setCurrentKm(
            data.current_km == null || (data.type === 'bicycle' && data.current_km === 0)
              ? ''
              : String(data.current_km)
          );
        } else {
          Alert.alert('Error', 'No se encontró el vehículo.');
          router.back();
        }
      } catch (err: unknown) {
        if (!activo) return;
        const msg =
          err instanceof Error ? err.message : 'No se pudo cargar la información del vehículo';
        setErrorMessage(msg);
        Alert.alert('Error', msg);
        router.back();
      } finally {
        if (activo) setLoadedVehicleId(vehicleId);
      }
    }

    loadVehicle();

    return () => {
      activo = false;
    };
  }, [id, router]);

  const handleSubmit = async () => {
    // Validaciones
    if (!name.trim()) {
      setErrorMessage('El nombre o apodo del vehículo es obligatorio.');
      return;
    }

    const distanciaTexto = currentKm.trim();
    if (distanciaTexto && !/^\d+$/.test(distanciaTexto)) {
      setErrorMessage('Ingresa una distancia entera mayor o igual a 0.');
      return;
    }
    if (!distanciaTexto && type !== 'bicycle') {
      setErrorMessage('Ingresa el kilometraje actual del vehículo.');
      return;
    }
    const kmNumber = distanciaTexto ? Number(distanciaTexto) : null;
    if (kmNumber != null && !Number.isSafeInteger(kmNumber)) {
      setErrorMessage('La distancia ingresada es demasiado grande.');
      return;
    }

    let yearNumber: number | null = null;
    if (year.trim()) {
      if (!/^\d{4}$/.test(year.trim())) {
        setErrorMessage('Ingresa un año de cuatro dígitos.');
        return;
      }
      yearNumber = Number(year);
      if (yearNumber < 1950 || yearNumber > 2100) {
        setErrorMessage('El año debe estar entre 1950 y 2100.');
        return;
      }
    }

    let savedSuccessfully = false;
    try {
      setLoading(true);
      setErrorMessage(null);

      if (isEditing && id) {
        await actualizarVehiculo(id, {
          type,
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          year: yearNumber,
          plate: plate.trim() || null,
          current_km: kmNumber,
        });
        savedSuccessfully = true;
        if (!onSaved) {
          Alert.alert('Éxito', 'Vehículo actualizado correctamente.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } else {
        await crearVehiculo({
          type,
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          year: yearNumber,
          plate: plate.trim() || null,
          current_km: kmNumber,
        });
        savedSuccessfully = true;
        if (!onSaved) {
          Alert.alert('Éxito', 'Vehículo registrado correctamente.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al guardar el vehículo.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      if (savedSuccessfully) onSaved?.();
    }
  };

  const previewName = name.trim() || 'Tu próximo vehículo';
  const previewDetails = [brand, model, year].map((value) => value.trim()).filter(Boolean).join(' · ');
  const handleTypeChange = (nextType: TipoVehiculo) => {
    setType(nextType);
    setCurrentKm((distance) => {
      if (nextType === 'bicycle' && (distance === '' || distance === '0')) return '';
      return distance;
    });
  };
  const closeForm = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.back();
  };

  // Pantalla de carga mientras se obtiene el vehículo (modo edición)
  if (fetching) {
    return (
      <Pantalla className="items-center justify-center bg-[#F8FBFF]">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-sm text-[#686E69]">
          Cargando información del vehículo...
        </Text>
      </Pantalla>
    );
  }

  return (
    <Pantalla className="bg-[#F8FBFF]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {esFlujoPasoDos ? (
            <>
              <View className="flex-row items-center justify-between pb-3 pt-2">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Volver a elegir categoría"
                  className="h-10 w-10 items-center justify-center rounded-2xl border border-ruta-blue-line bg-white shadow-sm"
                  onPress={closeForm}
                  hitSlop={8}
                >
                  <Ionicons name="arrow-back" size={20} color="#192841" />
                </TouchableOpacity>
                <View className="flex-row items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-white px-3 py-1.5 shadow-sm">
                  <View className="h-2 w-2 rounded-full bg-ruta-blue" />
                  <Text className="text-xs font-bold tracking-tight text-[#1E3A8A]">
                    Paso 2 de 2
                  </Text>
                  <Text className="text-[11px] text-ruta-blue-muted">• Datos</Text>
                </View>
                <View className="h-10 w-10" />
              </View>
              <View className="mb-5 items-center">
                <View className="flex-row items-center gap-2">
                  <View className="relative h-10 w-10 items-center justify-center rounded-full bg-ruta-navy">
                    <MaterialCommunityIcons name="car-side" size={22} color="#FFFFFF" />
                    <View className="absolute bottom-1.5 h-[2px] w-4 rounded-full bg-ruta-amber" />
                  </View>
                  <Text className="text-[32px] font-extrabold leading-none tracking-tight text-ruta-navy">
                    Ruta<Text className="text-ruta-blue">Fix</Text>
                  </Text>
                </View>
                <Text className="mt-1 text-[13px] font-medium tracking-tight text-[#475569]">
                  Tu vehículo, siempre en buenas manos
                </Text>
                <View className="mt-1 h-[2px] w-32 rounded-full bg-ruta-amber" />
              </View>
            </>
          ) : (
            <View className="flex-row items-center justify-between pb-4 pt-2">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={allowTypeChange ? 'Cerrar formulario' : 'Volver a elegir categoría'}
                className="h-11 w-11 items-center justify-center rounded-xl border border-ruta-line bg-ruta-surface shadow-sm"
                onPress={closeForm}
                hitSlop={8}
              >
                <Ionicons name="arrow-back" size={21} color="#242725" />
              </TouchableOpacity>
              <View className="items-end">
                <Text className="text-xs font-semibold tracking-wide text-ruta-sage-dark">
                  {isEditing ? 'Tu garaje' : 'Nuevo registro'}
                </Text>
                <Text className="mt-0.5 text-xs text-ruta-muted">
                  {isEditing ? 'Editando vehículo' : 'Datos del vehículo'}
                </Text>
              </View>
            </View>
          )}

          {!isEditing && !allowTypeChange ? (
            <>
              <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E0EDFF]">
                    <MaterialCommunityIcons
                      name={ICONOS_TIPO_VEHICULO[type]}
                      size={23}
                      color="#2563EB"
                    />
                  </View>
                  <View>
                    <Text className="text-[11px] leading-none text-ruta-blue-muted">Tipo seleccionado</Text>
                    <Text className="mt-0.5 text-[15px] font-bold text-ruta-navy">
                      {TIPOS_VEHICULOS.find((item) => item.valor === type)?.etiqueta}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  className="flex-row items-center gap-1 rounded-lg px-2 py-2"
                  onPress={closeForm}
                >
                  <Text className="text-[13px] font-bold text-ruta-blue">Cambiar</Text>
                  <Ionicons name="create-outline" size={15} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {!isEditing && !allowTypeChange ? null : (
            <>
              <Animated.View
            className="relative mb-5 overflow-hidden rounded-[28px] border border-white bg-[#EAF0EB] p-6 shadow-lg shadow-[#5D665C]/10"
            style={revealStyle(heroEntrance, 20)}
          >
            <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[22px] border-[#DDE7DD]" />
            <View className="absolute right-8 top-20 h-16 w-16 rounded-full bg-[#F7EDE8]" />
            <View className="relative">
              <View className="mb-5 flex-row items-center justify-between">
                <Animated.View
                  className="h-14 w-14 items-center justify-center rounded-[20px] border border-white bg-[#4D6B53] shadow-md shadow-[#5C7460]/15"
                  style={{ transform: [{ scale: iconScale }] }}
                >
                  <MaterialCommunityIcons
                    name={ICONOS_TIPO_VEHICULO[type]}
                    size={30}
                    color="#FFFFFF"
                  />
                </Animated.View>
                <View className="rounded-full border border-white bg-white/70 px-3 py-1.5">
                  <Text className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#36533C]">
                    RUTAFIX · GARAGE
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] font-extrabold uppercase tracking-[2px] text-[#36533C]">
                {isEditing ? 'Mantén todo al día' : 'Empieza por lo esencial'}
              </Text>
              <Text className="mt-2 text-[26px] font-extrabold leading-[32px] text-[#242725]">
                {isEditing ? 'Actualiza tu vehículo' : 'Tu ruta merece un buen comienzo'}
              </Text>
              <Text className="mt-2 max-w-[310px] text-sm leading-5 text-[#686E69]">
                {isEditing
                  ? 'Ajusta los datos y sigue llevando su mantenimiento al día.'
                  : 'Regístralo y tendrás sus datos y mantenimiento siempre a mano.'}
              </Text>
              <View className="mt-5 flex-row items-center gap-2">
                <Ionicons name="time-outline" size={15} color="#36533C" />
                <Text className="text-xs font-semibold text-[#36533C]">Toma menos de un minuto</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            className="mb-5 flex-row items-center rounded-[24px] border border-white bg-white p-4 shadow-md shadow-[#5D665C]/10"
            style={revealStyle(heroEntrance, 20)}
          >
            <View className="mr-4 h-[62px] w-[62px] items-center justify-center rounded-[22px] bg-[#EAF0EB]">
              <MaterialCommunityIcons
                name={ICONOS_TIPO_VEHICULO[type]}
                size={34}
                color="#4D6B53"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#36533C]">
                Vista previa · {TIPOS_VEHICULOS.find((item) => item.valor === type)?.etiqueta}
              </Text>
              <Text className="mt-1 text-base font-extrabold text-[#242725]" numberOfLines={1}>
                {previewName}
              </Text>
              <Text className="mt-0.5 text-xs text-[#686E69]" numberOfLines={1}>
                {previewDetails || 'Tu vehículo aparecerá así en el garaje'}
              </Text>
            </View>
            <View className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-[#EAF0EB]">
              <Ionicons name="sparkles" size={16} color="#4D6B53" />
            </View>
          </Animated.View>
            </>
          )}

          {errorMessage ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-4">
              <Ionicons name="alert-circle-outline" size={19} color="#984629" />
              <Text className="flex-1 text-sm font-medium leading-5 text-ruta-clay-dark">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {allowTypeChange ? (
            <Animated.View
            className="mb-4 rounded-[24px] border border-white bg-white p-5 shadow-md shadow-[#5D665C]/10"
            style={revealStyle(formEntrance, 24)}
          >
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0EB]">
                <Ionicons name="options-outline" size={21} color="#36533C" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-[#242725]">¿Qué te mueve?</Text>
                <Text className="mt-0.5 text-xs text-[#686E69]">Elige el tipo de vehículo</Text>
              </View>
              <View className="rounded-full bg-[#F3F4F0] px-2.5 py-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-[#36533C]">
                  01
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {TIPOS_VEHICULOS.map((t) => {
                const selected = type === t.valor;
                return (
                  <TouchableOpacity
                    key={t.valor}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`min-h-[60px] w-[47%] flex-row items-center gap-2.5 rounded-2xl border px-3 py-3.5 ${
                      selected
                        ? 'border-[#4D6B53] bg-[#4D6B53] shadow-sm shadow-[#5C7460]/15'
                        : 'border-[#E4DFD5] bg-[#F7F5F0]'
                    }`}
                    onPress={() => handleTypeChange(t.valor)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={ICONOS_TIPO_VEHICULO[t.valor]}
                      size={20}
                      color={selected ? '#FFFFFF' : '#686E69'}
                    />
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-xs font-bold ${
                        selected ? 'text-white' : 'text-[#686E69]'
                      }`}
                    >
                      {t.etiqueta}
                    </Text>
                    {selected ? <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            </Animated.View>
          ) : null}

          <Animated.View
            className={`mb-4 ${
              esFlujoPasoDos
                ? 'bg-transparent p-0'
                : 'rounded-[24px] border border-white bg-white p-5 shadow-md shadow-[#5D665C]/10'
            }`}
            style={revealStyle(formEntrance, 24)}
          >
            {esFlujoPasoDos ? (
              <View className="mb-3.5 flex-row items-center justify-between px-0.5">
                <View>
                  <Text className="text-[20px] font-extrabold leading-tight tracking-tight text-ruta-navy">
                    Dale identidad
                  </Text>
                  <Text className="text-[13px] text-ruta-blue-muted">
                    ¿Cómo reconoces a tu vehículo en RutaFix?
                  </Text>
                </View>
                <Text className="rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[11px] font-extrabold text-ruta-blue">
                  01
                </Text>
              </View>
            ) : (
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#F7EDE8]">
                  <Ionicons name="pricetag-outline" size={20} color="#984629" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-[#242725]">Dale identidad</Text>
                  <Text className="mt-0.5 text-xs text-[#686E69]">¿Cómo lo reconoces?</Text>
                </View>
                <View className="rounded-full bg-[#F8F1EA] px-2.5 py-1">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-ruta-clay-dark">
                    {allowTypeChange ? '02' : '01'}
                  </Text>
                </View>
              </View>
            )}

            <EntradaTexto
              variante={esFlujoPasoDos ? 'oficial' : 'base'}
              etiqueta="Nombre o apodo *"
              placeholder="Ej. Mi Pulsar"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <EntradaTexto
              variante={esFlujoPasoDos ? 'oficial' : 'base'}
              etiqueta="Marca"
              placeholder="Ej. Toyota, Bajaj"
              value={brand}
              onChangeText={setBrand}
              returnKeyType="next"
            />

            <EntradaTexto
              variante={esFlujoPasoDos ? 'oficial' : 'base'}
              etiqueta="Modelo"
              placeholder="Ej. Corolla, NS200"
              value={model}
              onChangeText={setModel}
              returnKeyType="next"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <EntradaTexto
                  variante={esFlujoPasoDos ? 'oficial' : 'base'}
                  etiqueta="Año"
                  placeholder="Ej. 2022"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View className="flex-1">
                <EntradaTexto
                  variante={esFlujoPasoDos ? 'oficial' : 'base'}
                  etiqueta="Placa (opcional)"
                  placeholder="Ej. ABC-1234"
                  value={plate}
                  onChangeText={setPlate}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View
            className={`mb-5 ${
              esFlujoPasoDos
                ? 'bg-transparent p-0'
                : 'rounded-[24px] border border-white bg-white p-5 shadow-md shadow-[#5D665C]/10'
            }`}
            style={revealStyle(formEntrance, 24)}
          >
            {!esFlujoPasoDos ? (
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0EB]">
                  <Ionicons name="speedometer-outline" size={21} color="#4D6B53" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-[#242725]">
                    {type === 'bicycle' ? 'Distancia recorrida' : 'Punto de partida'}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#686E69]">
                    {type === 'bicycle'
                      ? 'Opcional: ayuda a planificar el cuidado de la bici.'
                      : 'Kilómetros para empezar el control'}
                  </Text>
                </View>
                <View className="rounded-full bg-[#F3F4F0] px-2.5 py-1">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-ruta-sage">
                    {allowTypeChange ? '03' : '02'}
                  </Text>
                </View>
              </View>
            ) : null}

            <EntradaTexto
              variante={esFlujoPasoDos ? 'oficial' : 'base'}
              etiqueta={
                type === 'bicycle'
                  ? 'Distancia recorrida (km) · opcional'
                  : 'Kilometraje actual (km) *'
              }
              placeholder={type === 'bicycle' ? 'Déjalo vacío si no lo sabes' : '0'}
              value={currentKm}
              onChangeText={setCurrentKm}
              keyboardType="numeric"
              textoAyuda={
                esFlujoPasoDos && type === 'bicycle'
                  ? 'Las bicicletas no tienen odómetro; anota la distancia si llevas ese control.'
                  : !esFlujoPasoDos && type === 'bicycle'
                  ? 'Las bicicletas no tienen odómetro; anota los kilómetros si llevas ese control.'
                  : !esFlujoPasoDos
                    ? 'Usa la lectura del odómetro del vehículo.'
                    : undefined
              }
            />
          </Animated.View>

          <Animated.View style={revealStyle(footerEntrance, 18)}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={loading}
              className={`mb-3 flex-row items-center justify-center gap-2 rounded-2xl border border-white ${
                esFlujoPasoDos
                  ? 'bg-ruta-navy-deep shadow-lg shadow-ruta-navy/20'
                  : 'bg-[#4D6B53] shadow-md shadow-[#5C7460]/15'
              } py-4.5 ${
                loading ? 'opacity-70' : ''
              }`}
              activeOpacity={0.8}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-base font-bold text-white">
                    {isEditing
                      ? 'Guardar cambios'
                      : esFlujoPasoDos
                        ? 'Guardar vehículo'
                        : 'Agregar a mi garaje'}
                  </Text>
                  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
            <View className="mb-4 flex-row items-center justify-center gap-2">
              {esFlujoPasoDos ? null : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={15} color="#686E69" />
                  <Text className="text-center text-xs text-[#686E69]">
                    Podrás editar esta información cuando quieras.
                  </Text>
                </>
              )}
              {esFlujoPasoDos ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  className="min-h-10 items-center justify-center px-4"
                  onPress={closeForm}
                >
                  <Text className="text-[13.5px] font-semibold text-ruta-blue-muted">
                    ← Volver al paso anterior
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
