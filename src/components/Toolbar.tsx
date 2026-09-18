import { useState } from 'react';
import { useCuplet } from '../core/store';
import { exportRealtime, downloadBlob } from '../render/exporter';

export default function Toolbar() {
  const { project, setProject, undo, redo, canUndo, canRedo } = useCuplet();
  const [prog, setProg] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const doExport = async (server = false) => {
    setBusy(true);
    setProg('بدء التصدير...');
    try {
      if (server) {
        const res = await fetch('http://localhost:3099/api/render', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project }),
        });
        if (!res.ok) throw new Error('شغّل سيرفر التصدير: npm run server');
        const blob = await res.blob();
        downloadBlob(blob, `cuplet-${Date.now()}.json.mp4`);
      } else {
        const blob = await exportRealtime(project, (p) =>
          setProg(`${p.label} ${Math.round((p.done / p.total) * 100)}%`));
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        downloadBlob(blob, `cuplet-${Date.now()}.${ext}`);
      }
      setProg('✅ تم التصدير بنجاح');
    } catch (e) { setProg(`❌ ${(e as Error).message}`); }
    finally { setBusy(false); setTimeout(() => setProg(''), 4000); }
  };

  return (
    <div style={s.wrap}>
      <strong style={s.logo}>⚡ Cuplet</strong>
      <span style={s.sub}>أسرع من twick • بدون wasm • يعمل في كل المتصفحات</span>
      <div style={s.row}>
        <button style={s.btn} disabled={!canUndo} onClick={undo}>↩ تراجع</button>
        <button style={s.btn} disabled={!canRedo} onClick={redo}>↪ إعادة</button>
        <button style={s.btn} onClick={() => {
          const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
          downloadBlob(blob, 'cuplet-project.json');
        }}>💾 حفظ</button>
        <label style={{ ...s.btn, cursor: 'pointer' }}>📂 فتح
          <input type="file" accept=".json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setProject(JSON.parse(await f.text()));
          }} />
        </label>
        <select
          value={`${project.properties.width}x${project.properties.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number);
            setProject((p) => ({ ...p, properties: { ...p.properties, width: w, height: h } }));
          }}
          style={s.sel}
        >
          <option value="720x1280">📱 عمودي 9:16</option>
          <option value="1280x720">🖥 أفقي 16:9</option>
          <option value="1080x1080">⬛ مربع 1:1</option>
        </select>
        <button style={s.exp} disabled={busy} onClick={() => doExport(false)}>⬇ تصدير سريع</button>
      </div>
      {prog && <div style={s.prog}>{prog}</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { background: '#141419', borderRadius: 12, padding: 12, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 },
  logo: { fontSize: 20 },
  sub: { fontSize: 12, color: '#888' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  btn: { background: '#26262c', color: '#fff', border: '1px solid #3a3a42', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 },
  sel: { background: '#26262c', color: '#fff', border: '1px solid #3a3a42', borderRadius: 8, padding: 7, fontSize: 13 },
  exp: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  prog: { fontSize: 13, color: '#ffe45e' },
};
