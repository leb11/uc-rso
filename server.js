// UC-RSO website server. No packages needed: run `node server.js`.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), nodemailer = require('nodemailer');
// Settings can live in a file named .env (see .env.example), so no terminal tricks are needed.
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l); if (m && !l.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch {}
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'change-me';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');   // live content: news, projects, messages (not stored in git)
const F = { news: path.join(DATA, 'news.json'), projects: path.join(DATA, 'projects.json'), messages: path.join(DATA, 'messages.json'), partners: path.join(DATA, 'partners.json') };
fs.mkdirSync(DATA, { recursive: true });
for (const k of ['news', 'projects', 'partners']) if (!fs.existsSync(F[k])) fs.copyFileSync(path.join(__dirname, 'seed', k + '.json'), F[k]);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const tokens = new Set(), tries = {};
const read = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const clean = (s, n) => String(s || '').trim().slice(0, n);
const authed = req => tokens.has((req.headers.authorization || '').replace('Bearer ', ''));
const body = req => new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 6e6) { no(); req.destroy(); } }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { no(); } }); });
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
function saveImage(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl || ''); if (!m) return '';
  const buf = Buffer.from(m[2], 'base64'); if (buf.length > 4e6) return '';
  const name = 'uploads/' + crypto.randomBytes(8).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  fs.mkdirSync(path.join(PUB, 'images', 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(PUB, 'images', name), buf); return 'images/' + name;
}
async function api(req, res, url) {
  const [, , kind, id] = url.split('?')[0].split('/'), m = req.method;
  try {
    if (kind === 'login' && m === 'POST') {
      const ip = req.socket.remoteAddress, now = Date.now(); tries[ip] = (tries[ip] || []).filter(t => now - t < 6e5);
      if (tries[ip].length >= 5) return json(res, 429, { error: 'Too many attempts. Try again in 10 minutes.' });
      const b = await body(req);
      if (!same(b.password, PASS)) { tries[ip].push(now); return json(res, 401, { error: 'Wrong password.' }); }
      const t = crypto.randomBytes(24).toString('hex'); tokens.add(t); return json(res, 200, { token: t });
    }
    if (kind === 'contact' && m === 'POST') {
      const b = await body(req), name = clean(b.name, 120), email = clean(b.email, 160), msg = clean(b.msg, 4000);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) return json(res, 400, { error: 'Please fill in your name, a valid email, and a message.' });
      const all = read(F.messages); all.unshift({ id: crypto.randomBytes(6).toString('hex'), name, email, subject: clean(b.subject, 120), msg, at: new Date().toISOString() });
      write(F.messages, all.slice(0, 2000)); return json(res, 200, { ok: true });
    }
    if (kind === 'messages' && m === 'POST' && id) {
      if (!authed(req)) return json(res, 401, { error: 'Log in first.' });
      const b = await body(req), replyText = clean(b.reply, 5000), all = read(F.messages), message = all.find(x => x.id === id);
      if (!message) return json(res, 404, { error: 'Message not found.' });
      if (!replyText) return json(res, 400, { error: 'Write a reply before sending.' });
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !MAIL_FROM) return json(res, 503, { error: 'Email sending is not configured. Ask the website administrator to set up the office email account.' });
      const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
      try {
        await transporter.sendMail({
          from: MAIL_FROM,
          to: message.email,
          subject: 'Reply from the UC Research Services Office',
          text: `Dear ${message.name},\n\n${replyText}\n\nRegards,\nUC Research Services Office`
        });
      } catch {
        return json(res, 502, { error: 'The email could not be sent. Check the office email settings and try again.' });
      }
      const sentReply = { text: replyText, at: new Date().toISOString() };
      message.replies = Array.isArray(message.replies) ? message.replies : [];
      message.replies.push(sentReply); write(F.messages, all);
      return json(res, 200, { ok: true, reply: sentReply });
    }
    if (kind === 'messages' && m === 'GET') return authed(req) ? json(res, 200, read(F.messages)) : json(res, 401, { error: 'Log in first.' });
    if (kind === 'partners') {
      if (m === 'GET') return json(res, 200, read(F.partners));
      if (!authed(req)) return json(res, 401, { error: 'Log in first.' });
      const all = read(F.partners);
      if (m === 'POST') {
        const b = await body(req), name = clean(b.name, 120);
        if (!name) return json(res, 400, { error: 'Enter a partner name.' });
        if (all.some(partner => partner.toLowerCase() === name.toLowerCase())) return json(res, 409, { error: 'That partner is already listed.' });
        all.push(name); write(F.partners, all); return json(res, 201, { name });
      }
      if (m === 'DELETE') {
        const index = Number(id);
        if (!Number.isInteger(index) || index < 0 || index >= all.length) return json(res, 404, { error: 'Partner not found.' });
        const [partner] = all.splice(index, 1); write(F.partners, all); return json(res, 200, { ok: true, partner });
      }
    }
    if (kind === 'news' || kind === 'projects') {
      if (m === 'GET') return json(res, 200, read(F[kind]));
      if (!authed(req)) return json(res, 401, { error: 'Log in first.' });
      const all = read(F[kind]);
      if (m === 'POST') {
        const b = await body(req), t = clean(b.t, 160), s = clean(b.s, 1500); if (!t || !s) return json(res, 400, { error: 'Title and summary are required.' });
        const k = kind === 'news' ? (['Hosted', 'Attended', 'Participated'].includes(b.k) ? b.k : 'Hosted') : (b.k === 'Completed' ? 'Completed' : 'Ongoing');
        const item = { id: crypto.randomBytes(6).toString('hex'), img: saveImage(b.image), t, k, d: clean(b.d, 20), s };
        all.unshift(item); write(F[kind], all); return json(res, 200, item);
      }
      if (m === 'PATCH' && kind === 'projects') {
        const b = await body(req), item = all.find(x => x.id === id);
        if (!item) return json(res, 404, { error: 'Project not found.' });
        if (!['Ongoing', 'Completed'].includes(b.k)) return json(res, 400, { error: 'Choose Ongoing or Completed.' });
        item.k = b.k; write(F.projects, all); return json(res, 200, item);
      }
      if (m === 'DELETE') {
        const gone = all.find(x => x.id === id);
        if (gone && /^images\/uploads\/[a-f0-9]+\.(jpg|png|webp)$/.test(gone.img || '')) fs.unlink(path.join(PUB, gone.img), () => {});
        write(F[kind], all.filter(x => x.id !== id)); return json(res, 200, { ok: true });
      }
    }
    json(res, 404, { error: 'Not found' });
  } catch { json(res, 400, { error: 'Bad request' }); }
}
function serve(req, res, url) {
  let p = path.normalize(decodeURIComponent(url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
  const file = path.join(PUB, p); if (!file.startsWith(PUB)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Page not found'); }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
    if (range) { const [a, b] = range.replace('bytes=', '').split('-'), s = +a || 0, e2 = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${s}-${e2}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e2 - s + 1 }); return fs.createReadStream(file, { start: s, end: e2 }).pipe(res); }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': type.startsWith('image') || type === 'video/mp4' ? 'public, max-age=86400' : 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}
http.createServer((req, res) => { const url = req.url; url.startsWith('/api/') ? api(req, res, url) : serve(req, res, url); }).listen(PORT, () => {
  console.log(`UC-RSO website running at http://localhost:${PORT}`);
  if (PASS === 'change-me') console.log('WARNING: using the default staff password. Set ADMIN_PASSWORD before going live.');
});
