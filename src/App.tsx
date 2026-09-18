import { CupletStudio } from './components/Studio';

export default function App() {
  return (
    <div style={{ background: '#0b0b0e', minHeight: '100vh' }}>
      <CupletStudio />
      <footer style={{ textAlign: 'center', color: '#71717a', fontSize: 12, padding: 16 }}>
        © 2026 salim-slimani · Cuplet v1.0 — Timeline + Canvas + AI Captions + Export
      </footer>
    </div>
  );
}
