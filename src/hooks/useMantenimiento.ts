import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  listarMantenimientosPorVehiculo,
  crearRegistroMantenimiento,
  actualizarRegistroMantenimiento,
  eliminarRegistroMantenimiento,
  calcularCostoTotal,
  type RegistroMantenimiento,
  type NuevoRegistroMantenimiento,
  type ActualizarRegistroMantenimiento,
} from '@/services/mantenimiento.service';
import { obtenerEstadoServicio } from '@/utils/estadoServicio';

export function useMantenimiento(idVehiculo: string | undefined, kmActual: number | null = 0) {
  const [registros, setRegistros] = useState<RegistroMantenimiento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarRegistros = useCallback(async () => {
    if (!idVehiculo) return;
    try {
      setCargando(true);
      setError(null);
      const datos = await listarMantenimientosPorVehiculo(idVehiculo);
      setRegistros(datos);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los mantenimientos');
    } finally {
      setCargando(false);
    }
  }, [idVehiculo]);

  useFocusEffect(
    useCallback(() => {
      void cargarRegistros();
    }, [cargarRegistros])
  );

  const costoTotal = useMemo(() => calcularCostoTotal(registros), [registros]);

  const ultimoProgramado = useMemo(() => {
    return registros.find((r) => r.next_due_km != null || r.next_due_date != null);
  }, [registros]);

  const estadoServicio = useMemo(() => {
    return obtenerEstadoServicio(
      kmActual,
      ultimoProgramado?.next_due_km,
      ultimoProgramado?.next_due_date
    );
  }, [kmActual, ultimoProgramado]);

  const agregar = async (registro: Omit<NuevoRegistroMantenimiento, 'user_id'>) => {
    const creado = await crearRegistroMantenimiento(registro);
    setRegistros((prev) => [creado, ...prev]);
    return creado;
  };

  const actualizar = async (id: string, cambios: ActualizarRegistroMantenimiento) => {
    const actualizado = await actualizarRegistroMantenimiento(id, cambios);
    setRegistros((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
    return actualizado;
  };

  const eliminar = async (id: string) => {
    await eliminarRegistroMantenimiento(id);
    setRegistros((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    registros,
    costoTotal,
    estadoServicio,
    cargando,
    error,
    recargar: cargarRegistros,
    agregarRegistro: agregar,
    actualizarRegistro: actualizar,
    eliminarRegistro: eliminar,
    // Alias en inglés
    records: registros,
    totalCost: costoTotal,
    serviceStatus: estadoServicio,
    loading: cargando,
    refresh: cargarRegistros,
    addRecord: agregar,
    updateRecord: actualizar,
    removeRecord: eliminar,
  };
}
