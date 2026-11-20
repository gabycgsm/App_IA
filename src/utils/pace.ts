export interface PaceResult {
  formatted: string;
  secondsPerKm: number | null;
  speedKmh: number | null;
  isValid: boolean;
}

export function getTodayLocalYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculatePace(distanciaKm: number, duracionMin: number): PaceResult {
  if (!Number.isFinite(distanciaKm) || !Number.isFinite(duracionMin) || distanciaKm <= 0 || duracionMin <= 0) {
    return {
      formatted: '--:--',
      secondsPerKm: null,
      speedKmh: null,
      isValid: false,
    };
  }

  const totalSecondsPerKm = Math.round((duracionMin * 60) / distanciaKm);
  const mins = Math.floor(totalSecondsPerKm / 60);
  const secs = totalSecondsPerKm % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const speedKmh = distanciaKm / (duracionMin / 60);

  return {
    formatted,
    secondsPerKm: totalSecondsPerKm,
    speedKmh,
    isValid: true,
  };
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatDateEs(fechaStr: string): string {
  const parts = fechaStr.split('-');
  if (parts.length !== 3) return fechaStr;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11 || !Number.isFinite(day)) {
    return fechaStr;
  }
  return `${day} ${MONTHS_ES[monthIdx]} ${year}`;
}
