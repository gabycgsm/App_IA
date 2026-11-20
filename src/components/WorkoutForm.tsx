import { useState, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, Send, HardDrive, Loader2 } from 'lucide-react';
import { WORKOUT_TYPES, type WorkoutEntry, type WorkoutType } from '../types/workout';
import { calculatePace, getTodayLocalYYYYMMDD } from '../utils/pace';
import { sendWorkoutToGoogleSheets } from '../utils/storage';
import { PaceTelemetryCard } from './PaceTelemetryCard';

interface WorkoutFormProps {
  scriptUrl: string;
  demoMode: boolean;
  onWorkoutSaved: (entry: WorkoutEntry) => void;
  onOpenSettings: () => void;
}

interface SubmitBanner {
  kind: 'sheets' | 'local' | 'error';
  message: string;
}

export function WorkoutForm({
  scriptUrl,
  demoMode,
  onWorkoutSaved,
  onOpenSettings,
}: WorkoutFormProps) {
  const [fecha, setFecha] = useState<string>(() => getTodayLocalYYYYMMDD());
  const [tipo, setTipo] = useState<WorkoutType>('Correr');
  const [distanciaInput, setDistanciaInput] = useState<string>('5.0');
  const [duracionInput, setDuracionInput] = useState<string>('27');
  const [notas, setNotas] = useState<string>('');

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [banner, setBanner] = useState<SubmitBanner | null>(null);

  const distanciaNum = Number.parseFloat(distanciaInput.replace(',', '.'));
  const duracionNum = Number.parseFloat(duracionInput.replace(',', '.'));
  const pace = calculatePace(distanciaNum, duracionNum);

  const handleAnalyzeWithAI = async () => {
    if (!pace.isValid) {
      setAiError('Ingresa una distancia y duración mayores a 0 para calcular el ritmo.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          tipo,
          distancia_km: distanciaNum,
          duracion_min: duracionNum,
          ritmo: pace.formatted,
          notas: notas.trim(),
        }),
      });

      const data = (await response.json()) as { feedback?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener el análisis de IA.');
      }

      setAiFeedback(data.feedback ?? '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión al analizar con IA.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!fecha) {
      setBanner({ kind: 'error', message: 'Selecciona una fecha válida para el entrenamiento.' });
      return;
    }
    if (!Number.isFinite(distanciaNum) || distanciaNum <= 0) {
      setBanner({ kind: 'error', message: 'Ingresa una distancia en km mayor a 0.' });
      return;
    }
    if (!Number.isFinite(duracionNum) || duracionNum <= 0) {
      setBanner({ kind: 'error', message: 'Ingresa una duración en minutos mayor a 0.' });
      return;
    }

    const cleanNotes = notas.trim();
    const payload = {
      fecha,
      tipo,
      distancia_km: Number(distanciaNum.toFixed(2)),
      duracion_min: Number(duracionNum.toFixed(2)),
      notas: cleanNotes,
    };

    setSubmitting(true);

    try {
      if (demoMode) {
        const localEntry: WorkoutEntry = {
          ...payload,
          id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ritmo: pace.formatted,
          syncStatus: 'local',
          createdAt: new Date().toISOString(),
          aiFeedback: aiFeedback ?? undefined,
        };
        onWorkoutSaved(localEntry);
        setBanner({
          kind: 'local',
          message:
            'Guardado localmente en Modo Demo (sin conexión). Activa el envío en Conexión para disparar a Google Sheets.',
        });
        setNotas('');
        setAiFeedback(null);
      } else {
        await sendWorkoutToGoogleSheets(scriptUrl, payload);

        const syncedEntry: WorkoutEntry = {
          ...payload,
          id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ritmo: pace.formatted,
          syncStatus: 'sheets',
          createdAt: new Date().toISOString(),
          aiFeedback: aiFeedback ?? undefined,
        };
        onWorkoutSaved(syncedEntry);
        setBanner({
          kind: 'sheets',
          message:
            'Envío disparado hacia Google Sheets (POST no-cors) y guardado en tu historial local.',
        });
        setNotas('');
        setAiFeedback(null);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con la URL de Google Apps Script. Verifica tu conexión o usa Modo Demo.';
      setBanner({ kind: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="form-heading" className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1
              id="form-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0E1015]"
            >
              Registrar entrenamiento
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Calcula tu ritmo al instante y envía directo a tu hoja de cálculo
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-[#0E1015] hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {demoMode ? 'Modo Demo activo' : 'Sheets conectado'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Tipo de actividad */}
          <div>
            <span className="block text-xs font-semibold text-zinc-700 mb-2">
              Tipo de actividad
            </span>
            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-xl">
              {WORKOUT_TYPES.map((option) => {
                const active = tipo === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTipo(option);
                      setAiFeedback(null);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#0E1015] text-white shadow-sm'
                        : 'text-zinc-600 hover:text-[#0E1015]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="workout-fecha" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Fecha
            </label>
            <input
              id="workout-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-[#0E1015] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0E1015] focus:border-[#0E1015]"
            />
          </div>

          {/* Distancia y Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="workout-distancia"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Distancia (km)
              </label>
              <input
                id="workout-distancia"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="5.00"
                value={distanciaInput}
                onChange={(e) => {
                  setDistanciaInput(e.target.value);
                  setAiFeedback(null);
                }}
                required
                className="w-full min-h-[54px] px-3.5 py-2 rounded-xl border border-zinc-300 bg-white font-mono text-xl font-bold text-[#0E1015] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0E1015] focus:border-[#0E1015]"
              />
            </div>

            <div>
              <label
                htmlFor="workout-duracion"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Duración (min)
              </label>
              <input
                id="workout-duracion"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="30"
                value={duracionInput}
                onChange={(e) => {
                  setDuracionInput(e.target.value);
                  setAiFeedback(null);
                }}
                required
                className="w-full min-h-[54px] px-3.5 py-2 rounded-xl border border-zinc-300 bg-white font-mono text-xl font-bold text-[#0E1015] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0E1015] focus:border-[#0E1015]"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="workout-notas" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Notas de la sesión
            </label>
            <textarea
              id="workout-notas"
              rows={2}
              placeholder="Sensaciones, terreno, clima o pulsaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-[#0E1015] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0E1015] focus:border-[#0E1015] resize-none"
            />
          </div>

          {/* Real-time Pace Readout + Gemini Coach */}
          <PaceTelemetryCard
            pace={pace}
            tipo={tipo}
            distanciaKm={Number.isFinite(distanciaNum) ? distanciaNum : 0}
            duracionMin={Number.isFinite(duracionNum) ? duracionNum : 0}
            aiFeedback={aiFeedback}
            aiLoading={aiLoading}
            aiError={aiError}
            onAnalyzeWithAI={handleAnalyzeWithAI}
          />

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[52px] px-5 py-3.5 rounded-xl bg-[#0E1015] text-white text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2.5 hover:bg-[#1E222D] active:scale-[0.99] transition-all duration-150 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Enviando entrenamiento...</span>
              </>
            ) : demoMode ? (
              <>
                <HardDrive className="w-4 h-4 text-[#CAFF00]" aria-hidden="true" />
                <span>Guardar en historial local (Modo Demo)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#CAFF00]" aria-hidden="true" />
                <span>Guardar y enviar a Google Sheets</span>
              </>
            )}
          </button>

          {/* Status Feedback Banner */}
          {banner && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5 ${
                banner.kind === 'sheets'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : banner.kind === 'local'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {banner.kind === 'sheets' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              {banner.kind === 'local' && (
                <HardDrive className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              {banner.kind === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span className="leading-snug font-medium">{banner.message}</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
