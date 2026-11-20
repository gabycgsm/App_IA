import { useState } from 'react';
import { CheckCircle2, RotateCcw, Code2, ChevronDown, ChevronUp, WifiOff, Cloud } from 'lucide-react';
import { DEFAULT_APPS_SCRIPT_URL } from '../types/workout';

interface SheetsConfigPanelProps {
  scriptUrl: string;
  demoMode: boolean;
  onUpdateScriptUrl: (url: string) => void;
  onToggleDemoMode: (enabled: boolean) => void;
}

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.fecha,
    data.tipo,
    data.distancia_km,
    data.duracion_min,
    data.notas
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export function SheetsConfigPanel({
  scriptUrl,
  demoMode,
  onUpdateScriptUrl,
  onToggleDemoMode,
}: SheetsConfigPanelProps) {
  const [urlDraft, setUrlDraft] = useState<string>(scriptUrl);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  const handleSaveUrl = () => {
    const clean = urlDraft.trim() || DEFAULT_APPS_SCRIPT_URL;
    setUrlDraft(clean);
    onUpdateScriptUrl(clean);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleRestoreDefault = () => {
    setUrlDraft(DEFAULT_APPS_SCRIPT_URL);
    onUpdateScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <section aria-labelledby="config-heading" className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 space-y-5">
      <div>
        <h2
          id="config-heading"
          className="font-display text-2xl font-bold tracking-tight text-[#0E1015]"
        >
          Conexión con Google Sheets
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Envío directo vía Google Apps Script sin OAuth ni inicio de sesión
        </p>
      </div>

      {/* Modo Demo / Sin conexión */}
      <div className="rounded-xl bg-[#F4F5F7] border border-zinc-200/80 p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
            {demoMode ? (
              <WifiOff className="w-5 h-5 text-amber-700" aria-hidden="true" />
            ) : (
              <Cloud className="w-5 h-5 text-emerald-700" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0E1015]">
              Modo demo / local (sin conexión)
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {demoMode
                ? 'Activo: guarda solo en este dispositivo sin enviar peticiones a Google Sheets.'
                : 'Desactivado: cada registro se dispara por POST a tu URL de Apps Script.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          onClick={() => onToggleDemoMode(!demoMode)}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            demoMode
              ? 'bg-[#0E1015] text-[#CAFF00]'
              : 'bg-white border border-zinc-300 text-zinc-700 hover:text-[#0E1015]'
          }`}
        >
          {demoMode ? 'Activo' : 'Desactivado'}
        </button>
      </div>

      {/* URL /exec input */}
      <div className="space-y-2.5">
        <label htmlFor="apps-script-url" className="block text-xs font-semibold text-zinc-700">
          URL de Google Apps Script (/exec)
        </label>
        <input
          id="apps-script-url"
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white font-mono text-xs text-[#0E1015] focus:outline-none focus:ring-2 focus:ring-[#0E1015] focus:border-[#0E1015]"
        />

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSaveUrl}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E1015] text-white text-xs sm:text-sm font-semibold hover:bg-[#1E222D] transition-colors cursor-pointer"
          >
            Guardar URL
          </button>

          <button
            type="button"
            onClick={handleRestoreDefault}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs sm:text-sm font-medium text-zinc-700 hover:text-[#0E1015] hover:bg-zinc-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restaurar por defecto</span>
          </button>
        </div>

        {savedNotice && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-medium text-emerald-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>URL guardada en localStorage correctamente.</span>
          </div>
        )}
      </div>

      {/* Payload contract & Apps Script reference */}
      <div className="pt-2 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => setShowCode(!showCode)}
          className="min-h-[44px] w-full flex items-center justify-between text-xs font-semibold text-zinc-700 hover:text-[#0E1015] cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Code2 className="w-4 h-4" aria-hidden="true" />
            <span>Ver formato JSON y script doPost(e) compatible</span>
          </span>
          {showCode ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {showCode && (
          <div className="mt-2.5 space-y-2.5">
            <p className="text-xs text-zinc-600 leading-relaxed">
              La app envía un <code className="font-mono text-[#0E1015]">POST</code> con{' '}
              <code className="font-mono text-[#0E1015]">mode: &apos;no-cors&apos;</code> y{' '}
              <code className="font-mono text-[#0E1015]">Content-Type: text/plain;charset=utf-8</code>{' '}
              usando las claves exactas:{' '}
              <code className="font-mono text-[#0E1015]">
                fecha, tipo, distancia_km, duracion_min, notas
              </code>.
            </p>
            <pre className="p-3.5 rounded-xl bg-[#0E1015] text-zinc-100 font-mono text-[11px] leading-relaxed overflow-x-auto">
              {APPS_SCRIPT_SNIPPET}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
