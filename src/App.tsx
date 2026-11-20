import { useState, useEffect } from 'react';
import { PlusCircle, ListOrdered, SlidersHorizontal } from 'lucide-react';
import type { WorkoutEntry } from './types/workout';
import {
  loadWorkouts,
  saveWorkouts,
  loadScriptUrl,
  saveScriptUrl,
  loadDemoMode,
  saveDemoMode,
  createDemoSampleWorkouts,
} from './utils/storage';
import { WorkoutForm } from './components/WorkoutForm';
import { WorkoutHistory } from './components/WorkoutHistory';
import { SheetsConfigPanel } from './components/SheetsConfigPanel';

type ActiveTab = 'registrar' | 'historial' | 'conexion';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('registrar');
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(() => loadWorkouts());
  const [scriptUrl, setScriptUrl] = useState<string>(() => loadScriptUrl());
  const [demoMode, setDemoMode] = useState<boolean>(() => loadDemoMode());

  useEffect(() => {
    saveWorkouts(workouts);
  }, [workouts]);

  const handleWorkoutSaved = (entry: WorkoutEntry) => {
    setWorkouts((prev) => [entry, ...prev]);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMarkSynced = (id: string) => {
    setWorkouts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, syncStatus: 'sheets' } : item))
    );
  };

  const handleLoadDemoData = () => {
    const samples = createDemoSampleWorkouts();
    setWorkouts((prev) => [...samples, ...prev]);
  };

  const handleClearAll = () => {
    setWorkouts([]);
  };

  const handleUpdateScriptUrl = (url: string) => {
    setScriptUrl(url);
    saveScriptUrl(url);
  };

  const handleToggleDemoMode = (enabled: boolean) => {
    setDemoMode(enabled);
    saveDemoMode(enabled);
  };

  const handleDesktopNav = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#0E1015]">
      {/* Top Bar Contract: 3 zones (Brand — Nav Links — 1 Primary Action) */}
      <header className="sticky top-0 z-30 h-12 lg:h-14 bg-[#0E1015] text-white border-b border-zinc-800">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleDesktopNav('registrar')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CAFF00]"
          >
            <svg
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M1 15L5 9H9L5 15H1Z" fill="#CAFF00" />
              <path d="M7.5 15L13 5H17L11.5 15H7.5Z" fill="#CAFF00" />
              <path d="M14 15L20 1H22L18 15H14Z" fill="#FFFFFF" />
            </svg>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              RunTracker Sheets
            </span>
          </button>

          {/* Zone 2: Clean single-line text nav links (Desktop) */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300"
          >
            <button
              type="button"
              onClick={() => handleDesktopNav('registrar')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'registrar'
                  ? 'text-white underline decoration-[#CAFF00] decoration-2 underline-offset-8'
                  : 'hover:text-white'
              }`}
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => handleDesktopNav('historial')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'historial'
                  ? 'text-white underline decoration-[#CAFF00] decoration-2 underline-offset-8'
                  : 'hover:text-white'
              }`}
            >
              Historial ({workouts.length})
            </button>
            <button
              type="button"
              onClick={() => handleDesktopNav('conexion')}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'conexion'
                  ? 'text-white underline decoration-[#CAFF00] decoration-2 underline-offset-8'
                  : 'hover:text-white'
              }`}
            >
              Conexión
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'conexion' ? 'registrar' : 'conexion')}
              className="px-3.5 py-1.5 rounded-lg bg-[#CAFF00] text-[#0E1015] text-xs font-bold hover:bg-[#d8ff3d] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeTab === 'conexion' ? 'Ir a registro' : 'Configurar Sheets'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24 lg:pb-10">
        {/* Mobile Tabbed View (< lg) */}
        <div className="lg:hidden">
          {activeTab === 'registrar' && (
            <WorkoutForm
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onWorkoutSaved={handleWorkoutSaved}
              onOpenSettings={() => setActiveTab('conexion')}
            />
          )}

          {activeTab === 'historial' && (
            <WorkoutHistory
              workouts={workouts}
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onDeleteWorkout={handleDeleteWorkout}
              onMarkSynced={handleMarkSynced}
              onLoadDemoData={handleLoadDemoData}
              onClearAll={handleClearAll}
            />
          )}

          {activeTab === 'conexion' && (
            <SheetsConfigPanel
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onUpdateScriptUrl={handleUpdateScriptUrl}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}
        </div>

        {/* Desktop 2-Column Balanced Grid (>= lg) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          <div className="lg:col-span-5">
            <WorkoutForm
              scriptUrl={scriptUrl}
              demoMode={demoMode}
              onWorkoutSaved={handleWorkoutSaved}
              onOpenSettings={() => setActiveTab('conexion')}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            {activeTab === 'conexion' ? (
              <SheetsConfigPanel
                scriptUrl={scriptUrl}
                demoMode={demoMode}
                onUpdateScriptUrl={handleUpdateScriptUrl}
                onToggleDemoMode={handleToggleDemoMode}
              />
            ) : (
              <WorkoutHistory
                workouts={workouts}
                scriptUrl={scriptUrl}
                demoMode={demoMode}
                onDeleteWorkout={handleDeleteWorkout}
                onMarkSynced={handleMarkSynced}
                onLoadDemoData={handleLoadDemoData}
                onClearAll={handleClearAll}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Tab Bar (< lg) — 56px height */}
      <nav
        aria-label="Navegación inferior"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-zinc-200 grid grid-cols-3 items-center"
      >
        <button
          type="button"
          onClick={() => setActiveTab('registrar')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'registrar' ? 'text-[#0E1015]' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <PlusCircle
            className={`w-5 h-5 ${activeTab === 'registrar' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Registrar
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'historial' ? 'text-[#0E1015]' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <ListOrdered
            className={`w-5 h-5 ${activeTab === 'historial' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap tabular-nums">
            Historial ({workouts.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conexion')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'conexion' ? 'text-[#0E1015]' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <SlidersHorizontal
            className={`w-5 h-5 ${activeTab === 'conexion' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Conexión
          </span>
        </button>
      </nav>
    </div>
  );
}
