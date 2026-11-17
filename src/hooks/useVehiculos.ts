import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  listarVehiculos,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  type Vehiculo,
  type NuevoVehiculo,
  type ActualizarVehiculo,
} from '@/services/vehiculos.service';

export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarVehiculos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await listarVehiculos();
      setVehiculos(datos);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los vehículos');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarVehiculos();
    }, [cargarVehiculos])
  );

  const agregar = async (v: Omit<NuevoVehiculo, 'user_id'>) => {
    const creado = await crearVehiculo(v);
    setVehiculos((prev) => [creado, ...prev]);
    return creado;
  };

  const actualizar = async (id: string, cambios: ActualizarVehiculo) => {
    const actualizado = await actualizarVehiculo(id, cambios);
    setVehiculos((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
    return actualizado;
  };

  const eliminar = async (id: string) => {
    await eliminarVehiculo(id);
    setVehiculos((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    vehiculos,
    cargando,
    error,
    recargar: cargarVehiculos,
    agregarVehiculo: agregar,
    actualizarVehiculo: actualizar,
    eliminarVehiculo: eliminar,
    // Alias en inglés
    vehicles: vehiculos,
    loading: cargando,
    refresh: cargarVehiculos,
    addVehicle: agregar,
    updateVehicle: actualizar,
    removeVehicle: eliminar,
  };
}
