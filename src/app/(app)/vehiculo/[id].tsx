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
  TIPOS_VEHICULOS,
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
        vehicle_plate: vehicle.plate ?? '',
        vehicle_type: vehicle.type,
      },
    });
  };

  if (loadingVehicle && !vehicle) {
    return (
      <Pantalla className="items-center justify-center bg-[#F8F9FF]">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-sm text-[#45464D]">
          Cargando información del vehículo...
        </Text>
      </Pantalla>
    );
  }

  if (!vehicle) {
    return (
      <Pantalla className="items-center justify-center bg-[#F8F9FF] px-6">
        <View className="w-full items-center rounded-[26px] border border-[#E2E8F0] bg-white p-7 shadow-lg shadow-[#0B1C30]/5">
          <Ionicons name="alert-circle-outline" size={40} color="#2563EB" />
          <Text className="mt-3 text-base font-bold text-[#0B1C30]">
            No se encontró el vehículo.
          </Text>
          <TouchableOpacity
            className="mt-5 rounded-2xl bg-[#2563EB] px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="font-semibold text-white">Volver</Text>
          </TouchableOpacity>
        </View>
      </Pantalla>
    );
  }

  const tipoColor = COLORES_TIPO_VEHICULO[vehicle.type];
  const tipoEtiqueta =
    TIPOS_VEHICULOS.find((tipo) => tipo.valor === vehicle.type)?.etiqueta ?? vehicle.type;
  const kilometrajeActual =
    vehicle.type === 'bicycle' && (vehicle.current_km == null || vehicle.current_km === 0)
      ? null
      : vehicle.current_km;
  const proximoMantenimiento = registros.find(
    (registro) => registro.next_due_km != null || registro.next_due_date != null
  );
  const kilometrosRestantes =
    kilometrajeActual != null && proximoMantenimiento?.next_due_km != null
      ? proximoMantenimiento.next_due_km - kilometrajeActual
      : null;
  const resumenProximo =
    kilometrosRestantes != null
      ? kilometrosRestantes > 0
        ? `${kilometrosRestantes.toLocaleString()} km`
        : kilometrosRestantes === 0
          ? 'Toca ahora'
          : `Vencido ${Math.abs(kilometrosRestantes).toLocaleString()} km`
      : proximoMantenimiento?.next_due_km != null
        ? `${proximoMantenimiento.next_due_km.toLocaleString()} km`
        : proximoMantenimiento?.next_due_date ?? 'Sin programar';
  const intervaloServicio =
    proximoMantenimiento?.next_due_km != null && proximoMantenimiento.odometer_km != null
      ? proximoMantenimiento.next_due_km - proximoMantenimiento.odometer_km
      : null;
  const avanceServicio =
    intervaloServicio != null &&
    intervaloServicio > 0 &&
    kilometrajeActual != null &&
    proximoMantenimiento?.odometer_km != null
      ? Math.min(
          100,
          Math.max(
            0,
            ((kilometrajeActual - proximoMantenimiento.odometer_km) / intervaloServicio) * 100
          )
        )
      : null;

  return (
    <Pantalla className="bg-[#F8F9FF]">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm shadow-[#0B1C30]/5"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={23} color="#0B1C30" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#0B1C30]">
          Detalle de vehículo
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Eliminar vehículo"
          className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm shadow-[#0B1C30]/5"
          onPress={handleDeleteVehicle}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color="#45464D" />
        </TouchableOpacity>
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
        <View className="mb-5 overflow-hidden rounded-[26px] border border-[#E8ECF5] bg-white p-4 shadow-sm shadow-[#0B1C30]/5">
          <View className="flex-row items-center gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF]"
              style={{ backgroundColor: tipoColor.fondo }}
            >
              <MaterialCommunityIcons
                name={ICONOS_TIPO_VEHICULO[vehicle.type]}
                size={30}
                color={tipoColor.icono}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-[22px] font-extrabold text-[#0B1C30]" numberOfLines={1}>
                  {vehicle.name}
                </Text>
                {vehicle.year ? (
                  <View className="rounded-full bg-[#EAF1FF] px-2.5 py-1">
                    <Text className="text-xs font-bold text-[#2563EB]">{vehicle.year}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-1 text-sm text-[#45464D]" numberOfLines={1}>
                {[vehicle.brand, vehicle.model].filter(Boolean).join(' • ') || tipoEtiqueta}
              </Text>
            </View>
          </View>

          <View className="relative mt-4 h-[190px] overflow-hidden rounded-[22px] bg-[#F0F5FF]">
            <View className="h-full w-full items-center justify-center">
              <View className="absolute h-36 w-36 rounded-full border-[18px] border-white/70" />
              <MaterialCommunityIcons
                name={ICONOS_TIPO_VEHICULO[vehicle.type]}
                size={94}
                color={tipoColor.icono}
              />
            </View>
            <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between">
              <View className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm">
                <Text className="text-xs font-extrabold tracking-wider text-[#131B2E]">
                  {vehicle.plate ? vehicle.plate.toUpperCase() : tipoEtiqueta}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-xl bg-[#ECFDF5] px-3 py-2">
                <View className="h-2 w-2 rounded-full bg-[#10B981]" />
                <Text className="text-xs font-bold text-[#065F46]">En tu garaje</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              accessibilityRole="button"
              className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-[#E8ECF5] bg-white"
              onPress={() =>
                router.push({
                  pathname: '/(app)/vehiculo/nuevo',
                  params: { id: vehicle.id },
                })
              }
            >
              <Ionicons name="create-outline" size={19} color="#2563EB" />
              <Text className="text-sm font-bold text-[#131B2E]">Editar datos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-[#E8ECF5] bg-white"
              onPress={irANuevoServicio}
            >
              <Ionicons name="construct-outline" size={19} color="#2563EB" />
              <Text className="text-sm font-bold text-[#131B2E]">Registrar servicio</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6 flex-row items-center justify-between rounded-[24px] border border-[#E8ECF5] bg-white p-4 shadow-sm shadow-[#0B1C30]/5">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF]">
              <Ionicons name="speedometer-outline" size={29} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-[#45464D]">
                {vehicle.type === 'bicycle' ? 'Distancia acumulada' : 'Kilometraje actual'}
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text
                  className="text-[23px] font-extrabold text-[#0B1C30]"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {kilometrajeActual == null
                    ? 'Sin registrar'
                    : kilometrajeActual.toLocaleString()}
                </Text>
                {kilometrajeActual != null ? (
                  <Text className="text-xs font-bold uppercase text-[#45464D]">km</Text>
                ) : null}
              </View>
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              vehicle.type === 'bicycle' ? 'Actualizar distancia' : 'Actualizar kilometraje'
            }
            className="ml-2 min-h-[56px] flex-row items-center justify-center gap-2 rounded-[18px] bg-[#131B2E] px-3.5"
            onPress={handleUpdateKm}
          >
            <Ionicons name="add-circle-outline" size={20} color="#F59E0B" />
            <Text className="text-xs font-extrabold text-white">
              {vehicle.type === 'bicycle' ? 'Act. dist.' : 'Act. km'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-2.5">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1FF]">
                <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
              </View>
              <Text className="flex-1 text-base font-extrabold text-[#0B1C30]">
                Salud de mantenimiento
              </Text>
            </View>
            <InsigniaEstado resultado={estadoServicio} />
          </View>

          <View className="flex-row gap-2.5">
            <View className="min-w-0 flex-1 rounded-[20px] border border-[#E8ECF5] bg-white p-3 shadow-sm shadow-[#0B1C30]/5">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-[#FFF7E8]">
                <Ionicons name="calendar-outline" size={17} color="#F59E0B" />
              </View>
              <Text className="text-[10px] font-semibold text-[#45464D]">Próximo</Text>
              <Text
                className="mt-1 text-[13px] font-extrabold text-[#0B1C30]"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {resumenProximo}
              </Text>
            </View>
            <View className="min-w-0 flex-1 rounded-[20px] border border-[#E8ECF5] bg-white p-3 shadow-sm shadow-[#0B1C30]/5">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-[#EAF1FF]">
                <Ionicons name="construct-outline" size={17} color="#2563EB" />
              </View>
              <Text className="text-[10px] font-semibold text-[#45464D]">Servicios</Text>
              <Text className="mt-1 text-[15px] font-extrabold text-[#0B1C30]">
                {registros.length}
              </Text>
            </View>
            <View className="min-w-0 flex-1 rounded-[20px] border border-[#E8ECF5] bg-white p-3 shadow-sm shadow-[#0B1C30]/5">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl bg-[#ECFDF5]">
                <Ionicons name="cash-outline" size={17} color="#10B981" />
              </View>
              <Text className="text-[10px] font-semibold text-[#45464D]">Gasto total</Text>
              <Text
                className="mt-1 text-[13px] font-extrabold text-[#0B1C30]"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ${costoTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6 rounded-[26px] bg-[#0B1C30] p-5 shadow-lg shadow-[#0B1C30]/15">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 rounded-full bg-[#FFF7E8] px-3 py-1.5">
              <View className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              <Text className="text-[11px] font-extrabold text-[#B45309]">
                {proximoMantenimiento ? 'Servicio programado' : 'Plan de mantenimiento'}
              </Text>
            </View>
            <Text
              className="text-xs font-extrabold text-[#FBBF24]"
              numberOfLines={1}
            >
              {estadoServicio.etiqueta}
            </Text>
          </View>

          <Text className="text-[21px] font-extrabold leading-7 text-white">
            {proximoMantenimiento?.service_type ?? 'Aún no hay un servicio programado'}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-[#BEC6E0]">
            {proximoMantenimiento?.notes ||
              estadoServicio.motivo ||
              'Registra el próximo mantenimiento para llevar un seguimiento.'}
          </Text>

          {proximoMantenimiento ? (
            <View className="mt-5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-[#BEC6E0]">
                  {kilometrosRestantes == null
                    ? proximoMantenimiento.next_due_km != null
                      ? 'Próximo límite'
                      : 'Fecha del próximo servicio'
                    : kilometrosRestantes === 0
                      ? 'Servicio requerido'
                    : kilometrosRestantes > 0
                      ? 'Distancia restante'
                      : 'Distancia vencida'}
                </Text>
                <Text className="text-xs font-extrabold text-[#FBBF24]">
                  {kilometrosRestantes == null
                    ? proximoMantenimiento.next_due_km != null
                      ? `${proximoMantenimiento.next_due_km.toLocaleString()} km`
                      : proximoMantenimiento.next_due_date ?? 'Sin fecha'
                    : kilometrosRestantes === 0
                      ? 'Límite alcanzado'
                    : `${Math.abs(kilometrosRestantes).toLocaleString()} km`}
                </Text>
              </View>
              {avanceServicio != null ? (
                <View className="h-2 overflow-hidden rounded-full bg-[#26364D]">
                  <View
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{ width: `${avanceServicio}%` }}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="mt-5 gap-2.5">
            <TouchableOpacity
              accessibilityRole="button"
              className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4"
              onPress={irANuevoServicio}
            >
              <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">Registrar mantenimiento</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#1B2A42] px-4"
              onPress={handleUpdateKm}
            >
              <Ionicons name="speedometer-outline" size={19} color="#BEC6E0" />
              <Text className="text-sm font-bold text-[#D3E4FE]">
                {vehicle.type === 'bicycle' ? 'Actualizar distancia' : 'Actualizar kilometraje'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-[#0B1C30]">
              Gestión técnica &amp; bitácora
            </Text>
            <Text className="mt-0.5 text-xs text-[#45464D]">
              Historial de mantenimientos
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm shadow-[#0B1C30]/5"
            accessibilityLabel="Agregar servicio"
            onPress={irANuevoServicio}
          >
            <Ionicons name="add" size={23} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {registros.length === 0 ? (
          <View className="items-center rounded-[24px] border border-[#E8ECF5] bg-white p-8 shadow-md shadow-[#0B1C30]/5">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF]">
              <Ionicons name="construct-outline" size={30} color="#2563EB" />
            </View>
            <Text className="text-base font-bold text-[#0B1C30]">Sin registros aún</Text>
            <Text className="mb-5 mt-1.5 max-w-64 text-center text-xs leading-5 text-[#45464D]">
              {vehicle.type === 'bicycle'
                ? 'Lleva el control de cadena, frenos, neumáticos o ajustes de tu bicicleta.'
                : 'Lleva el control de aceite, frenos, neumáticos o revisiones de este vehículo.'}
            </Text>
            <TouchableOpacity
              className="rounded-xl border border-[#D3E4FE] bg-[#EFF6FF] px-4 py-2.5"
              onPress={irANuevoServicio}
            >
              <Text className="text-xs font-bold text-[#2563EB]">Registrar primer servicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          registros.map((item) => (
            <View
              key={item.id}
              className="mb-3 rounded-[22px] border border-[#E8ECF5] bg-white p-4 shadow-md shadow-[#0B1C30]/5"
            >
              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <Text className="text-base font-bold text-[#0B1C30]">{item.service_type}</Text>
                  <Text className="mt-1 text-xs text-[#45464D]">
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
                <Text className="mt-3 rounded-xl border border-[#E8ECF5] bg-[#F8F9FF] p-2.5 text-xs text-[#45464D]">
                  {item.notes}
                </Text>
              ) : null}

              {item.next_due_km != null || item.next_due_date ? (
                <View className="mt-3 flex-row items-center gap-1.5 rounded-lg border border-[#FDE3B0] bg-[#FFF7E8] px-2.5 py-1.5">
                  <Ionicons name="calendar-outline" size={14} color="#F59E0B" />
                  <Text className="text-xs font-medium text-[#B45309]">
                    Próximo:{' '}
                    {item.next_due_km != null ? `${item.next_due_km.toLocaleString()} km` : ''}
                    {item.next_due_km != null && item.next_due_date ? ' o ' : ''}
                    {item.next_due_date ? item.next_due_date : ''}
                  </Text>
                </View>
              ) : null}

              <View className="mt-3 flex-row justify-end gap-4 border-t border-[#E8ECF5] pt-2.5">
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
                        vehicle_plate: vehicle.plate ?? '',
                        vehicle_type: vehicle.type,
                      },
                    })
                  }
                >
                  <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                  <Text className="text-xs font-semibold text-[#2563EB]">Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() => handleDeleteRecord(item.id, item.service_type)}
                >
                  <Ionicons name="trash-outline" size={14} color="#BA1A1A" />
                  <Text className="text-xs font-semibold text-[#BA1A1A]">Eliminar</Text>
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
          <View className="flex-1 bg-[#0B1C30]/45">
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
                    className="min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#2563EB] px-3"
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
