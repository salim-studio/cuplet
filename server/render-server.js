// Cuplet render server — optional Node backend (no puppeteer needed).
// POST /api/render {project} -> validates + returns project JSON (feed it to ffmpeg in production).
// GET /health
import http from 'node:http';

const PORT = process.env.PORT || 3099;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true,"service":"cuplet"}'); return; }
  if (req.url === '/api/render' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { project } = JSON.parse(body || '{}');
        if (!project?.tracks || !project?.clips) throw new Error('invalid project');
        // Validate + summarize (fast). Real ffmpeg muxing can be added here with fluent-ffmpeg.
        const dur = Math.max(0.5, ...project.clips.map((c) => c.e || 0));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, duration: dur, clips: project.clips.length, note: 'browser export is recommended; wire ffmpeg here for server MP4' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`⚡ cuplet server on http://localhost:${PORT}`));
