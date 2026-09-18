import { CupletStudio } from './components/Studio';

export default function App() {
  return (
    <div style={{ background: '#0b0b0e', minHeight: '100vh' }}>
      <CupletStudio />
      <footer style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: 16 }}>
        Cuplet v1.0 — محرر فيديو خفيف وسريع • Timeline + Canvas + AI Captions + Export
      </footer>
    </div>
  );
}
