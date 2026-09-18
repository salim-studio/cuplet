import { useEffect, useRef } from 'react';
import { useCuplet } from '../core/store';
import { startPreviewLoop } from '../render/compositor';
import { projectDuration } from '../core/timeline';

export default function Preview() {
  const { project, currentTime, playing, setTime, setPlaying } = useCuplet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ project, currentTime, playing });
  stateRef.current = { project, currentTime, playing };
  const setTimeRef = useRef(setTime);
  setTimeRef.current = setTime;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stop = startPreviewLoop(
      canvas,
      () => stateRef.current.project,
      () => stateRef.current.currentTime,
      () => stateRef.current.playing,
      (dt) => {
        const dur = projectDuration(stateRef.current.project);
        const nt = stateRef.current.currentTime + dt;
        if (nt >= dur) {
          setTimeRef.current(0);
          stateRef.current.playing = false;
        } else setTimeRef.current(nt);
      }
    );
    return stop;
  }, []);

  // keep playing flag in sync for loop closure
  useEffect(() => { stateRef.current.playing = playing; }, [playing]);

  const dur = projectDuration(project);

  return (
    <div style={s.wrap}>
      <canvas ref={canvasRef} width={project.properties.width} height={project.properties.height} style={s.canvas} />
      <div style={s.bar}>
        <button style={s.btn} onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
        <input
          type="range" min={0} max={dur} step={0.05} value={currentTime}
          onChange={(e) => setTime(+e.target.value)} style={{ flex: 1 }}
        />
        <span style={s.t}>{currentTime.toFixed(1)} / {dur.toFixed(1)}s</span>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', background: '#111', borderRadius: 12, padding: 12 },
  canvas: { width: 270, height: 480, background: '#000', borderRadius: 8, maxWidth: '100%', objectFit: 'contain' },
  bar: { display: 'flex', gap: 8, alignItems: 'center', width: '100%', color: '#fff' },
  btn: { fontSize: 18, padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' },
  t: { fontSize: 12, whiteSpace: 'nowrap' },
};
