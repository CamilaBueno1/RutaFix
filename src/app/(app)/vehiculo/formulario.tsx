import { EntradaTexto } from '@/components/ui/EntradaTexto';
import {
  actualizarVehiculo,
  crearVehiculo,
  obtenerVehiculoPorId,
  TIPOS_VEHICULOS,
} from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONOS_TIPO_VEHICULO: Record<TipoVehiculo, keyof typeof Ionicons.glyphMap> = {
  car: 'car-sport',
  motorcycle: 'bicycle',
  bicycle: 'bicycle-outline',
  scooter: 'flash',
};

export default function PantallaFormularioVehiculo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [type, setType] = useState<TipoVehiculo>('car');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [currentKm, setCurrentKm] = useState('0');

  const [loading, setLoading] = useState(false);
  const [loadedVehicleId, setLoadedVehicleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetching = Boolean(id) && loadedVehicleId !== id;

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
          setCurrentKm(String(data.current_km ?? 0));
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

    if (!/^\d+$/.test(currentKm.trim())) {
      setErrorMessage('Ingresa un kilometraje entero mayor o igual a 0.');
      return;
    }
    const kmNumber = Number(currentKm);

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
        Alert.alert('Éxito', 'Vehículo actualizado correctamente.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
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
        Alert.alert('Éxito', 'Vehículo registrado correctamente.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error al guardar el vehículo.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga mientras se obtiene el vehículo (modo edición)
  if (fetching) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-500 text-sm mt-3">
          Cargando información del vehículo...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between pb-4 pt-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar formulario"
              className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={21} color="#0F172A" />
            </TouchableOpacity>
            <View className="items-end">
              <Text className="text-xs font-bold uppercase tracking-widest text-blue-700">
                {isEditing ? 'Tu garaje' : 'Nuevo registro'}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">{isEditing ? 'Editar' : 'Paso 1 de 2'}</Text>
            </View>
          </View>

          <View className="mb-5 overflow-hidden rounded-[28px] bg-slate-950 p-5">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
              <Ionicons name="car-sport" size={25} color="#FFFFFF" />
            </View>
            <Text className="text-2xl font-extrabold leading-8 text-white">
              {isEditing ? 'Actualiza los datos de tu vehículo' : 'Tu próximo viaje empieza aquí'}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-slate-300">
              {isEditing
                ? 'Mantén la información de tu compañero de ruta al día.'
                : 'Cuéntanos lo esencial y tendrás todo listo para llevar su mantenimiento.'}
            </Text>
            <View className="mt-4 flex-row items-center gap-2">
              <View className="h-1.5 w-8 rounded-full bg-blue-400" />
              <View className="h-1.5 w-3 rounded-full bg-slate-600" />
              <Text className="ml-1 text-xs font-medium text-slate-300">Rápido y sencillo</Text>
            </View>
          </View>

          {errorMessage ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
              <Ionicons name="alert-circle-outline" size={19} color="#DC2626" />
              <Text className="flex-1 text-sm font-medium leading-5 text-red-700">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View className="mb-4 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="options-outline" size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">¿Qué conduces?</Text>
                <Text className="mt-0.5 text-xs text-slate-500">Elige el tipo de vehículo</Text>
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
                    className={`w-[47%] flex-row items-center gap-2.5 rounded-2xl border px-3 py-3.5 ${
                      selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50'
                    }`}
                    onPress={() => setType(t.valor)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={ICONOS_TIPO_VEHICULO[t.valor]}
                      size={20}
                      color={selected ? '#2563EB' : '#64748B'}
                    />
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-xs font-bold ${
                        selected ? 'text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      {t.etiqueta}
                    </Text>
                    {selected ? <Ionicons name="checkmark-circle" size={17} color="#2563EB" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-4 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Ionicons name="pricetag-outline" size={19} color="#D97706" />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-900">Identidad</Text>
                <Text className="mt-0.5 text-xs text-slate-500">¿Cómo lo reconoces?</Text>
              </View>
            </View>

            <EntradaTexto
              etiqueta="Nombre o apodo *"
              placeholder="Ej. Mi Pulsar"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <EntradaTexto
              etiqueta="Marca"
              placeholder="Ej. Toyota, Bajaj"
              value={brand}
              onChangeText={setBrand}
              returnKeyType="next"
            />

            <EntradaTexto
              etiqueta="Modelo"
              placeholder="Ej. Corolla, NS200"
              value={model}
              onChangeText={setModel}
              returnKeyType="next"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <EntradaTexto
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
                  etiqueta="Placa (opcional)"
                  placeholder="Ej. ABC-1234"
                  value={plate}
                  onChangeText={setPlate}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
            </View>
          </View>

          <View className="mb-5 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Ionicons name="speedometer-outline" size={20} color="#059669" />
              </View>
              <View>
                <Text className="text-base font-bold text-slate-900">Uso actual</Text>
                <Text className="mt-0.5 text-xs text-slate-500">Un punto de partida para el control</Text>
              </View>
            </View>

            <EntradaTexto
              etiqueta="Kilometraje actual (km) *"
              placeholder="0"
              value={currentKm}
              onChangeText={setCurrentKm}
              keyboardType="numeric"
              textoAyuda="En bicis y scooters puedes usar una estimación o ingresar 0."
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={loading}
            className={`mb-3 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-700 py-4 ${
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
                  {isEditing ? 'Guardar cambios' : 'Registrar vehículo'}
                </Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
          <Text className="text-center text-xs text-slate-500">
            Podrás editar esta información cuando quieras.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}