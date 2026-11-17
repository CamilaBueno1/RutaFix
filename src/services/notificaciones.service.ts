import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { obtenerEstadoServicio } from '@/utils/estadoServicio';
import { fechaLocal } from '@/utils/fecha';

const CANAL = 'mantenimiento';
const ORIGEN = 'cuida-lo-que-te-mueve';
const CLAVE_AVISOS = '@cuida-lo-que-te-mueve/avisos';

type Registro = Pick<
  Database['public']['Tables']['maintenance_records']['Row'],
  'id' | 'vehicle_id' | 'service_type' | 'service_date' | 'next_due_km' | 'next_due_date'
>;
type Vehiculo = Pick<
  Database['public']['Tables']['vehicles']['Row'],
  'id' | 'name' | 'type' | 'current_km'
>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function cancelarAvisosProgramados(): Promise<void> {
  if (Platform.OS === 'web') return;

  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((aviso) => aviso.content.data?.origen === ORIGEN)
      .map((aviso) => Notifications.cancelScheduledNotificationAsync(aviso.identifier))
  );
}

async function solicitarPermiso(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Mantenimiento',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permisosActuales = await Notifications.getPermissionsAsync();
  if (permisosActuales.status === 'granted') return true;
  if (!permisosActuales.canAskAgain) return false;

  const permisosSolicitados = await Notifications.requestPermissionsAsync();
  return permisosSolicitados.status === 'granted';
}

async function programarAviso(
  titulo: string,
  cuerpo: string,
  vehiculoId: string,
  registroId: string,
  fecha: Date
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      data: { origen: ORIGEN, vehiculoId, registroId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fecha,
      channelId: CANAL,
    },
  });
}

export async function sincronizarNotificacionesMantenimiento(): Promise<void> {
  if (Platform.OS === 'web') return;

  const { data: { user }, error: errorUsuario } = await supabase.auth.getUser();
  if (errorUsuario) throw errorUsuario;
  if (!user) {
    await cancelarAvisosProgramados();
    return;
  }

  const [{ data: vehiculos, error: errorVehiculos }, { data: registros, error: errorRegistros }] =
    await Promise.all([
      supabase.from('vehicles').select('id, name, type, current_km'),
      supabase
        .from('maintenance_records')
        .select('id, vehicle_id, service_type, service_date, next_due_km, next_due_date')
        .eq('user_id', user.id)
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

  if (errorVehiculos) throw errorVehiculos;
  if (errorRegistros) throw errorRegistros;

  const vehiculosPorId = new Map<string, Vehiculo>(
    (vehiculos ?? []).map((vehiculo): [string, Vehiculo] => [vehiculo.id, vehiculo])
  );
  const ultimoRegistroPorServicio = new Map<string, Registro>();

  for (const registro of registros ?? []) {
    const clave = `${registro.vehicle_id}:${registro.service_type}`;
    if (!ultimoRegistroPorServicio.has(clave)) {
      ultimoRegistroPorServicio.set(clave, registro);
    }
  }

  const pendientes = Array.from(ultimoRegistroPorServicio.values()).flatMap((registro) => {
    const vehiculo = vehiculosPorId.get(registro.vehicle_id);
    if (!vehiculo || (registro.next_due_km == null && !registro.next_due_date)) return [];

    return [{
      registro,
      vehiculo,
      estado: obtenerEstadoServicio(
        vehiculo.type === 'bicycle' && vehiculo.current_km === 0
          ? null
          : vehiculo.current_km,
        registro.next_due_km,
        registro.next_due_date
      ).estado,
    }];
  });

  if (pendientes.length === 0) {
    await cancelarAvisosProgramados();
    return;
  }

  await cancelarAvisosProgramados();
  if (!(await solicitarPermiso())) return;

  const claveAvisosUsuario = `${CLAVE_AVISOS}/${user.id}`;
  const avisosGuardados = JSON.parse(
    (await AsyncStorage.getItem(claveAvisosUsuario)) ?? '[]'
  ) as string[];
  const avisosEmitidos = new Set(avisosGuardados);
  const ahora = new Date();

  for (const { registro, vehiculo, estado } of pendientes) {
    const cuerpo = `${vehiculo.name}: ${registro.service_type}`;

    if (estado === 'proximo' || estado === 'vencido') {
      const firma = [
        registro.id,
        registro.next_due_km ?? '',
        registro.next_due_date ?? '',
        estado,
      ].join(':');

      if (!avisosEmitidos.has(firma)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: estado === 'vencido' ? 'Mantenimiento vencido' : 'Mantenimiento próximo',
            body: cuerpo,
            data: { origen: ORIGEN, vehiculoId: vehiculo.id, registroId: registro.id },
          },
          trigger: null,
        });
        avisosEmitidos.add(firma);
      }
    }

    if (!registro.next_due_date) continue;

    const fechaVencimiento = fechaLocal(registro.next_due_date, 9);
    if (!fechaVencimiento) continue;

    const avisoProximo = new Date(fechaVencimiento);
    avisoProximo.setDate(avisoProximo.getDate() - 15);

    if (avisoProximo > ahora) {
      await programarAviso(
        'Mantenimiento próximo',
        cuerpo,
        vehiculo.id,
        registro.id,
        avisoProximo
      );
    }

    if (fechaVencimiento > ahora) {
      await programarAviso(
        'Hoy toca mantenimiento',
        cuerpo,
        vehiculo.id,
        registro.id,
        fechaVencimiento
      );
    }
  }

  await AsyncStorage.setItem(
    claveAvisosUsuario,
    JSON.stringify(Array.from(avisosEmitidos).slice(-250))
  );
}

export async function cancelarNotificacionesMantenimiento(): Promise<void> {
  await cancelarAvisosProgramados();
}
