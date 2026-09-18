import { CupletProvider } from '../core/store';
import Toolbar from './Toolbar';
import Preview from './Preview';
import Timeline from './Timeline';
import MediaPanel from './MediaPanel';
import CaptionPanel from './CaptionPanel';
import type { Project } from '../core/types';

export function CupletStudio({ initial }: { initial?: Project }) {
  return (
    <CupletProvider initial={initial}>
      <div style={s.page}>
        <Toolbar />
        <div style={s.main}>
          <div style={s.side}>
            <MediaPanel />
            <CaptionPanel />
          </div>
          <div style={s.center}>
            <Preview />
          </div>
        </div>
        <Timeline />
      </div>
    </CupletProvider>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 12, padding: 12, maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, "Segoe UI", sans-serif' },
  main: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  side: { flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 },
  center: { flex: '0 1 340px', display: 'flex', justifyContent: 'center' },
};
