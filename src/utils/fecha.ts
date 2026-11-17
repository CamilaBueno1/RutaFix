const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function hoyISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export function esFechaISOValida(fecha: string): boolean {
  const partes = FECHA_ISO.exec(fecha);
  if (!partes) return false;

  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaUTC.getUTCFullYear() === anio &&
    fechaUTC.getUTCMonth() === mes - 1 &&
    fechaUTC.getUTCDate() === dia
  );
}

export function fechaLocal(fecha: string, hora = 0): Date | null {
  if (!esFechaISOValida(fecha)) return null;

  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia, hora);
}

export function diasHastaFechaISO(fecha: string, desde = new Date()): number | null {
  if (!esFechaISOValida(fecha)) return null;

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaObjetivo = Date.UTC(anio, mes - 1, dia);
  const hoyLocal = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());

  return Math.round((fechaObjetivo - hoyLocal) / 86_400_000);
}
