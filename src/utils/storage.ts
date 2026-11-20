import { DEFAULT_APPS_SCRIPT_URL, type SheetsPayload, type WorkoutEntry } from '../types/workout';
import { calculatePace, getTodayLocalYYYYMMDD } from './pace';

const WORKOUTS_STORAGE_KEY = 'runtracker_sheets_workouts_v1';
const SCRIPT_URL_STORAGE_KEY = 'runtracker_sheets_script_url_v1';
const DEMO_MODE_STORAGE_KEY = 'runtracker_sheets_demo_mode_v1';

export function loadWorkouts(): WorkoutEntry[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: WorkoutEntry[]): void {
  try {
    localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadScriptUrl(): string {
  try {
    const saved = localStorage.getItem(SCRIPT_URL_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : DEFAULT_APPS_SCRIPT_URL;
  } catch {
    return DEFAULT_APPS_SCRIPT_URL;
  }
}

export function saveScriptUrl(url: string): void {
  try {
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, url.trim() || DEFAULT_APPS_SCRIPT_URL);
  } catch {
    // Ignore storage errors
  }
}

export function loadDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveDemoMode(enabled: boolean): void {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

export async function sendWorkoutToGoogleSheets(scriptUrl: string, payload: SheetsPayload): Promise<void> {
  const targetUrl = scriptUrl.trim();
  if (!targetUrl) {
    throw new Error('Configura una URL válida de Google Apps Script (/exec).');
  }

  await fetch(targetUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      fecha: payload.fecha,
      tipo: payload.tipo,
      distancia_km: payload.distancia_km,
      duracion_min: payload.duracion_min,
      notas: payload.notas,
    }),
  });
}

export function createDemoSampleWorkouts(): WorkoutEntry[] {
  const today = new Date();
  const offsetDate = (daysAgo: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const samples: Array<Omit<WorkoutEntry, 'id' | 'ritmo' | 'createdAt'>> = [
    {
      fecha: getTodayLocalYYYYMMDD(),
      tipo: 'Correr',
      distancia_km: 8.4,
      duracion_min: 42,
      notas: 'Rodaje progresivo en asfalto, últimas 2 km a ritmo vivo.',
      syncStatus: 'local',
      aiFeedback:
        'Buen rodaje progresivo a 05:00 min/km. Mantén 24 h de recuperación suave o estiramientos de gemelos antes de tu próxima sesión de calidad.',
    },
    {
      fecha: offsetDate(2),
      tipo: 'Trail',
      distancia_km: 12.6,
      duracion_min: 84,
      notas: 'Sendero técnico con desnivel positivo +420 m, terreno seco.',
      syncStatus: 'local',
    },
    {
      fecha: offsetDate(4),
      tipo: 'Caminata',
      distancia_km: 5.2,
      duracion_min: 52,
      notas: 'Recuperación activa matinal, pulsaciones bajas.',
      syncStatus: 'local',
    },
  ];

  return samples.map((item, idx) => {
    const pace = calculatePace(item.distancia_km, item.duracion_min);
    return {
      ...item,
      id: `demo-${Date.now()}-${idx}`,
      ritmo: pace.formatted,
      createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
    };
  });
}
