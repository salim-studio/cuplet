import type { Clip, Project } from './types';

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${String(m).padStart(2, '0')}:${sec.toFixed(1).padStart(4, '0')}`;
};

/** duration = max clip end or properties.duration */
export function projectDuration(p: Project): number {
  let d = p.properties.duration ?? 0;
  for (const c of p.clips) d = Math.max(d, c.e);
  return Math.max(0.5, d);
}

/** binary-search friendly: clips active at time t, sorted by track order */
export function activeClips(p: Project, t: number): Clip[] {
  const out: Clip[] = [];
  for (const c of p.clips) if (t >= c.s && t < c.e) out.push(c);
  return out;
}

export function moveClip(p: Project, id: string, ds: number): Project {
  return {
    ...p,
    clips: p.clips.map((c) => {
      if (c.id !== id) return c;
      const len = c.e - c.s;
      const s = Math.max(0, c.s + ds);
      return { ...c, s, e: s + len };
    }),
  };
}

export function trimClip(p: Project, id: string, ns: number, ne: number): Project {
  return {
    ...p,
    clips: p.clips.map((c) => {
      if (c.id !== id) return c;
      const s = clamp(Math.min(ns, ne - 0.1), 0, 3600);
      const e = clamp(Math.max(ns + 0.1, ne), s + 0.1, 3600);
      return { ...c, s, e };
    }),
  };
}

export function splitClip(p: Project, id: string, at: number): Project {
  const c = p.clips.find((x) => x.id === id);
  if (!c || at <= c.s + 0.05 || at >= c.e - 0.05) return p;
  const a: Clip = { ...c, e: at };
  const b: Clip = { ...c, id: uid(c.type), s: at, offset: (c.offset ?? 0) + (at - c.s) };
  return { ...p, clips: [...p.clips.filter((x) => x.id !== id), a, b] };
}
