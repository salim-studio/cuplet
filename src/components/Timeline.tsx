import { useCuplet } from '../core/store';
import { projectDuration, fmtTime } from '../core/timeline';

const PX_PER_SEC = 60;

export default function Timeline() {
  const { project, currentTime, setTime, setProject, selectedId, select } = useCuplet();
  const dur = projectDuration(project);
  const W = Math.max(600, dur * PX_PER_SEC + 40);

  return (
    <div style={s.wrap}>
      <div style={s.ruler}>
        {Array.from({ length: Math.ceil(dur) + 1 }, (_, i) => (
          <span key={i} style={{ ...s.tick, left: i * PX_PER_SEC }} onClick={() => setTime(i)}>
            {fmtTime(i)}
          </span>
        ))}
        <div style={{ ...s.playhead, left: currentTime * PX_PER_SEC }} />
      </div>
      <div style={{ ...s.tracks, width: W }} onClick={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setTime(Math.max(0, (e.clientX - r.left) / PX_PER_SEC));
      }}>
        {project.tracks.map((t) => (
          <div key={t.id} style={s.track}>
            <span style={s.tname}>{t.name}</span>
            <div style={s.lane}>
              {project.clips.filter((c) => c.trackId === t.id).map((c) => (
                <div
                  key={c.id}
                  title={`${c.type} ${fmtTime(c.s)} → ${fmtTime(c.e)} (drag to move)`}
                  onClick={(e) => { e.stopPropagation(); select(c.id); }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const v = prompt('Clip text:', c.props.text ?? '');
                    if (v !== null) setProject((p) => ({ ...p, clips: p.clips.map((x) => x.id === c.id ? { ...x, props: { ...x.props, text: v } } : x) }));
                  }}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/cuplet-clip', c.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const id = e.dataTransfer.getData('text/cuplet-clip');
                    if (!id) return;
                    const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                    const nt = Math.max(0, (e.clientX - r.left) / PX_PER_SEC);
                    setProject((p) => {
                      const m = p.clips.find((x) => x.id === id);
                      if (!m) return p;
                      const len = m.e - m.s;
                      return { ...p, clips: p.clips.map((x) => x.id === id ? { ...x, s: nt, e: nt + len, trackId: t.id } : x) };
                    });
                  }}
                  style={{
                    ...s.clip,
                    left: c.s * PX_PER_SEC,
                    width: Math.max(24, (c.e - c.s) * PX_PER_SEC),
                    background: colorFor(c.type),
                    outline: selectedId === c.id ? '2px solid #fff' : 'none',
                  }}
                >
                  {c.props.text?.slice(0, 18) ?? c.type}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ ...s.playhead, top: 0, bottom: 0, left: currentTime * PX_PER_SEC }} />
      </div>
      <ClipTools />
    </div>
  );
}

function ClipTools() {
  const { project, selectedId, setProject } = useCuplet();
  const c = project.clips.find((x) => x.id === selectedId);
  if (!c) return <div style={s.hint}>Select a clip: drag to move across tracks • double-click to edit text</div>;
  return (
    <div style={s.tools}>
      <button style={s.btn} onClick={() => setProject((p) => {
        const len = c.e - c.s; const at = c.s + len / 2;
        return { ...p, clips: p.clips.flatMap((x) => x.id === c.id
          ? [{ ...x, e: at }, { ...x, id: x.id + '-b', s: at }]
          : [x]) };
      })}>✂ Split</button>
      <button style={s.btn} onClick={() => setProject((p) => ({ ...p, clips: p.clips.filter((x) => x.id !== c.id) }))}>🗑 Delete</button>
      <button style={s.btn} onClick={() => setProject((p) => ({ ...p, clips: p.clips.map((x) => x.id === c.id ? { ...x, e: x.e + 1 } : x) }))}>+1s Extend</button>
      <button style={s.btn} onClick={() => setProject((p) => ({ ...p, clips: p.clips.map((x) => x.id === c.id ? { ...x, s: Math.max(0, x.s - 0.5), e: x.e - 0.5 } : x) }))}>◀ Nudge</button>
    </div>
  );
}

function colorFor(t: string) {
  switch (t) {
    case 'video': return '#2563eb';
    case 'audio': return '#059669';
    case 'image': return '#7c3aed';
    case 'caption': return '#ea580c';
    default: return '#db2777';
  }
}

const s: Record<string, React.CSSProperties> = {
  wrap: { background: '#1a1a1f', borderRadius: 12, padding: 12, overflowX: 'auto', color: '#fff' },
  ruler: { position: 'relative', height: 22, fontSize: 11, color: '#aaa', marginBottom: 6, minWidth: 600 },
  tick: { position: 'absolute', cursor: 'pointer', borderLeft: '1px solid #444', paddingLeft: 4 },
  tracks: { position: 'relative' },
  track: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  tname: { width: 70, fontSize: 12, flexShrink: 0, color: '#ccc' },
  lane: { position: 'relative', flex: 1, height: 44, background: '#26262c', borderRadius: 8 },
  clip: { position: 'absolute', top: 5, height: 34, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', padding: '0 8px', cursor: 'grab', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' },
  playhead: { position: 'absolute', top: 0, width: 2, height: '100%', background: '#ffe45e', pointerEvents: 'none' },
  tools: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: { background: '#33333a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  hint: { fontSize: 12, color: '#888', marginTop: 8 },
};
