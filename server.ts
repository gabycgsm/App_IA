import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface AnalyzeWorkoutBody {
  fecha?: string;
  tipo?: string;
  distancia_km?: number;
  duracion_min?: number;
  ritmo?: string;
  notas?: string;
}

const app = express();
app.use(express.json());

app.post('/api/analyze-workout', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        'No se encontró GEMINI_API_KEY en el servidor. Configura tu clave en Settings > Secrets para usar el análisis con IA.',
    });
    return;
  }

  const body = (req.body || {}) as AnalyzeWorkoutBody;
  const distancia = Number(body.distancia_km);
  const duracion = Number(body.duracion_min);
  const tipo = typeof body.tipo === 'string' && body.tipo.trim() ? body.tipo.trim() : 'Correr';
  const fecha = typeof body.fecha === 'string' && body.fecha.trim() ? body.fecha.trim() : '';
  const ritmo = typeof body.ritmo === 'string' && body.ritmo.trim() ? body.ritmo.trim() : '--:--';
  const notas = typeof body.notas === 'string' ? body.notas.trim() : '';

  if (!Number.isFinite(distancia) || distancia <= 0 || !Number.isFinite(duracion) || duracion <= 0) {
    res.status(400).json({
      error: 'Ingresa una distancia (km) y duración (min) válidas mayores a 0 para analizar la sesión.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      `Datos del entrenamiento:`,
      `- Tipo: ${tipo}`,
      fecha ? `- Fecha: ${fecha}` : null,
      `- Distancia: ${distancia.toFixed(2)} km`,
      `- Duración: ${duracion} min`,
      `- Ritmo medio: ${ritmo} min/km`,
      notas ? `- Notas del atleta: "${notas}"` : '- Notas del atleta: (sin notas)',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Eres un entrenador deportivo experto en running, trail y caminata deportiva. ' +
          'Responde en español natural, directo y motivador, con rigor práctico. ' +
          'Entrega un comentario breve (máximo 3 frases cortas, ~45-65 palabras en total) que incluya: ' +
          '1) valoración específica del esfuerzo según tipo, distancia y ritmo en min/km, ' +
          '2) una recomendación práctica concreta de recuperación o para la próxima sesión. ' +
          'No uses emojis excesivos, viñetas ni encabezados markdown.',
      },
    });

    const feedback = (response.text ?? '').trim();
    if (!feedback) {
      res.status(502).json({
        error: 'El modelo no devolvió un análisis legible. Intenta nuevamente.',
      });
      return;
    }

    res.json({ feedback });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al consultar Gemini.';
    console.error('Error en /api/analyze-workout:', message);
    res.status(502).json({
      error: `No se pudo completar el análisis con Gemini: ${message}`,
    });
  }
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RunTracker Sheets escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer();
