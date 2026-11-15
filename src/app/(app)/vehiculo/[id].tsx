import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { obtenerVehiculoPorId, eliminarVehiculo, actualizarVehiculo, type Vehiculo } from '@/services/vehiculos.service';
import { useMantenimiento } from '@/hooks/useMantenimiento';
import { InsigniaEstado } from '@/components/ui/InsigniaEstado';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehiculo | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const {
    registros,
    costoTotal,
    estadoServicio,
    cargando: loadingRecords,
    recargar: refreshRecords,
    eliminarRegistro: removeRecord,
  } = useMantenimiento(id, vehicle?.current_km ?? 0);

  const loadVehicleData = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingVehicle(true);
      const data = await obtenerVehiculoPorId(id);
      setVehicle(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo cargar el vehículo');
      router.back();
    } finally {
      setLoadingVehicle(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadVehicleData();
  }, [loadVehicleData]);

  const onRefresh = async () => {
    await Promise.all([loadVehicleData(), refreshRecords()]);
  };

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Eliminar vehículo',
      '¿Estás seguro de que deseas eliminar este vehículo? Se eliminarán también todos sus mantenimientos registrados de forma permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await eliminarVehiculo(id);
              Alert.alert('Vehículo eliminado');
              router.replace('/(app)');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el vehículo');
            }
          },
        },
      ]
    );
  };

  const handleUpdateKm = () => {
    if (!vehicle) return;
    Alert.prompt
      ? Alert.prompt(
          'Actualizar Kilometraje',
          `Kilometraje actual: ${vehicle.current_km} km`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Guardar',
              onPress: async (val?: string) => {
                if (!val) return;
                const newKm = parseInt(val, 10);
                if (isNaN(newKm) || newKm < 0) {
                  Alert.alert('Error', 'El kilometraje debe ser un número mayor o igual a 0.');
                  return;
                }
                try {
                  const updated = await actualizarVehiculo(vehicle.id, { current_km: newKm });
                  setVehicle(updated);
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'No se pudo actualizar el kilometraje');
                }
              },
            },
          ],
          'plain-text',
          String(vehicle.current_km),
          'numeric'
        )
      : router.push({ pathname: '/(app)/vehiculo/formulario', params: { id: vehicle.id } });
  };

  const handleDeleteRecord = (recordId: string, serviceType: string) => {
    Alert.alert(
      'Eliminar registro',
      `¿Deseas eliminar el registro "${serviceType}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeRecord(recordId);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el registro');
            }
          },
        },
      ]
    );
  };

  if (loadingVehicle && !vehicle) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-500 text-sm mt-3">Cargando información del vehículo...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-slate-50">
        <Text className="text-red-500 text-base mb-4 font-semibold">No se encontró el vehículo.</Text>
        <TouchableOpacity
          className="bg-blue-600 px-4 py-2.5 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-slate-200">
        <TouchableOpacity className="p-1.5" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 flex-1 text-center mx-2" numberOfLines={1}>
          {vehicle.name}
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-1.5"
            onPress={() => router.push({ pathname: '/(app)/vehiculo/formulario', params: { id: vehicle.id } })}
          >
            <Ionicons name="create-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1.5" onPress={handleDeleteVehicle}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={loadingRecords || loadingVehicle}
            onRefresh={onRefresh}
            colors={['#2563EB']}
          />
        }
      >
        {/* Tarjeta principal del vehículo */}
        <View className="bg-white rounded-2xl p-5 border border-slate-200/80 mb-3.5 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-2xl font-extrabold text-slate-900">{vehicle.name}</Text>
              <Text className="text-sm text-slate-500 mt-1">
                {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' • ') || 'Sin especificar'}
              </Text>
            </View>
            {vehicle.plate ? (
              <View className="bg-amber-100 border border-amber-300 px-2 py-1 rounded-md">
                <Text className="text-xs font-bold text-amber-900 tracking-wider">
                  {vehicle.plate.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row justify-between items-center mt-4 pt-3.5 border-t border-slate-100">
            <View>
              <Text className="text-xs text-slate-400">Odómetro actual</Text>
              <Text className="text-lg font-bold text-slate-900 mt-0.5">
                {vehicle.current_km.toLocaleString()} km
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-xl"
              onPress={handleUpdateKm}
            >
              <Ionicons name="speedometer" size={16} color="#2563EB" />
              <Text className="text-xs font-semibold text-blue-600">Actualizar km</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Estado del próximo servicio (RF-05) */}
        <View className="mb-3.5">
          <Text className="text-sm font-bold text-slate-800 mb-2">Estado del próximo servicio</Text>
          <View className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <InsigniaEstado resultado={estadoServicio} mostrarMotivo />
          </View>
        </View>

        {/* Resumen de gastos y cantidad (RF-04) */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm items-start">
            <Ionicons name="receipt-outline" size={20} color="#2563EB" />
            <Text className="text-xs text-slate-400 mt-1.5">Total servicios</Text>
            <Text className="text-lg font-extrabold text-slate-900 mt-0.5">{registros.length}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm items-start">
            <Ionicons name="cash-outline" size={20} color="#10B981" />
            <Text className="text-xs text-slate-400 mt-1.5">Gasto acumulado</Text>
            <Text className="text-lg font-extrabold text-emerald-700 mt-0.5">
              ${costoTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Historial de mantenimientos (RF-04) */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-slate-800">Historial de Mantenimientos</Text>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 bg-blue-600 px-3.5 py-2 rounded-xl shadow-sm"
            onPress={() =>
              router.push({
                pathname: '/(app)/mantenimiento/formulario',
                params: {
                  vehicle_id: vehicle.id,
                  current_km: String(vehicle.current_km),
                },
              })
            }
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs">+ Servicio</Text>
          </TouchableOpacity>
        </View>

        {registros.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-slate-200/80 shadow-sm">
            <Ionicons name="construct-outline" size={40} color="#94A3B8" />
            <Text className="text-base font-bold text-slate-700 mt-2.5">Sin registros aún</Text>
            <Text className="text-xs text-slate-400 text-center mt-1 mb-4 leading-4 max-w-[260px]">
              Lleva el control de aceites, frenos, llantas o revisiones de este vehículo.
            </Text>
            <TouchableOpacity
              className="bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl"
              onPress={() =>
                router.push({
                  pathname: '/(app)/mantenimiento/formulario',
                  params: {
                    vehicle_id: vehicle.id,
                    current_km: String(vehicle.current_km),
                  },
                })
              }
            >
              <Text className="text-blue-600 font-semibold text-xs">Registrar primer servicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          registros.map((item) => (
            <View key={item.id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200/80 shadow-sm">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2.5">
                  <Text className="text-base font-bold text-slate-900">{item.service_type}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {item.service_date} • {item.odometer_km.toLocaleString()} km
                  </Text>
                </View>
                <Text className="text-base font-extrabold text-emerald-700">
                  ${Number(item.cost).toFixed(2)}
                </Text>
              </View>

              {item.notes ? (
                <Text className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {item.notes}
                </Text>
              ) : null}

              {(item.next_due_km != null || item.next_due_date) ? (
                <View className="flex-row items-center gap-1.5 mt-2 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                  <Ionicons name="calendar-outline" size={14} color="#D97706" />
                  <Text className="text-xs text-amber-800 font-medium">
                    Próximo: {item.next_due_km ? `${item.next_due_km.toLocaleString()} km` : ''}
                    {item.next_due_km && item.next_due_date ? ' o ' : ''}
                    {item.next_due_date ? item.next_due_date : ''}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row justify-end gap-4 mt-3 pt-2.5 border-t border-slate-100">
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/mantenimiento/formulario',
                      params: {
                        id: item.id,
                        vehicle_id: vehicle.id,
                        current_km: String(vehicle.current_km),
                      },
                    })
                  }
                >
                  <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                  <Text className="text-xs font-semibold text-blue-600">Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => handleDeleteRecord(item.id, item.service_type)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text className="text-xs font-semibold text-red-600">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
