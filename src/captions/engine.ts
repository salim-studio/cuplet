// Fast caption engine: SRT/VTT parse, Web Speech live transcribe, pluggable Whisper endpoint.
import type { CaptionCue } from '../core/types';
import { uid } from '../core/timeline';

export function parseSRT(text: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = text.replace(/\r/g, '').split(/\n\s*\n/);
  for (const b of blocks) {
    const lines = b.split('\n').filter(Boolean);
    if (lines.length < 2) continue;
    const tline = lines.find((l) => l.includes('-->')) ?? '';
    const m = tline.match(/(\d+):(\d+):([\d.]+)\s*-->\s*(\d+):(\d+):([\d.]+)/);
    if (!m) continue;
    const toSec = (h: string, mi: string, s: string) => +h * 3600 + +mi * 60 + parseFloat(s.replace(',', '.'));
    cues.push({
      id: uid('cap'),
      start: toSec(m[1], m[2], m[3]),
      end: toSec(m[4], m[5], m[6]),
      text: lines.slice(lines.indexOf(tline) + 1).join(' ').trim(),
    });
  }
  return cues.sort((a, b) => a.start - b.start);
}

export function parseVTT(text: string): CaptionCue[] {
  return parseSRT(text.replace(/^WEBVTT.*\n/, ''));
}

export function cuesToSRT(cues: CaptionCue[]): string {
  const f = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(3);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.padStart(6, '0').replace('.', ',')}`;
  };
  return cues.map((c, i) => `${i + 1}\n${f(c.start)} --> ${f(c.end)}\n${c.text}\n`).join('\n');
}

/** Split long text into timed cues (fallback auto-caption when no AI available) */
export function autoCuesFromText(text: string, totalDur: number): CaptionCue[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const per = Math.max(0.4, totalDur / Math.ceil(words.length / 6));
  const cues: CaptionCue[] = [];
  for (let i = 0; i < words.length; i += 6) {
    const chunk = words.slice(i, i + 6).join(' ');
    const start = (i / words.length) * totalDur;
    cues.push({ id: uid('cap'), start, end: Math.min(totalDur, start + per), text: chunk });
  }
  return cues;
}

/** Optional: call a Whisper-compatible endpoint. Returns cues. */
export async function transcribeWithWhisper(audioBlob: Blob, endpoint: string, apiKey?: string): Promise<CaptionCue[]> {
  const fd = new FormData();
  fd.append('file', audioBlob, 'audio.webm');
  fd.append('model', 'whisper-1');
  fd.append('response_format', 'verbose_json');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error(`Whisper error ${res.status}`);
  const json = await res.json();
  // supports openai verbose_json {segments:[{start,end,text}]}
  const segs = json.segments ?? json.chunks ?? [];
  return segs.map((s: { start: number; end: number; text: string }) => ({
    id: uid('cap'), start: s.start, end: s.end, text: (s.text || '').trim(),
  }));
}

/** Live transcribe via browser Web Speech API (no server, free, fast) */
export function liveTranscribe(onResult: (text: string, isFinal: boolean) => void, lang = 'ar-SA'): () => void {
  const SR: unknown = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  if (!SR) throw new Error('المتصفح لا يدعم التعرف الصوتي المباشر');
  const Rec = SR as new () => {
    lang: string; interimResults: boolean; continuous: boolean;
    onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    start(): void; stop(): void;
  };
  const rec = new Rec();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1];
    const item = r[0];
    onResult(item.transcript, (r as unknown as { isFinal?: boolean }).isFinal !== false);
  };
  rec.start();
  return () => rec.stop();
}
