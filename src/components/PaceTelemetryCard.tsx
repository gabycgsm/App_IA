import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { PaceResult } from '../utils/pace';
import type { WorkoutType } from '../types/workout';

interface PaceTelemetryCardProps {
  pace: PaceResult;
  tipo: WorkoutType;
  distanciaKm: number;
  duracionMin: number;
  aiFeedback: string | null;
  aiLoading: boolean;
  aiError: string | null;
  onAnalyzeWithAI: () => void;
}

export function PaceTelemetryCard({
  pace,
  tipo,
  distanciaKm,
  duracionMin,
  aiFeedback,
  aiLoading,
  aiError,
  onAnalyzeWithAI,
}: PaceTelemetryCardProps) {
  // Subtle intensity gauge percentage (capped 0..100 for visual arc feedback)
  // Faster pace (~3:00/km) -> higher bar, slower walk (~12:00/km) -> lower bar
  const intensityPercent =
    pace.secondsPerKm !== null
      ? Math.max(12, Math.min(100, Math.round(((720 - pace.secondsPerKm) / (720 - 180)) * 100)))
      : 0;

  return (
    <div className="rounded-2xl bg-[#0E1015] text-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-400 tracking-wide">
            Ritmo medio en tiempo real
          </p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span
              className="font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#CAFF00]"
              aria-live="polite"
            >
              {pace.formatted}
            </span>
            <span className="text-sm font-medium text-zinc-300 whitespace-nowrap">
              min/km
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-400">Velocidad</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
            {pace.isValid && pace.speedKmh !== null ? `${pace.speedKmh.toFixed(1)} km/h` : '-- km/h'}
          </p>
        </div>
      </div>

      {/* Athletic intensity gauge bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#CAFF00] transition-all duration-200 ease-out"
            style={{ width: `${intensityPercent}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400 tabular-nums">
          <span>
            {tipo}
            <span aria-hidden="true"> · </span>
            {distanciaKm > 0 ? `${distanciaKm.toFixed(2)} km` : '0.00 km'}
            <span aria-hidden="true"> · </span>
            {duracionMin > 0 ? `${duracionMin} min` : '0 min'}
          </span>
        </div>
      </div>

      {/* Gemini AI Coach Action & Output */}
      <div className="mt-5 pt-4 border-t border-zinc-800/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-zinc-300">
            Comentario práctico sobre tu sesión y ritmo
          </span>
          <button
            type="button"
            onClick={onAnalyzeWithAI}
            disabled={aiLoading || !pace.isValid}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#CAFF00] text-[#0E1015] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#d8ff3d] active:scale-[0.98] transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Analizar con IA</span>
              </>
            )}
          </button>
        </div>

        {aiError && (
          <div
            role="alert"
            className="mt-3 rounded-xl bg-red-950/60 border border-red-800/70 px-3.5 py-2.5 text-xs text-red-200 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{aiError}</span>
          </div>
        )}

        {aiFeedback && !aiError && (
          <div className="mt-3 rounded-xl bg-zinc-900/90 border border-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-100">
            <p className="text-xs font-semibold text-[#CAFF00] mb-1">
              Análisis de entrenamiento
            </p>
            <p>{aiFeedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
