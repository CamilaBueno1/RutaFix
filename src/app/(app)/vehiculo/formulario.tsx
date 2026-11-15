import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Boton } from '@/components/ui/Boton';
import {
  crearVehiculo,
  actualizarVehiculo,
  obtenerVehiculoPorId,
  TIPOS_VEHICULOS,
} from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [fetching, setFetching] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadVehicle() {
      try {
        setFetching(true);
        const data = await obtenerVehiculoPorId(id as string);
        if (data) {
          setType(data.type);
          setName(data.name);
          setBrand(data.brand || '');
          setModel(data.model || '');
          setYear(data.year ? String(data.year) : '');
          setPlate(data.plate || '');
          setCurrentKm(String(data.current_km));
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'No se pudo cargar la información del vehículo');
        router.back();
      } finally {
        setFetching(false);
      }
    }
    loadVehicle();
  }, [id, router]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('El nombre o apodo del vehículo es obligatorio.');
      return;
    }

    const kmNumber = parseInt(currentKm, 10);
    if (isNaN(kmNumber) || kmNumber < 0) {
      setErrorMessage('El kilometraje actual no puede ser negativo.');
      return;
    }

    let yearNumber: number | null = null;
    if (year.trim()) {
      yearNumber = parseInt(year, 10);
      if (isNaN(yearNumber) || yearNumber < 1950 || yearNumber > 2100) {
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
        Alert.alert('Éxito', 'Vehículo actualizado correctamente.');
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
        Alert.alert('Éxito', 'Vehículo registrado correctamente.');
      }

      router.back();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error al guardar el vehículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row justify-between items-center px-4 py-3.5 border-b border-slate-200">
          <TouchableOpacity
            className="p-1"
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900">
            {isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </Text>
          <View className="w-6" />
        </View>

        <ScrollView
          contentContainerClassName="p-5 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage ? (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-700 text-xs flex-1 font-medium">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Selector del tipo de vehículo */}
          <Text className="text-sm font-semibold text-slate-700 mb-2">Tipo de vehículo</Text>
          <View className="flex-row gap-2 mb-5">
            {TIPOS_VEHICULOS.map((t) => {
              const selected = type === t.valor;
              return (
                <TouchableOpacity
                  key={t.valor}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    selected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                  onPress={() => setType(t.valor)}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-blue-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {t.etiqueta}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <EntradaTexto
            etiqueta="Nombre o apodo *"
            placeholder="Ej: Mi Pulsar, El consentido, etc."
            value={name}
            onChangeText={setName}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Marca"
                placeholder="Ej: Toyota, Bajaj"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Modelo"
                placeholder="Ej: Corolla, NS200"
                value={model}
                onChangeText={setModel}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Año"
                placeholder="Ej: 2022"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Placa (opcional)"
                placeholder="Ej: ABC-1234"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <EntradaTexto
            etiqueta="Kilometraje actual (km) *"
            placeholder="0"
            value={currentKm}
            onChangeText={setCurrentKm}
            keyboardType="numeric"
            textoAyuda="Para bicis y scooters puedes ingresar una estimación o 0."
          />

          <Boton
            titulo={isEditing ? 'Guardar cambios' : 'Registrar vehículo'}
            onPress={handleSubmit}
            cargando={loading || fetching}
            clasePersonalizada="mt-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
