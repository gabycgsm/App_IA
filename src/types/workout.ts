export type WorkoutType = 'Correr' | 'Caminata' | 'Trail';

export type SyncStatus = 'sheets' | 'local';

export interface SheetsPayload {
  fecha: string;
  tipo: WorkoutType;
  distancia_km: number;
  duracion_min: number;
  notas: string;
}

export interface WorkoutEntry extends SheetsPayload {
  id: string;
  ritmo: string;
  syncStatus: SyncStatus;
  createdAt: string;
  aiFeedback?: string;
}

export const WORKOUT_TYPES: WorkoutType[] = ['Correr', 'Caminata', 'Trail'];

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwp6QzL4k96u0FUICUDcz2kxBibH2_H9MdtrUfL6IwBKKjwDNcdV2SM8yTvTusKkWbecA/exec';
