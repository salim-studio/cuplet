// Fast Canvas2D compositor: media cache, rAF loop, fit-cover/contain math. No fabric.js.
import type { Clip, Project } from '../core/types';
import { activeClips } from '../core/timeline';

const mediaCache = new Map<string, HTMLVideoElement | HTMLImageElement>();

export function getMedia(src: string, kind: 'video' | 'image'): Promise<HTMLVideoElement | HTMLImageElement> {
  const hit = mediaCache.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    // blob:/data: URLs must NOT carry crossOrigin (breaks load); only remote http(s) needs it
    const remote = /^https?:\/\//i.test(src);
    if (kind === 'image') {
      const img = new Image();
      if (remote) img.crossOrigin = 'anonymous';
      img.onload = () => { mediaCache.set(src, img); resolve(img); };
      img.onerror = reject;
      img.src = src;
    } else {
      const v = document.createElement('video');
      if (remote) v.crossOrigin = 'anonymous';
      v.muted = true;
      (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
      v.preload = 'auto';
      v.onloadeddata = () => { mediaCache.set(src, v); resolve(v); };
      v.onerror = () => reject(new Error('Could not load the video'));
      v.src = src;
    }
  });
}

function drawCover(ctx: CanvasRenderingContext2D, el: HTMLVideoElement | HTMLImageElement, W: number, H: number, fit: string) {
  const iw = (el as HTMLVideoElement).videoWidth || (el as HTMLImageElement).width;
  const ih = (el as HTMLVideoElement).videoHeight || (el as HTMLImageElement).height;
  if (!iw || !ih) return;
  let dw = W, dh = H, dx = 0, dy = 0;
  if (fit === 'contain') {
    const s = Math.min(W / iw, H / ih);
    dw = iw * s; dh = ih * s; dx = (W - dw) / 2; dy = (H - dh) / 2;
    ctx.drawImage(el, dx, dy, dw, dh);
  } else if (fit === 'fill') {
    ctx.drawImage(el, 0, 0, W, H);
  } else {
    const s = Math.max(W / iw, H / ih);
    dw = iw * s; dh = ih * s; dx = (W - dw) / 2; dy = (H - dh) / 2;
    ctx.drawImage(el, dx, dy, dw, dh);
  }
}

/** Draw single frame of project at time t. Syncs <video> elements to clip time. */
export async function renderFrame(ctx: CanvasRenderingContext2D, project: Project, t: number): Promise<void> {
  const { width: W, height: H, background } = project.properties;
  if (ctx.canvas.width !== W || ctx.canvas.height !== H) {
    ctx.canvas.width = W; ctx.canvas.height = H;
  }
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = background ?? '#000';
  ctx.fillRect(0, 0, W, H);

  const clips = activeClips(project, t);
  // draw order: video/image first, then text/caption
  const media = clips.filter((c) => c.type === 'video' || c.type === 'image');
  const overlay = clips.filter((c) => c.type === 'text' || c.type === 'caption');

  for (const c of media) await drawClip(ctx, c, t, W, H);
  for (const c of overlay) drawText(ctx, c, W, H);
  ctx.restore();
}

async function drawClip(ctx: CanvasRenderingContext2D, c: Clip, t: number, W: number, H: number) {
  const p = c.props;
  ctx.save();
  ctx.globalAlpha = p.opacity ?? 1;
  if (p.filter) (ctx as CanvasRenderingContext2D & { filter?: string }).filter = p.filter;
  try {
    if ((c.type === 'video' || c.type === 'image') && p.src) {
      const el = await getMedia(p.src, c.type === 'image' ? 'image' : 'video');
      if (el instanceof HTMLVideoElement) {
        const target = (c.offset ?? 0) + (t - c.s);
        if (Math.abs(el.currentTime - target) > 0.35) {
          try { el.currentTime = Math.max(0, target); } catch { /* noop */ }
        }
        if (el.readyState >= 2) drawCover(ctx, el, W, H, p.fit ?? 'cover');
      } else {
        drawCover(ctx, el, W, H, p.fit ?? 'cover');
      }
    }
  } catch { /* missing media -> skip */ }
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, c: Clip, W: number, H: number) {
  const p = c.props;
  const text = p.text ?? '';
  if (!text) return;
  const fs = p.fontSize ?? 48;
  const x = (p.x ?? 0.5) * W;
  const y = (p.y ?? 0.85) * H;
  ctx.save();
  ctx.globalAlpha = p.opacity ?? 1;
  ctx.font = `800 ${fs}px ${p.fontFamily ?? 'Inter, system-ui, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (c.type === 'caption') {
    const pad = fs * 0.35;
    const w = Math.min(W * 0.92, ctx.measureText(text).width + pad * 2);
    ctx.fillStyle = p.background ?? 'rgba(0,0,0,.7)';
    const bx = x - w / 2, by = y - fs * 0.75;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, w, fs * 1.5, 12); ctx.fill(); }
    else ctx.fillRect(bx, by, w, fs * 1.5);
  }
  ctx.fillStyle = p.fill ?? '#fff';
  ctx.lineWidth = Math.max(2, fs / 14);
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** rAF playback loop with audio sync for <audio> clips (lightweight) */
export function startPreviewLoop(
  canvas: HTMLCanvasElement,
  getProject: () => Project,
  getTime: () => number,
  isPlaying: () => boolean,
  advance: (dt: number) => void,
): () => void {
  const ctx = canvas.getContext('2d')!;
  let raf = 0;
  let last = performance.now();
  const audios = new Map<string, HTMLAudioElement>();

  const tick = async (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    const p = getProject();
    const t = getTime();
    if (isPlaying()) advance(dt);
    await renderFrame(ctx, p, getTime());
    syncAudio(p, t, audios);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); audios.forEach((a) => a.pause()); };
}

function syncAudio(p: Project, t: number, cache: Map<string, HTMLAudioElement>) {
  for (const c of p.clips) {
    if (c.type !== 'audio' || !c.props.src) continue;
    let a = cache.get(c.id);
    if (!a) {
      a = new Audio(c.props.src);
      a.crossOrigin = 'anonymous';
      cache.set(c.id, a);
    }
    const active = t >= c.s && t < c.e;
    if (active) {
      a.volume = c.props.volume ?? 1;
      if (a.paused) {
        try { a.currentTime = (c.offset ?? 0) + (t - c.s); void a.play(); } catch { /* noop */ }
      }
    } else if (!a.paused) a.pause();
  }
}
