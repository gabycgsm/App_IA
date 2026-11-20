import { useState } from 'react';
import {
  Footprints,
  Mountain,
  Activity,
  Trash2,
  Send,
  CheckCircle2,
  HardDrive,
  Database,
} from 'lucide-react';
import { WORKOUT_TYPES, type WorkoutEntry, type WorkoutType } from '../types/workout';
import { calculatePace, formatDateEs } from '../utils/pace';
import { sendWorkoutToGoogleSheets } from '../utils/storage';

type FilterType = 'Todos' | WorkoutType;

interface WorkoutHistoryProps {
  workouts: WorkoutEntry[];
  scriptUrl: string;
  demoMode: boolean;
  onDeleteWorkout: (id: string) => void;
  onMarkSynced: (id: string) => void;
  onLoadDemoData: () => void;
  onClearAll: () => void;
}

function getWorkoutIcon(tipo: WorkoutType) {
  switch (tipo) {
    case 'Trail':
      return Mountain;
    case 'Caminata':
      return Footprints;
    default:
      return Activity;
  }
}

export function WorkoutHistory({
  workouts,
  scriptUrl,
  demoMode,
  onDeleteWorkout,
  onMarkSynced,
  onLoadDemoData,
  onClearAll,
}: WorkoutHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('Todos');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const filteredWorkouts =
    filter === 'Todos' ? workouts : workouts.filter((w) => w.tipo === filter);

  const totalKm = filteredWorkouts.reduce((acc, item) => acc + item.distancia_km, 0);
  const totalMin = filteredWorkouts.reduce((acc, item) => acc + item.duracion_min, 0);
  const avgPace = calculatePace(totalKm, totalMin);

  const handleResend = async (entry: WorkoutEntry) => {
    setResendingId(entry.id);
    setResendNotice(null);
    try {
      await sendWorkoutToGoogleSheets(scriptUrl, {
        fecha: entry.fecha,
        tipo: entry.tipo,
        distancia_km: entry.distancia_km,
        duracion_min: entry.duracion_min,
        notas: entry.notas,
      });
      onMarkSynced(entry.id);
      setResendNotice(
        `Envío disparado hacia Google Sheets para el registro del ${formatDateEs(entry.fecha)}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reenviar a Google Sheets.';
      setResendNotice(msg);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <section aria-labelledby="history-heading" className="space-y-4">
      {/* Summary KPI Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2
              id="history-heading"
              className="font-display text-2xl font-bold tracking-tight text-[#0E1015]"
            >
              Historial de sesiones
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Guardado en almacenamiento local del dispositivo
            </p>
          </div>
          {workouts.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Limpiar historial
            </button>
          )}
        </div>

        {/* 3-Column Athletic Totals */}
        <div className="grid grid-cols-3 gap-3 py-3.5 px-4 rounded-xl bg-[#F4F5F7] border border-zinc-200/60">
          <div>
            <p className="text-xs text-zinc-500">Distancia total</p>
            <p className="mt-0.5 font-mono text-lg sm:text-xl font-bold tabular-nums text-[#0E1015]">
              {totalKm.toFixed(1)} <span className="text-xs font-medium text-zinc-500">km</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Sesiones</p>
            <p className="mt-0.5 font-mono text-lg sm:text-xl font-bold tabular-nums text-[#0E1015]">
              {filteredWorkouts.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Ritmo medio</p>
            <p className="mt-0.5 font-mono text-lg sm:text-xl font-bold tabular-nums text-[#0E1015]">
              {avgPace.formatted}{' '}
              <span className="text-xs font-medium text-zinc-500">m/km</span>
            </p>
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 rounded-xl">
          {(['Todos', ...WORKOUT_TYPES] as FilterType[]).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`min-h-[44px] px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                  active
                    ? 'bg-white text-[#0E1015] shadow-sm'
                    : 'text-zinc-600 hover:text-[#0E1015]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {resendNotice && (
          <div
            role="status"
            className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-medium text-emerald-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{resendNotice}</span>
          </div>
        )}

        {/* List or Empty State */}
        <div className="mt-4 divide-y divide-zinc-100">
          {filteredWorkouts.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-zinc-700">
                {workouts.length === 0
                  ? 'Aún no hay entrenamientos guardados.'
                  : `No hay sesiones registradas de tipo ${filter}.`}
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Registra tu primera sesión o carga datos de ejemplo para probar filtros y métricas.
              </p>
              {workouts.length === 0 && (
                <button
                  type="button"
                  onClick={onLoadDemoData}
                  className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0E1015] text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#1E222D] transition-colors cursor-pointer"
                >
                  <Database className="w-4 h-4 text-[#CAFF00]" aria-hidden="true" />
                  <span>Cargar datos demo</span>
                </button>
              )}
            </div>
          ) : (
            filteredWorkouts.map((item) => {
              const Icon = getWorkoutIcon(item.tipo);
              return (
                <article key={item.id} className="py-4 first:pt-2 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] text-[#0E1015] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        {/* Clean unboxed metadata line */}
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">{formatDateEs(item.fecha)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#0E1015]">{item.tipo}</span>
                          <span aria-hidden="true">·</span>
                          {item.syncStatus === 'sheets' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Enviado a Sheets
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
                              Solo local
                            </span>
                          )}
                        </div>

                        {/* Tabular metrics */}
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono tabular-nums">
                          <span className="text-base sm:text-lg font-bold text-[#0E1015]">
                            {item.distancia_km.toFixed(2)} km
                          </span>
                          <span className="text-sm font-medium text-zinc-600">
                            {item.duracion_min} min
                          </span>
                          <span className="text-sm font-bold text-[#0E1015]">
                            {item.ritmo} <span className="text-xs font-normal text-zinc-500">min/km</span>
                          </span>
                        </div>

                        {item.notas && (
                          <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                            {item.notas}
                          </p>
                        )}

                        {item.aiFeedback && (
                          <p className="mt-2 text-xs text-zinc-600 bg-[#F4F5F7] rounded-lg px-3 py-2 leading-relaxed">
                            <span className="font-semibold text-[#0E1015]">IA: </span>
                            {item.aiFeedback}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons with >= 44px hitboxes */}
                    <div className="flex items-center shrink-0">
                      {item.syncStatus === 'local' && !demoMode && (
                        <button
                          type="button"
                          onClick={() => handleResend(item)}
                          disabled={resendingId === item.id}
                          title="Enviar este registro a Google Sheets"
                          aria-label="Enviar a Google Sheets"
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-600 hover:text-[#0E1015] hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          <Send className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteWorkout(item.id)}
                        title="Eliminar registro local"
                        aria-label="Eliminar registro"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
