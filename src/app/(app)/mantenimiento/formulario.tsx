import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import {
  crearRegistroMantenimiento,
  actualizarRegistroMantenimiento,
  obtenerMantenimientoPorId,
  SERVICIOS_POR_TIPO,
} from '@/services/mantenimiento.service';
import { TIPOS_VEHICULOS } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { esFechaISOValida, hoyISO } from '@/utils/fecha';

export default function MaintenanceFormScreen() {
  const router = useRouter();
  const {
    id,
    vehicle_id,
    current_km,
    vehicle_name,
    vehicle_label,
    vehicle_plate,
    vehicle_type,
  } = useLocalSearchParams<{
    id?: string;
    vehicle_id: string;
    current_km?: string;
    vehicle_name?: string;
    vehicle_label?: string;
    vehicle_plate?: string;
    vehicle_type?: string;
  }>();
  const tipoEncontrado = TIPOS_VEHICULOS.find((item) => item.valor === vehicle_type);
  const tipoVehiculo: TipoVehiculo = tipoEncontrado?.valor ?? 'car';
  const servicios = SERVICIOS_POR_TIPO[tipoVehiculo];

  const isEditing = Boolean(id);

  const [serviceType, setServiceType] = useState(servicios[0]);
  const [customService, setCustomService] = useState('');
  const [serviceDate, setServiceDate] = useState(hoyISO());
  const [odometerKm, setOdometerKm] = useState(
    tipoVehiculo === 'bicycle' && (!current_km || current_km === '0')
      ? ''
      : current_km || ''
  );
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof id !== 'string' || !id) return;
    const recordId = id;
    let active = true;

    async function loadRecord() {
      try {
        setFetching(true);
        const data = await obtenerMantenimientoPorId(recordId);
        if (!active) return;
        if (data) {
          if (servicios.includes(data.service_type)) {
            setServiceType(data.service_type);
          } else {
            setServiceType('Otro');
            setCustomService(data.service_type);
          }
          setServiceDate(data.service_date);
          setOdometerKm(
            data.odometer_km == null ||
              (tipoVehiculo === 'bicycle' && data.odometer_km === 0)
              ? ''
              : String(data.odometer_km)
          );
          setCost(String(data.cost));
          setNotes(data.notes || '');
          setNextDueKm(data.next_due_km != null ? String(data.next_due_km) : '');
          setNextDueDate(data.next_due_date || '');
        } else {
          setErrorMessage('No se encontró el mantenimiento que deseas editar.');
          router.back();
        }
      } catch (error: unknown) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : 'No se pudo cargar el mantenimiento.';
        Alert.alert('Error', message);
        router.back();
      } finally {
        if (active) setFetching(false);
      }
    }
    void loadRecord();

    return () => {
      active = false;
    };
  }, [id, router, servicios, tipoVehiculo]);

  const handleSubmit = async () => {
    if (!vehicle_id || !tipoEncontrado) {
      setErrorMessage('No se pudo identificar el vehículo. Vuelve al garaje e inténtalo otra vez.');
      return;
    }

    const finalType = serviceType === 'Otro' ? customService.trim() : serviceType;
    if (!finalType) {
      setErrorMessage('Por favor especifica el tipo de servicio.');
      return;
    }

    const distanciaTexto = odometerKm.trim();
    if (distanciaTexto && !/^\d+$/.test(distanciaTexto)) {
      setErrorMessage('La distancia debe ser un número entero mayor o igual a 0.');
      return;
    }
    if (!distanciaTexto && tipoVehiculo !== 'bicycle') {
      setErrorMessage('Ingresa el kilometraje del servicio.');
      return;
    }
    const km = distanciaTexto ? Number(distanciaTexto) : null;
    if (km != null && !Number.isSafeInteger(km)) {
      setErrorMessage('La distancia ingresada es demasiado grande.');
      return;
    }

    const costText = cost.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(costText)) {
      setErrorMessage('Ingresa un costo válido con hasta dos decimales.');
      return;
    }
    const costNum = Number(costText);
    if (!Number.isFinite(costNum)) {
      setErrorMessage('El costo ingresado es demasiado grande.');
      return;
    }

    if (!esFechaISOValida(serviceDate.trim())) {
      setErrorMessage('La fecha del servicio debe ser válida y tener el formato YYYY-MM-DD.');
      return;
    }

    let nextKmNum: number | null = null;
    const nextKmText = nextDueKm.trim();
    if (nextKmText) {
      if (!/^\d+$/.test(nextKmText)) {
        setErrorMessage('El próximo kilometraje debe ser un número entero.');
        return;
      }
      nextKmNum = Number(nextKmText);
      if (!Number.isSafeInteger(nextKmNum)) {
        setErrorMessage('El próximo kilometraje ingresado es demasiado grande.');
        return;
      }
    }

    if (nextDueDate.trim() && !esFechaISOValida(nextDueDate.trim())) {
      setErrorMessage('La próxima fecha debe ser válida y tener el formato YYYY-MM-DD.');
      return;
    }

    let navigatingBack = false;
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
      }

      if (!isMounted.current) return;
      navigatingBack = true;
      setLoading(false);
      router.back();
    } catch (error: unknown) {
      if (isMounted.current) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Error al guardar el mantenimiento.'
        );
      } else {
        console.error('No se pudo guardar el mantenimiento:', error);
      }
    } finally {
      if (isMounted.current && !navigatingBack) setLoading(false);
    }
  };

  if (!vehicle_id || !tipoEncontrado) {
    return (
      <Pantalla className="items-center justify-center bg-[#F8F9FF] px-6">
        <View className="w-full items-center rounded-[26px] border border-[#E8ECF5] bg-white p-6 shadow-sm shadow-[#0B1C30]/5">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF]">
            <Ionicons name="alert-circle-outline" size={28} color="#2563EB" />
          </View>
          <Text className="text-center text-lg font-extrabold text-[#0B1C30]">
            No se pudo identificar el vehículo
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[#45464D]">
            Vuelve al garaje y selecciona un vehículo antes de registrar un mantenimiento.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="mt-5 min-h-12 items-center justify-center rounded-xl bg-[#2563EB] px-5"
            onPress={() => router.back()}
          >
            <Text className="font-bold text-white">Volver</Text>
          </TouchableOpacity>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla className="bg-[#F8F9FF]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Volver"
            disabled={loading}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm shadow-[#0B1C30]/5"
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#0B1C30" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-bold text-[#0B1C30]">
            {isEditing ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
          </Text>
          <View className="h-11 w-11" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-5 flex-row items-center justify-between rounded-[22px] border border-[#E8ECF5] bg-white p-4 shadow-sm shadow-[#0B1C30]/5">
            <View className="mr-3 flex-1 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                <MaterialCommunityIcons
                  name={
                    tipoVehiculo === 'bicycle'
                      ? 'bicycle'
                      : tipoVehiculo === 'motorcycle'
                        ? 'motorbike'
                        : tipoVehiculo === 'scooter'
                          ? 'scooter'
                          : 'car-side'
                  }
                  size={25}
                  color="#2563EB"
                />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-sm font-extrabold text-[#0B1C30]" numberOfLines={1}>
                    {vehicle_name || 'Vehículo seleccionado'}
                  </Text>
                  {vehicle_plate ? (
                    <View className="rounded-full bg-[#EAF1FF] px-2 py-1">
                      <Text className="text-[10px] font-bold text-[#2563EB]" numberOfLines={1}>
                        {vehicle_plate}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-0.5 text-xs text-[#45464D]" numberOfLines={1}>
                  {vehicle_label || tipoVehiculo}
                </Text>
              </View>
            </View>
            <View className="items-end border-l border-[#E2E8F0] pl-3">
              <Text className="text-[10px] font-semibold tracking-wide text-[#45464D]">
                {tipoVehiculo === 'bicycle' ? 'DISTANCIA' : 'ODÓMETRO'}
              </Text>
              <Text className="mt-0.5 text-sm font-extrabold text-[#0B1C30]">
                {current_km && !(tipoVehiculo === 'bicycle' && current_km === '0')
                  ? `${Number(current_km).toLocaleString()} km`
                  : 'Sin registrar'}
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4">
              <Ionicons name="alert-circle-outline" size={19} color="#BA1A1A" />
              <Text className="flex-1 text-sm font-medium leading-5 text-[#991B1B]">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="build-outline" size={21} color="#2563EB" />
                <Text className="text-base font-extrabold text-[#0B1C30]">
                  Tipo de intervención
                </Text>
              </View>
              <Text className="text-xs font-semibold text-[#45464D]">Obligatorio</Text>
            </View>

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-5"
            >
              {servicios.map((srv) => {
                const isSelected = serviceType === srv;
                return (
                  <TouchableOpacity
                    key={srv}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`min-h-12 flex-row items-center gap-2 rounded-2xl border px-4 py-2.5 ${
                      isSelected
                        ? 'border-[#131B2E] bg-[#131B2E]'
                        : 'border-[#E8ECF5] bg-white'
                    }`}
                    onPress={() => setServiceType(srv)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="construct-outline"
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#2563EB'}
                    />
                    <Text className={`text-[13px] font-bold ${isSelected ? 'text-white' : 'text-[#45464D]'}`}>
                      {srv}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {serviceType === 'Otro' ? (
              <View className="mt-3 rounded-[22px] border border-[#E8ECF5] bg-white p-4">
                <EntradaTexto
                  variante="oficial"
                  etiqueta="Nombre del servicio *"
                  placeholder="Ej. Cambio de líquido refrigerante"
                  value={customService}
                  onChangeText={setCustomService}
                />
              </View>
            ) : null}
          </View>

          <View className="mb-5 rounded-[26px] border border-[#E8ECF5] bg-white p-5 shadow-sm shadow-[#0B1C30]/5">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF1FF]">
                <Ionicons name="receipt-outline" size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-[#0B1C30]">
                  Datos de la intervención
                </Text>
                <Text className="mt-0.5 text-xs text-[#45464D]">
                  Fecha, distancia y costo del servicio
                </Text>
              </View>
            </View>
            <View className="mb-4 h-px bg-[#D3E4FE]" />

            <EntradaTexto
              variante="oficial"
              etiqueta="Fecha del servicio *"
              placeholder="AAAA-MM-DD"
              value={serviceDate}
              onChangeText={setServiceDate}
              icono="calendar-outline"
              textoAyuda="Usa el formato año-mes-día."
            />
            <EntradaTexto
              variante="oficial"
              etiqueta={
                tipoVehiculo === 'bicycle'
                  ? 'Distancia al realizar (km) · opcional'
                  : 'Kilometraje al momento del servicio *'
              }
              placeholder={tipoVehiculo === 'bicycle' ? 'Opcional' : 'Ej. 12000'}
              value={odometerKm}
              onChangeText={setOdometerKm}
              keyboardType="numeric"
              icono={tipoVehiculo === 'bicycle' ? undefined : 'speedometer-outline'}
              textoAyuda={
                tipoVehiculo === 'bicycle'
                  ? 'Anota los kilómetros solo si llevas ese control.'
                  : undefined
              }
            />
            <EntradaTexto
              variante="oficial"
              etiqueta="Costo total pagado *"
              placeholder="0,00"
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
              icono="cash-outline"
              textoAyuda="Incluye mano de obra, repuestos y fluidos."
            />
          </View>

          <View className="mb-5 rounded-[26px] border border-[#E8ECF5] bg-white p-5 shadow-sm shadow-[#0B1C30]/5">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="document-text-outline" size={21} color="#2563EB" />
                <Text className="text-base font-extrabold text-[#0B1C30]">
                  Repuestos y notas
                </Text>
              </View>
              <Text className="text-xs font-semibold text-[#45464D]">Opcional</Text>
            </View>
            <EntradaTexto
              variante="oficial"
              etiqueta="Detalle del servicio"
              placeholder="Describe repuestos, fluidos o trabajos realizados..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              className="h-28"
            />
          </View>

          <View className="mb-5 rounded-[26px] border border-[#D3E4FE] bg-[#EFF6FF] p-5">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]">
                <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-[#0B1C30]">
                  Recordatorio del próximo servicio
                </Text>
                <Text className="mt-0.5 text-xs text-[#45464D]">
                  Opcional · configura un límite por fecha o distancia
                </Text>
              </View>
            </View>

            <EntradaTexto
              variante="oficial"
              etiqueta={tipoVehiculo === 'bicycle' ? 'Próxima distancia (km)' : 'Próximo kilometraje (km)'}
              placeholder={tipoVehiculo === 'bicycle' ? 'Ej. 1500' : 'Ej. 15000'}
              value={nextDueKm}
              onChangeText={setNextDueKm}
              keyboardType="numeric"
              icono={tipoVehiculo === 'bicycle' ? undefined : 'speedometer-outline'}
              textoAyuda="Aviso cuando falten 500 km para el límite."
            />
            <EntradaTexto
              variante="oficial"
              etiqueta="Próxima fecha"
              placeholder="AAAA-MM-DD"
              value={nextDueDate}
              onChangeText={setNextDueDate}
              icono="calendar-outline"
              textoAyuda="Aviso 15 días antes de la fecha límite."
            />
          </View>
        </ScrollView>

        <View className="border-t border-[#E8ECF5] bg-[#F8F9FF] px-5 pb-3 pt-3">
          <TouchableOpacity
            accessibilityRole="button"
            disabled={loading || fetching}
            className={`min-h-[60px] flex-row items-center justify-center gap-2 rounded-[20px] bg-[#2563EB] px-5 shadow-lg shadow-[#2563EB]/20 ${
              loading || fetching ? 'opacity-60' : ''
            }`}
            onPress={() => void handleSubmit()}
          >
            {loading || fetching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                <Text className="text-base font-extrabold text-white">
                  {isEditing ? 'Guardar cambios' : 'Guardar servicio en la bitácora'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={loading}
            className="mt-2 min-h-11 items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-[#45464D]">Cancelar y volver</Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center gap-2 pt-1">
            <Ionicons name="ribbon-outline" size={15} color="#10B981" />
            <Text className="flex-1 text-center text-[11px] leading-4 text-[#45464D]">
              El servicio se guardará en el historial del vehículo.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
