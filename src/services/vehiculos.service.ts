import { supabase } from '@/lib/supabase';
import type { Database, TipoVehiculo } from '@/types/database.types';

export type Vehiculo = Database['public']['Tables']['vehicles']['Row'];
export type NuevoVehiculo = Database['public']['Tables']['vehicles']['Insert'];
export type ActualizarVehiculo = Database['public']['Tables']['vehicles']['Update'];

export const TIPOS_VEHICULOS: { etiqueta: string; valor: TipoVehiculo; icono: string }[] = [
  { etiqueta: 'Auto', valor: 'car', icono: 'car-sport' },
  { etiqueta: 'Moto', valor: 'motorcycle', icono: 'bicycle' },
  { etiqueta: 'Bicicleta', valor: 'bicycle', icono: 'bicycle-outline' },
  { etiqueta: 'Scooter', valor: 'scooter', icono: 'flash' },
];

/**
 * Lista todos los vehículos del usuario autenticado ordenados por fecha de creación descendente.
 */
export async function listarVehiculos(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene el detalle de un vehículo por su identificador único.
 */
export async function obtenerVehiculoPorId(id: string): Promise<Vehiculo | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Registra un nuevo vehículo con validación de kilometraje no negativo.
 */
export async function crearVehiculo(vehiculo: Omit<NuevoVehiculo, 'user_id'>): Promise<Vehiculo> {
  if ((vehiculo.current_km ?? 0) < 0) {
    throw new Error('El kilometraje no puede ser negativo.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes iniciar sesión para registrar un vehículo.');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...vehiculo,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza los datos de un vehículo existente.
 */
export async function actualizarVehiculo(id: string, cambios: ActualizarVehiculo): Promise<Vehiculo> {
  if (cambios.current_km !== undefined && cambios.current_km < 0) {
    throw new Error('El kilometraje no puede ser negativo.');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un vehículo y sus mantenimientos en cascada.
 */
export async function eliminarVehiculo(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
