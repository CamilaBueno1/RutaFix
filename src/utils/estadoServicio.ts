import { diasHastaFechaISO } from '@/utils/fecha';

export type TipoEstadoServicio = 'al_dia' | 'proximo' | 'vencido' | 'sin_registro';

export interface ResultadoEstadoServicio {
  estado: TipoEstadoServicio;
  etiqueta: string;
  colorTexto: string;
  colorFondo: string;
  claseBadge: string;
  motivo?: string;
}

/**
 * Regla de negocio 3.4:
 * - Vencido: si la fecha límite ya pasó o el kilometraje actual alcanzó el km límite.
 * - Próximo: si faltan 500 km o menos, o 15 días o menos.
 * - Al día: en cualquier otro caso.
 */
export function obtenerEstadoServicio(
  kmActual: number | null,
  proximoKm?: number | null,
  proximaFecha?: string | null
): ResultadoEstadoServicio {
  const tieneProximoKm = proximoKm !== null && proximoKm !== undefined;
  const tieneProximaFecha = Boolean(proximaFecha);
  const distanciaDisponible = typeof kmActual === 'number' && Number.isFinite(kmActual);

  if (!tieneProximoKm && !tieneProximaFecha) {
    return {
      estado: 'al_dia',
      etiqueta: 'Al día',
      colorTexto: '#3D5442',
      colorFondo: '#EAF0EB',
      claseBadge: 'bg-[#EAF0EB] text-[#3D5442] border-[#C2C8C0]',
      motivo: 'Sin mantenimiento pendiente programado',
    };
  }

  let fechaVencida = false;
  let fechaProxima = false;
  let diasDiferencia: number | null = null;

  if (proximaFecha) {
    diasDiferencia = diasHastaFechaISO(proximaFecha);
    if (diasDiferencia !== null && diasDiferencia < 0) {
      fechaVencida = true;
    } else if (diasDiferencia !== null && diasDiferencia <= 15) {
      fechaProxima = true;
    }
  }

  let kmVencido = false;
  let kmProximo = false;
  let kmDiferencia: number | null = null;

  if (
    kmActual !== null &&
    Number.isFinite(kmActual) &&
    typeof proximoKm === 'number' &&
    Number.isFinite(proximoKm) &&
    proximoKm >= 0
  ) {
    kmDiferencia = proximoKm - kmActual;
    if (kmDiferencia <= 0) {
      kmVencido = true;
    } else if (kmDiferencia <= 500) {
      kmProximo = true;
    }
  }

  // 1. Vencido
  if (kmVencido || fechaVencida) {
    let motivo = 'Servicio vencido:';
    if (kmVencido && kmDiferencia !== null) {
      motivo += ` excedido por ${Math.abs(kmDiferencia)} km`;
    }
    if (fechaVencida && diasDiferencia !== null) {
      motivo += ` vencido hace ${Math.abs(diasDiferencia)} días`;
    }
    return {
      estado: 'vencido',
      etiqueta: 'Vencido',
      colorTexto: '#984629',
      colorFondo: '#F7EDE8',
      claseBadge: 'bg-ruta-clay-soft text-ruta-clay-dark border-ruta-clay/30',
      motivo: motivo.trim(),
    };
  }

  // 2. Próximo
  if (kmProximo || fechaProxima) {
    let motivo = 'Próximo a vencer:';
    if (kmProximo && kmDiferencia !== null) {
      motivo += ` faltan ${kmDiferencia} km`;
    }
    if (fechaProxima && diasDiferencia !== null) {
      motivo += ` faltan ${diasDiferencia} días`;
    }
    return {
      estado: 'proximo',
      etiqueta: 'Próximo',
      colorTexto: '#984629',
      colorFondo: '#F7EDE8',
      claseBadge: 'bg-ruta-clay-soft text-ruta-clay-dark border-ruta-clay/30',
      motivo: motivo.trim(),
    };
  }

  if (tieneProximoKm && !distanciaDisponible) {
    return {
      estado: 'sin_registro',
      etiqueta: 'Distancia sin registrar',
      colorTexto: '#686E69',
      colorFondo: '#EFECE4',
      claseBadge: 'border-ruta-line bg-ruta-inset text-ruta-muted',
      motivo: 'Registra la distancia para calcular el próximo servicio por kilómetros.',
    };
  }

  // 3. Al día
  return {
    estado: 'al_dia',
    etiqueta: 'Al día',
    colorTexto: '#3D5442',
    colorFondo: '#EAF0EB',
    claseBadge: 'bg-[#EAF0EB] text-[#3D5442] border-[#C2C8C0]',
    motivo: 'Mantenimiento al día',
  };
}
