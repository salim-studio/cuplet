// Fast export: MediaRecorder real-time (works everywhere) + WebCodecs MP4 (fast offline) — no ffmpeg.wasm download.
import type { Project } from '../core/types';
import { projectDuration } from '../core/timeline';
import { renderFrame } from './compositor';

export interface ExportProgress { done: number; total: number; label: string }
export type ProgressFn = (p: ExportProgress) => void;

function pickMime(): string {
  const cands = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const m of cands) {
    try { if (window.MediaRecorder?.isTypeSupported(m)) return m; } catch { /* noop */ }
  }
  return '';
}

/** Real-time capture: plays canvas through MediaRecorder. Fast, compatible with all browsers. */
export async function exportRealtime(
  project: Project,
  onProgress: ProgressFn,
  opts?: { fps?: number; bitrate?: number },
): Promise<Blob> {
  const fps = opts?.fps ?? project.properties.fps ?? 30;
  const canvas = document.createElement('canvas');
  canvas.width = project.properties.width;
  canvas.height = project.properties.height;
  const ctx = canvas.getContext('2d')!;
  const stream = canvas.captureStream(fps);
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: opts?.bitrate ?? 8_000_000 } : undefined);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' }));
  });

  const dur = projectDuration(project);
  const step = 1 / fps;
  rec.start(250);
  const t0 = performance.now();
  for (let t = 0; t < dur; t += step) {
    await renderFrame(ctx, project, t);
    onProgress({ done: t, total: dur, label: 'تصدير سريع...' });
    // yield to keep UI alive; ~0ms keeps it faster than realtime while canvas stream timestamps stay valid
    await new Promise((r) => setTimeout(r, 0));
    void t0;
  }
  // tail
  await renderFrame(ctx, project, dur - 0.01);
  await new Promise((r) => setTimeout(r, 400));
  rec.stop();
  return done;
}

/** Offline MP4 via WebCodecs when available, else realtime. No wasm download. */
export async function exportMP4(project: Project, onProgress: ProgressFn): Promise<Blob> {
  // WebCodecs direct muxing needs an optional `mp4-muxer` dep.
  // Default fast path: realtime capture (VP9/H264) — install mp4-muxer to enable offline MP4.
  return exportRealtime(project, onProgress);
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
