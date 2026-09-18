import { useRef, useState } from 'react';
import { useCuplet } from '../core/store';
import { uid } from '../core/timeline';
import { FILTERS } from '../effects/filters';

export default function MediaPanel() {
  const { project, setProject, currentTime } = useCuplet();
  const [filter, setFilter] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const addClip = (type: 'video' | 'image' | 'audio' | 'text', src?: string, text?: string) => {
    const id = uid(type);
    setProject((p) => {
      // auto-create a matching track when missing (default project has no audio/image track)
      let track = p.tracks.find((t) => t.type === type) ?? p.tracks.find((t) => t.type === 'video');
      let tracks = p.tracks;
      if (!track) {
        track = { id: uid('track'), type, name: type === 'audio' ? 'Audio' : type === 'image' ? 'Images' : 'Video' };
        tracks = [...p.tracks, track];
      }
      return {
        ...p,
        tracks,
        clips: [...p.clips, {
          id, trackId: track.id, type,
          s: currentTime, e: currentTime + (type === 'audio' ? 8 : type === 'text' ? 4 : 6),
          props: { src, text: text ?? (type === 'text' ? 'New text — double-click to edit' : undefined), fontSize: 52, fill: '#ffffff', x: 0.5, y: 0.8, filter: filter || undefined, fit: 'cover' },
        }],
      };
    });
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const url = URL.createObjectURL(f);
      if (f.type.startsWith('video')) addClip('video', url);
      else if (f.type.startsWith('image')) addClip('image', url);
      else if (f.type.startsWith('audio')) addClip('audio', url);
    }
  };

  return (
    <div style={s.wrap}>
      <h3 style={s.h}>📁 Media</h3>
      <div style={s.row}>
        <button style={s.btn} onClick={() => fileRef.current?.click()}>⬆ Upload files</button>
        <button style={s.btn} onClick={() => addClip('text')}>＋ Text</button>
        <input ref={fileRef} type="file" accept="video/*,image/*,audio/*" multiple style={HIDDEN} onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
      </div>
      <div style={s.row}>
        <input ref={urlRef} placeholder="Paste a video / image / audio URL…" style={s.input} />
        <button style={s.btn} onClick={() => {
          const u = urlRef.current?.value.trim();
          if (!u) return;
          if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(u)) addClip('audio', u);
          else if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u)) addClip('image', u);
          else addClip('video', u);
          if (urlRef.current) urlRef.current.value = '';
        }}>Add</button>
      </div>
      <label style={s.lbl}>✨ Effect for new clips:
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={s.input}>
          {Object.entries(FILTERS).map(([k, f]) => <option key={k} value={f.value}>{f.label}</option>)}
        </select>
      </label>
      <div style={s.grid}>
        {['https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          'https://picsum.photos/seed/cuplet1/720/1280',
          'https://picsum.photos/seed/cuplet2/720/1280'].map((u, i) => (
          <button key={i} style={s.sample} onClick={() => addClip(i === 0 ? 'video' : 'image', u)}>
            {i === 0 ? '🎬 Sample video' : `🖼 Sample image ${i}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// visually hidden (NOT display:none): Safari blocks programmatic clicks on display:none file inputs
const HIDDEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' };

const s: Record<string, React.CSSProperties> = {
  wrap: { background: '#1a1a1f', borderRadius: 12, padding: 12, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 },
  h: { margin: 0, fontSize: 15 },
  row: { display: 'flex', gap: 8 },
  btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  input: { flex: 1, background: '#26262c', border: '1px solid #3a3a42', color: '#fff', borderRadius: 8, padding: '7px 10px', fontSize: 13 },
  lbl: { fontSize: 12, color: '#ccc', display: 'flex', gap: 8, alignItems: 'center' },
  grid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  sample: { background: '#26262c', color: '#fff', border: '1px solid #3a3a42', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 12 },
};
