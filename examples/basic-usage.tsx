import { CupletStudio } from '../src/components/Studio';

// Minimal embed — copy this into any React app:
export default function BasicExample() {
  return (
    <CupletStudio
      initial={{
        properties: { width: 1280, height: 720, fps: 30, background: '#111111' },
        tracks: [
          { id: 'v1', type: 'video', name: 'فيديو' },
          { id: 't1', type: 'text', name: 'نصوص' },
        ],
        clips: [
          { id: 't-1', trackId: 't1', type: 'text', s: 0, e: 3,
            props: { text: 'صُنع بـ Cuplet ⚡', fontSize: 64, fill: '#fff', x: 0.5, y: 0.5 } },
        ],
      }}
    />
  );
}
