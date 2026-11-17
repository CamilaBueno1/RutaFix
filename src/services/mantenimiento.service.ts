import { supabase } from '@/lib/supabase';
import type { Database, TipoVehiculo } from '@/types/database.types';

export type RegistroMantenimiento = Database['public']['Tables']['maintenance_records']['Row'];
export type NuevoRegistroMantenimiento = Database['public']['Tables']['maintenance_records']['Insert'];
export type ActualizarRegistroMantenimiento = Database['public']['Tables']['maintenance_records']['Update'];

export const SERVICIOS_POR_TIPO: Record<TipoVehiculo, string[]> = {
  car: [
    'Cambio de aceite y filtro',
    'Frenos (pastillas / discos)',
    'Neumáticos y rotación',
    'Filtros de aire / cabina',
    'Batería y sistema eléctrico',
    'Alineación / suspensión',
    'Revisión general',
    'Otro',
  ],
  motorcycle: [
    'Cambio de aceite y filtro',
    'Cadena / transmisión',
    'Frenos (pastillas / líquido)',
    'Neumáticos',
    'Bujía / filtro de aire',
    'Refrigerante',
    'Revisión general',
    'Otro',
  ],
  bicycle: [
    'Limpieza y lubricación de cadena',
    'Ajuste de cambios / transmisión',
    'Frenos (pastillas / cables)',
    'Neumáticos / cámara',
    'Mantenimiento de suspensión',
    'Centrado de ruedas / radios',
    'Ajuste general',
    'Otro',
  ],
  scooter: [
    'Batería y sistema eléctrico',
    'Frenos',
    'Neumáticos',
    'Motor / controlador',
    'Luces y conexiones',
    'Revisión general',
    'Otro',
  ],
};

/**
 * Lista todos los mantenimientos de un vehículo ordenados por fecha descendente.
 */
export async function listarMantenimientosPorVehiculo(idVehiculo: string): Promise<RegistroMantenimiento[]> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', idVehiculo)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene un mantenimiento específico por su identificador.
 */
export async function obtenerMantenimientoPorId(id: string): Promise<RegistroMantenimiento | null> {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Registra un mantenimiento con validaciones de no negatividad.
 */
export async function crearRegistroMantenimiento(
  registro: Omit<NuevoRegistroMantenimiento, 'user_id'>
): Promise<RegistroMantenimiento> {
  if (registro.odometer_km != null && registro.odometer_km < 0) {
    throw new Error('El kilometraje del servicio no puede ser negativo.');
  }
  if ((registro.cost ?? 0) < 0) {
    throw new Error('El costo no puede ser negativo.');
  }
  if (registro.next_due_km !== undefined && registro.next_due_km !== null && registro.next_due_km < 0) {
    throw new Error('El próximo kilometraje no puede ser negativo.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para registrar un mantenimiento.');
  }

  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({
      ...registro,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  try {
    const { data: vehiculo } = await supabase
      .from('vehicles')
      .select('current_km')
      .eq('id', registro.vehicle_id)
      .single();

    if (
      vehiculo &&
      registro.odometer_km != null &&
      (vehiculo.current_km == null || registro.odometer_km > vehiculo.current_km)
    ) {
      await supabase
        .from('vehicles')
        .update({ current_km: registro.odometer_km })
        .eq('id', registro.vehicle_id);
    }
  } catch {
    // Continúa con éxito
  }

  return data;
}

/**
 * Actualiza un mantenimiento existente.
 */
export async function actualizarRegistroMantenimiento(
  id: string,
  cambios: ActualizarRegistroMantenimiento
): Promise<RegistroMantenimiento> {
  if (cambios.odometer_km != null && cambios.odometer_km < 0) {
    throw new Error('El kilometraje del servicio no puede ser negativo.');
  }
  if (cambios.cost !== undefined && cambios.cost < 0) {
    throw new Error('El costo no puede ser negativo.');
  }
  if (cambios.next_due_km !== undefined && cambios.next_due_km !== null && cambios.next_due_km < 0) {
    throw new Error('El próximo kilometraje no puede ser negativo.');
  }

  const { data, error } = await supabase
    .from('maintenance_records')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un registro de mantenimiento.
 */
export async function eliminarRegistroMantenimiento(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Calcula el gasto total acumulado en mantenimientos.
 */
export function calcularCostoTotal(registros: RegistroMantenimiento[]): number {
  return registros.reduce((suma, item) => suma + (Number(item.cost) || 0), 0);
}
