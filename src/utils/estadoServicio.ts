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
  kmActual: number,
  proximoKm?: number | null,
  proximaFecha?: string | null
): ResultadoEstadoServicio {
  if (!proximoKm && !proximaFecha) {
    return {
      estado: 'al_dia',
      etiqueta: 'Al día',
      colorTexto: '#10B981',
      colorFondo: '#D1FAE5',
      claseBadge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      motivo: 'Sin mantenimiento pendiente programado',
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let fechaVencida = false;
  let fechaProxima = false;
  let diasDiferencia: number | null = null;

  if (proximaFecha) {
    const fechaLimite = new Date(proximaFecha);
    fechaLimite.setHours(0, 0, 0, 0);
    const diferenciaMs = fechaLimite.getTime() - hoy.getTime();
    diasDiferencia = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasDiferencia < 0) {
      fechaVencida = true;
    } else if (diasDiferencia <= 15) {
      fechaProxima = true;
    }
  }

  let kmVencido = false;
  let kmProximo = false;
  let kmDiferencia: number | null = null;

  if (typeof proximoKm === 'number' && proximoKm > 0) {
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
      colorTexto: '#EF4444',
      colorFondo: '#FEE2E2',
      claseBadge: 'bg-red-100 text-red-700 border-red-300',
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
      colorTexto: '#F59E0B',
      colorFondo: '#FEF3C7',
      claseBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      motivo: motivo.trim(),
    };
  }

  // 3. Al día
  return {
    estado: 'al_dia',
    etiqueta: 'Al día',
    colorTexto: '#10B981',
    colorFondo: '#D1FAE5',
    claseBadge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    motivo: 'Mantenimiento al día',
  };
}
