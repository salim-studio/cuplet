import { useState } from 'react';
import { useCuplet } from '../core/store';
import { parseSRT, parseVTT, autoCuesFromText, cuesToSRT, transcribeWithWhisper, liveTranscribe } from '../captions/engine';
import { uid } from '../core/timeline';
import { projectDuration } from '../core/timeline';

export default function CaptionPanel() {
  const { project, setProject } = useCuplet();
  const [text, setText] = useState('Welcome to today\u2019s tutorial — learn how to craft a professional video in minutes');
  const [whisperUrl, setWhisperUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [preset, setPreset] = useState('default');

  const pushCues = (cues: { start: number; end: number; text: string }[]) => {
    const track = project.tracks.find((t) => t.type === 'caption') ?? project.tracks[0];
    setProject((p) => ({
      ...p,
      clips: [...p.clips, ...cues.map((c) => ({
        id: uid('cap'), trackId: track.id, type: 'caption' as const,
        s: c.start, e: c.end,
        props: {
          text: c.text, fontSize: 44, fill: preset === 'karaoke' ? '#ffe45e' : '#fff',
          background: preset === 'minimal' ? 'transparent' : preset === 'pop' ? '#7c3aed' : 'rgba(0,0,0,.7)',
          x: 0.5, y: 0.86,
        },
      }))],
    }));
  };

  return (
    <div style={s.wrap}>
      <h3 style={s.h}>💬 Captions & AI</h3>
      <div style={s.row}>
        <select value={preset} onChange={(e) => setPreset(e.target.value)} style={s.input}>
          <option value="default">Classic</option>
          <option value="karaoke">Karaoke</option>
          <option value="minimal">Minimal</option>
          <option value="pop">Pop</option>
        </select>
        <button style={s.btn} onClick={() => pushCues(autoCuesFromText(text, projectDuration(project)))}>⚡ Auto-generate</button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} style={s.area} placeholder="Type narration text — it will be auto-timed across the video…" />
      <div style={s.row}>
        <label style={{ ...s.btn, cursor: 'pointer' }}>📄 Import SRT/VTT
          <input type="file" accept=".srt,.vtt,.txt" style={HIDDEN} onChange={async (e) => {
            try {
              const f = e.target.files?.[0];
              if (!f) return;
              const t = await f.text();
              const cues = f.name.toLowerCase().endsWith('.vtt') ? parseVTT(t) : parseSRT(t);
              if (!cues.length) throw new Error('No cues found in this file');
              pushCues(cues);
            } catch (err) { alert(`Could not import file: ${(err as Error).message}`); }
            finally { e.target.value = ''; }
          }} />
        </label>
        <button style={s.btn2} onClick={() => {
          const caps = project.clips.filter((c) => c.type === 'caption');
          const blob = new Blob([cuesToSRT(caps.map((c) => ({ id: c.id, start: c.s, end: c.e, text: c.props.text ?? '' })))], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'cuplet.srt'; a.click();
        }}>⬇ Export SRT</button>
      </div>
      <div style={s.row}>
        <button style={s.btn2} disabled={!!busy} onClick={() => {
          try {
            setBusy('🎙 Listening… speak now');
            const stop = liveTranscribe((t, final) => {
              if (final && t.trim()) { pushCues([{ start: 0, end: 4, text: t.trim() }]); stop(); setBusy(''); }
            });
            setTimeout(() => { try { stop(); } catch { /* noop */ } setBusy(''); }, 30000);
          } catch (err) { alert((err as Error).message); }
        }}>🎙 Live dictation</button>
      </div>
      <div style={s.row}>
        <input value={whisperUrl} onChange={(e) => setWhisperUrl(e.target.value)} placeholder="Whisper endpoint (optional)" style={s.input} />
        <button style={s.btn2} onClick={async () => {
          if (!whisperUrl) return alert('Enter a Whisper endpoint first');
          setBusy('⏳ Transcribing…');
          try {
            const audio = project.clips.find((c) => c.type === 'audio' || c.type === 'video');
            if (!audio?.props.src) throw new Error('Add an audio/video clip first');
            const blob = await (await fetch(audio.props.src)).blob();
            pushCues(await transcribeWithWhisper(blob, whisperUrl));
          } catch (err) { alert((err as Error).message); }
          finally { setBusy(''); }
        }}>🤖 Whisper</button>
      </div>
      {busy && <div style={s.busy}>{busy}</div>}
      <div style={s.count}>Caption lines: {project.clips.filter((c) => c.type === 'caption').length}</div>
    </div>
  );
}

// visually hidden (NOT display:none): Safari blocks programmatic clicks on display:none file inputs
const HIDDEN: React.CSSProperties = { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' };

const s: Record<string, React.CSSProperties> = {
  wrap: { background: '#1a1a1f', borderRadius: 12, padding: 12, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 },
  h: { margin: 0, fontSize: 15 },
  row: { display: 'flex', gap: 8 },
  btn: { background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  btn2: { background: '#26262c', color: '#fff', border: '1px solid #3a3a42', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  input: { flex: 1, background: '#26262c', border: '1px solid #3a3a42', color: '#fff', borderRadius: 8, padding: '7px 10px', fontSize: 13 },
  area: { background: '#26262c', border: '1px solid #3a3a42', color: '#fff', borderRadius: 8, padding: 8, fontSize: 13, resize: 'vertical' },
  busy: { fontSize: 12, color: '#ffe45e' },
  count: { fontSize: 12, color: '#888' },
};
