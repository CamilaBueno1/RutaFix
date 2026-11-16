import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  obtenerVehiculoPorId,
  eliminarVehiculo,
  actualizarVehiculo,
  type Vehiculo,
} from '@/services/vehiculos.service';
import { useMantenimiento } from '@/hooks/useMantenimiento';
import { InsigniaEstado } from '@/components/ui/InsigniaEstado';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sincronizarNotificacionesMantenimiento } from '@/services/notificaciones.service';
import {
  COLORES_TIPO_VEHICULO,
  ICONOS_TIPO_VEHICULO,
} from '@/components/vehiculos/TarjetaVehiculo';
import { FondoClaymorphism } from '@/components/ui/FondoClaymorphism';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehiculo | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [kmModalVisible, setKmModalVisible] = useState(false);
  const [kmDraft, setKmDraft] = useState('');
  const [kmSaving, setKmSaving] = useState(false);
  const [kmError, setKmError] = useState<string | null>(null);

  const {
    registros,
    costoTotal,
    estadoServicio,
    cargando: loadingRecords,
    recargar: refreshRecords,
    eliminarRegistro: removeRecord,
  } = useMantenimiento(
    id,
    vehicle?.type === 'bicycle' &&
      (vehicle.current_km == null || vehicle.current_km === 0)
      ? null
      : vehicle?.current_km ?? null
  );

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

  useFocusEffect(
    useCallback(() => {
      void loadVehicleData();
    }, [loadVehicleData])
  );

  useFocusEffect(
    useCallback(() => {
      sincronizarNotificacionesMantenimiento().catch((error: unknown) => {
        console.warn('No se pudieron sincronizar los avisos de mantenimiento:', error);
      });
    }, [])
  );

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
    setKmDraft(
      vehicle.type === 'bicycle' &&
        (vehicle.current_km == null || vehicle.current_km === 0)
        ? ''
        : String(vehicle.current_km ?? '')
    );
    setKmError(null);
    setKmModalVisible(true);
  };

  const guardarKilometraje = async () => {
    if (!vehicle) return;

    const distancia = kmDraft.trim();
    if (distancia && !/^\d+$/.test(distancia)) {
      setKmError('Ingresa un número entero mayor o igual a 0.');
      return;
    }
    if (!distancia && vehicle.type !== 'bicycle') {
      setKmError('Ingresa el kilometraje actual del vehículo.');
      return;
    }

    const newKm = distancia ? Number(distancia) : null;
    if (newKm != null && !Number.isSafeInteger(newKm)) {
      setKmError('La distancia ingresada es demasiado grande.');
      return;
    }

    try {
      setKmSaving(true);
      setKmError(null);
      const updated = await actualizarVehiculo(vehicle.id, { current_km: newKm });
      setVehicle(updated);
      setKmModalVisible(false);
    } catch (error: unknown) {
      setKmError(error instanceof Error ? error.message : 'No se pudo actualizar la distancia.');
    } finally {
      setKmSaving(false);
    }
  };

  const handleDeleteRecord = (recordId: string, serviceType: string) => {
    Alert.alert('Eliminar registro', `¿Deseas eliminar el registro "${serviceType}"?`, [
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
    ]);
  };

  const irANuevoServicio = () => {
    if (!vehicle) return;
    router.push({
      pathname: '/(app)/mantenimiento/formulario',
      params: {
        vehicle_id: vehicle.id,
        current_km:
          vehicle.type === 'bicycle' &&
          (vehicle.current_km == null || vehicle.current_km === 0)
            ? ''
            : String(vehicle.current_km ?? ''),
        vehicle_name: vehicle.name,
        vehicle_label: [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' '),
        vehicle_type: vehicle.type,
      },
    });
  };

  if (loadingVehicle && !vehicle) {
    return (
      <Pantalla className="items-center justify-center bg-[#EAF2FB]">
        <FondoClaymorphism />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-sm text-ruta-blue-muted">Cargando información del vehículo...</Text>
      </Pantalla>
    );
  }

  if (!vehicle) {
    return (
      <Pantalla className="items-center justify-center bg-[#EAF2FB] px-6">
        <FondoClaymorphism />
        <View className="w-full items-center rounded-[26px] border border-ruta-blue-line bg-white p-7 shadow-lg shadow-ruta-navy/5">
          <Ionicons name="alert-circle-outline" size={40} color="#2563EB" />
          <Text className="mt-3 text-base font-bold text-ruta-navy">No se encontró el vehículo.</Text>
          <TouchableOpacity
            className="mt-5 rounded-2xl bg-ruta-navy-deep px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="font-semibold text-white">Volver</Text>
          </TouchableOpacity>
        </View>
      </Pantalla>
    );
  }

  const tipoColor = COLORES_TIPO_VEHICULO[vehicle.type];

  return (
    <Pantalla className="bg-[#EAF2FB]">
      <FondoClaymorphism />
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-11 w-11 items-center justify-center rounded-xl border border-ruta-blue-line bg-white shadow-sm"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={21} color="#192841" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-ruta-blue">
            Detalle del vehículo
          </Text>
          <Text className="mt-0.5 max-w-44 text-xs font-medium text-ruta-blue-muted" numberOfLines={1}>
            {vehicle.name}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Editar vehículo"
            className="h-11 w-11 items-center justify-center rounded-xl border border-ruta-blue-line bg-white shadow-sm"
            onPress={() =>
              router.push({
                pathname: '/(app)/vehiculo/nuevo',
                params: { id: vehicle.id },
              })
            }
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Eliminar vehículo"
            className="h-11 w-11 items-center justify-center rounded-xl border border-ruta-blue-line bg-white shadow-sm"
            onPress={handleDeleteVehicle}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={19} color="#B45309" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingRecords || loadingVehicle}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        <View className="relative mb-4 overflow-hidden rounded-[28px] border border-ruta-blue-line bg-[#EDF5FC] p-5 shadow-lg shadow-ruta-navy/10">
          <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[20px] border-[#DBEAFE]" />
          <View className="absolute right-10 top-24 h-14 w-14 rounded-full bg-[#FEF3C7]" />
          <View className="relative">
            <View className="flex-row items-center gap-4">
              <View
                className="h-16 w-16 items-center justify-center rounded-2xl border border-ruta-blue-line bg-white shadow-sm"
                style={{ backgroundColor: tipoColor.fondo }}
              >
                <MaterialCommunityIcons
                  name={ICONOS_TIPO_VEHICULO[vehicle.type]}
                  size={32}
                  color={tipoColor.icono}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-ruta-blue">
                  Mi vehículo
                </Text>
                <Text className="mt-0.5 text-[25px] font-extrabold leading-7 text-ruta-navy-deep">
                  {vehicle.name}
                </Text>
                <Text className="mt-1 text-xs text-ruta-blue-muted" numberOfLines={1}>
                  {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ') ||
                    'Sin detalles adicionales'}
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-ruta-blue-line bg-white/90 px-4 py-3">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-ruta-blue-muted">
                  {vehicle.type === 'bicycle' ? 'Distancia acumulada' : 'Odómetro actual'}
                </Text>
                <Text className="mt-0.5 text-lg font-extrabold text-ruta-navy-deep">
                  {vehicle.type === 'bicycle' &&
                  (vehicle.current_km == null || vehicle.current_km === 0)
                    ? 'Sin registrar'
                    : vehicle.current_km == null
                      ? 'Sin registrar'
                      : `${vehicle.current_km.toLocaleString()} km`}
                </Text>
              </View>
              {vehicle.plate ? (
                <View className="rounded-xl border border-ruta-blue-line bg-[#F8FAFC] px-3 py-1.5">
                  <Text className="text-xs font-bold tracking-wider text-ruta-blue-muted">
                    {vehicle.plate.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  vehicle.type === 'bicycle'
                    ? 'Actualizar distancia acumulada'
                    : 'Actualizar kilometraje'
                }
                className="flex-row items-center gap-1.5 rounded-xl bg-ruta-blue-soft px-3 py-2"
                onPress={handleUpdateKm}
              >
                {vehicle.type === 'bicycle' ? (
                  <MaterialCommunityIcons name="bicycle" size={17} color="#2563EB" />
                ) : (
                  <Ionicons name="speedometer-outline" size={16} color="#2563EB" />
                )}
                <Text className="text-xs font-bold text-ruta-blue">Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-[24px] border border-ruta-blue-line bg-white p-5 shadow-md shadow-ruta-navy/5">
          <View className="mb-3 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-ruta-blue-soft">
              <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" />
            </View>
            <Text className="flex-1 text-base font-extrabold text-ruta-navy-deep">
              Estado del próximo servicio
            </Text>
          </View>
          <InsigniaEstado resultado={estadoServicio} mostrarMotivo />
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 rounded-[22px] border border-ruta-blue-line bg-white p-4 shadow-md shadow-ruta-navy/5">
            <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-ruta-blue-soft">
              <Ionicons name="construct-outline" size={18} color="#2563EB" />
            </View>
            <Text className="text-[11px] font-semibold text-ruta-blue-muted">Servicios</Text>
            <Text className="mt-0.5 text-xl font-extrabold text-ruta-navy-deep">{registros.length}</Text>
          </View>
          <View className="flex-1 rounded-[22px] border border-ruta-blue-line bg-white p-4 shadow-md shadow-ruta-navy/5">
            <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-ruta-amber-soft">
              <Ionicons name="cash-outline" size={18} color="#B45309" />
            </View>
            <Text className="text-[11px] font-semibold text-ruta-blue-muted">Gasto acumulado</Text>
            <Text className="mt-0.5 text-xl font-extrabold text-ruta-clay-dark">
              ${costoTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-extrabold text-ruta-navy-deep">Historial de mantenimientos</Text>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 rounded-xl bg-ruta-navy-deep px-3.5 py-2 shadow-sm shadow-ruta-navy/10"
            onPress={irANuevoServicio}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Servicio</Text>
          </TouchableOpacity>
        </View>

        {registros.length === 0 ? (
          <View className="items-center rounded-[24px] border border-ruta-blue-line bg-white p-8 shadow-md shadow-ruta-navy/5">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-ruta-blue-soft">
              <Ionicons name="construct-outline" size={30} color="#2563EB" />
            </View>
            <Text className="text-base font-bold text-ruta-navy-deep">Sin registros aún</Text>
            <Text className="mb-5 mt-1.5 max-w-64 text-center text-xs leading-5 text-ruta-blue-muted">
              {vehicle.type === 'bicycle'
                ? 'Lleva el control de cadena, frenos, neumáticos o ajustes de tu bicicleta.'
                : 'Lleva el control de aceite, frenos, neumáticos o revisiones de este vehículo.'}
            </Text>
            <TouchableOpacity
              className="rounded-xl border border-ruta-blue-line bg-ruta-blue-soft px-4 py-2.5"
              onPress={irANuevoServicio}
            >
              <Text className="text-xs font-bold text-ruta-blue">Registrar primer servicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          registros.map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-[22px] border border-ruta-blue-line bg-white p-4 shadow-md shadow-ruta-navy/5"
            >
              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-base font-bold text-ruta-navy-deep">{item.service_type}</Text>
                  <Text className="mt-1 text-xs text-ruta-blue-muted">
                    {item.service_date} ·{' '}
                    {vehicle.type === 'bicycle' &&
                    (item.odometer_km == null || item.odometer_km === 0)
                      ? 'Distancia sin registrar'
                      : item.odometer_km == null
                        ? 'Distancia sin registrar'
                        : `${item.odometer_km.toLocaleString()} km`}
                  </Text>
                </View>
                <Text className="text-base font-extrabold text-ruta-clay-dark">
                  ${Number(item.cost).toFixed(2)}
                </Text>
              </View>

              {item.notes ? (
                <Text className="mt-3 rounded-xl border border-ruta-blue-line bg-[#F8FAFC] p-2.5 text-xs text-ruta-blue-muted">
                  {item.notes}
                </Text>
              ) : null}

              {item.next_due_km != null || item.next_due_date ? (
                <View className="mt-3 flex-row items-center gap-1.5 rounded-lg border border-ruta-amber/30 bg-ruta-amber-soft px-2.5 py-1.5">
                  <Ionicons name="calendar-outline" size={14} color="#B45309" />
                  <Text className="text-xs font-medium text-ruta-clay-dark">
                    Próximo:{' '}
                    {item.next_due_km != null ? `${item.next_due_km.toLocaleString()} km` : ''}
                    {item.next_due_km != null && item.next_due_date ? ' o ' : ''}
                    {item.next_due_date ? item.next_due_date : ''}
                  </Text>
                </View>
              ) : null}

              <View className="mt-3 flex-row justify-end gap-4 border-t border-ruta-blue-line pt-2.5">
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/mantenimiento/formulario',
                      params: {
                        id: item.id,
                        vehicle_id: vehicle.id,
                        current_km:
                          vehicle.type === 'bicycle' &&
                          (vehicle.current_km == null || vehicle.current_km === 0)
                            ? ''
                            : String(vehicle.current_km ?? ''),
                        vehicle_name: vehicle.name,
                        vehicle_label: [vehicle.brand, vehicle.model, vehicle.year]
                          .filter(Boolean)
                          .join(' '),
                        vehicle_type: vehicle.type,
                      },
                    })
                  }
                >
                  <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                  <Text className="text-xs font-semibold text-ruta-blue">Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => handleDeleteRecord(item.id, item.service_type)}
                >
                  <Ionicons name="trash-outline" size={14} color="#B45309" />
                  <Text className="text-xs font-semibold text-ruta-clay-dark">Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={kmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!kmSaving) setKmModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-ruta-ink/35">
            <ScrollView
              contentContainerClassName="flex-grow justify-center px-5 py-8"
              keyboardShouldPersistTaps="handled"
            >
              <View className="rounded-2xl border border-ruta-blue-line bg-white p-5 shadow-lg shadow-ruta-navy/10">
                <Text className="text-lg font-bold text-ruta-navy-deep">
                  {vehicle.type === 'bicycle' ? 'Actualizar distancia' : 'Actualizar kilometraje'}
                </Text>
                <Text className="mb-4 mt-1 text-sm leading-5 text-ruta-blue-muted">
                  {vehicle.type === 'bicycle'
                    ? 'La distancia recorrida es opcional. Déjala vacía si no la llevas.'
                    : 'Ingresa la lectura actual del odómetro.'}
                </Text>
                <EntradaTexto
                  variante="oficial"
                  etiqueta={
                    vehicle.type === 'bicycle'
                      ? 'Distancia recorrida (km)'
                      : 'Kilometraje actual (km)'
                  }
                  placeholder={vehicle.type === 'bicycle' ? 'Opcional' : 'Ej. 24500'}
                  value={kmDraft}
                  onChangeText={setKmDraft}
                  keyboardType="numeric"
                  textoAyuda={
                    vehicle.type === 'bicycle' ? 'Puedes dejar este campo vacío.' : undefined
                  }
                />
                {kmError ? (
                  <Text className="mb-3 text-sm text-ruta-clay-dark">{kmError}</Text>
                ) : null}
                <View className="mt-2 flex-row gap-3">
                  <TouchableOpacity
                    accessibilityRole="button"
                    className="min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#F1F5F9] px-3"
                    onPress={() => setKmModalVisible(false)}
                    disabled={kmSaving}
                  >
                    <Text className="text-sm font-semibold text-ruta-navy">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    className="min-h-[48px] flex-1 items-center justify-center rounded-xl bg-ruta-navy-deep px-3"
                    onPress={() => void guardarKilometraje()}
                    disabled={kmSaving}
                  >
                    {kmSaving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Pantalla>
  );
}
