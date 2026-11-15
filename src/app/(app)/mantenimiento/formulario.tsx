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
  crearRegistroMantenimiento,
  actualizarRegistroMantenimiento,
  obtenerMantenimientoPorId,
  SERVICIOS_COMUNES,
} from '@/services/mantenimiento.service';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MaintenanceFormScreen() {
  const router = useRouter();
  const { id, vehicle_id, current_km } = useLocalSearchParams<{
    id?: string;
    vehicle_id: string;
    current_km?: string;
  }>();

  const isEditing = Boolean(id);

  const [serviceType, setServiceType] = useState('Cambio de aceite y filtro');
  const [customService, setCustomService] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState(current_km || '0');
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadRecord() {
      try {
        setFetching(true);
        const data = await obtenerMantenimientoPorId(id as string);
        if (data) {
          if (SERVICIOS_COMUNES.includes(data.service_type)) {
            setServiceType(data.service_type);
          } else {
            setServiceType('Otro');
            setCustomService(data.service_type);
          }
          setServiceDate(data.service_date);
          setOdometerKm(String(data.odometer_km));
          setCost(String(data.cost));
          setNotes(data.notes || '');
          setNextDueKm(data.next_due_km != null ? String(data.next_due_km) : '');
          setNextDueDate(data.next_due_date || '');
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'No se pudo cargar el mantenimiento');
        router.back();
      } finally {
        setFetching(false);
      }
    }
    loadRecord();
  }, [id, router]);

  const handleSubmit = async () => {
    const finalType = serviceType === 'Otro' ? customService.trim() : serviceType;
    if (!finalType) {
      setErrorMessage('Por favor especifica el tipo de servicio.');
      return;
    }

    const km = parseInt(odometerKm, 10);
    if (isNaN(km) || km < 0) {
      setErrorMessage('El kilometraje del servicio no puede ser negativo.');
      return;
    }

    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum < 0) {
      setErrorMessage('El costo no puede ser negativo.');
      return;
    }

    let nextKmNum: number | null = null;
    if (nextDueKm.trim()) {
      nextKmNum = parseInt(nextDueKm, 10);
      if (isNaN(nextKmNum) || nextKmNum < 0) {
        setErrorMessage('El próximo kilometraje no puede ser negativo.');
        return;
      }
    }

    if (!vehicle_id) {
      setErrorMessage('Identificador de vehículo no encontrado.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      if (isEditing && id) {
        await actualizarRegistroMantenimiento(id, {
          service_type: finalType,
          service_date: serviceDate.trim(),
          odometer_km: km,
          cost: costNum,
          notes: notes.trim() || null,
          next_due_km: nextKmNum,
          next_due_date: nextDueDate.trim() || null,
        });
        Alert.alert('Éxito', 'Mantenimiento actualizado.');
      } else {
        await crearRegistroMantenimiento({
          vehicle_id,
          service_type: finalType,
          service_date: serviceDate.trim(),
          odometer_km: km,
          cost: costNum,
          notes: notes.trim() || null,
          next_due_km: nextKmNum,
          next_due_date: nextDueDate.trim() || null,
        });
        Alert.alert('Éxito', 'Mantenimiento registrado.');
      }

      router.back();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar el mantenimiento.');
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
          <TouchableOpacity className="p-1" onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900">
            {isEditing ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
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

          <Text className="text-sm font-semibold text-slate-700 mb-2">Tipo de servicio *</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SERVICIOS_COMUNES.map((srv) => {
              const isSelected = serviceType === srv;
              return (
                <TouchableOpacity
                  key={srv}
                  className={`px-3 py-2 rounded-xl border ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                  onPress={() => setServiceType(srv)}
                >
                  <Text
                    className={`text-xs ${
                      isSelected ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
                    }`}
                  >
                    {srv}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {serviceType === 'Otro' ? (
            <EntradaTexto
              etiqueta="Escribe el nombre del servicio *"
              placeholder="Ej: Cambio de líquido refrigerante"
              value={customService}
              onChangeText={setCustomService}
            />
          ) : null}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Fecha del servicio (YYYY-MM-DD) *"
                placeholder="2026-11-14"
                value={serviceDate}
                onChangeText={setServiceDate}
              />
            </View>
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Odómetro / Km al realizar *"
                placeholder="12000"
                value={odometerKm}
                onChangeText={setOdometerKm}
                keyboardType="numeric"
              />
            </View>
          </View>

          <EntradaTexto
            etiqueta="Costo ($) *"
            placeholder="0.00"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />

          <EntradaTexto
            etiqueta="Notas y observaciones (opcional)"
            placeholder="Ej: Se usó aceite sintético 10W-40, filtro original..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            className="h-20"
          />

          <View className="h-px bg-slate-200 my-4" />
          <Text className="text-sm font-bold text-slate-800 mb-1">
            Programar Próximo Servicio (Opcional)
          </Text>
          <Text className="text-xs text-slate-500 mb-3 leading-4">
            Define un límite por kilometraje o fecha para que la app te avise cuándo toca el próximo.
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Próximo km sugerido"
                placeholder="Ej: 15000"
                value={nextDueKm}
                onChangeText={setNextDueKm}
                keyboardType="numeric"
                textoAyuda="Avisa si faltan 500 km"
              />
            </View>
            <View className="flex-1">
              <EntradaTexto
                etiqueta="Próxima fecha límite"
                placeholder="YYYY-MM-DD"
                value={nextDueDate}
                onChangeText={setNextDueDate}
                textoAyuda="Avisa si faltan 15 días"
              />
            </View>
          </View>

          <Boton
            titulo={isEditing ? 'Guardar Cambios' : 'Guardar Mantenimiento'}
            onPress={handleSubmit}
            cargando={loading || fetching}
            clasePersonalizada="mt-3"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
