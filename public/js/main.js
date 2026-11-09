const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let SVC = [], PART = [], GAL = [];
let projects = [], news = [], filt = 'all';
async function load(url, fallback) {
  try { const r = await fetch(url); if (!r.ok) throw 0; return await r.json(); } catch { return fallback; }
}
function applySite(site) {
  document.querySelectorAll('[data-site]').forEach(el => { const v = site[el.dataset.site]; if (!v) return; el.textContent = v; if (el.hasAttribute('data-mail')) el.href = 'mailto:' + v; });
}
function render() {
  $('#svc').innerHTML = SVC.map(x => `<div class="card"><div class="ico">${esc(x.icon)}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`).join('');
  $('#gal').innerHTML = GAL.map(g => `<figure><img src="images/${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"><figcaption>${esc(g.caption)}</figcaption></figure>`).join('');
  $('#part').innerHTML = PART.map(p => `<span>${esc(p)}</span>`).join('');
  const list = projects.filter(p => filt == 'all' || p.k == filt);
  $('#proj').innerHTML = list.length ? list.map(p => `<div class="card ${p.img ? 'm' : ''}">${p.img ? `<img class="cover" src="${esc(p.img)}" alt="${esc(p.t)}">` : ''}<div><span class="tag ${p.k == 'Completed' ? 'c' : ''}">${esc(p.k)}</span><h3>${esc(p.t)}</h3><p>${esc(p.s)}</p></div></div>`).join('') : '<p class="note">No projects in this group yet.</p>';
  $('#newsList').innerHTML = news.length ? news.map(n => `<div class="card ${n.img ? 'm' : ''}">${n.img ? `<img class="cover" src="${esc(n.img)}" alt="${esc(n.t)}">` : ''}<div><span class="tag">${esc(n.k)}</span><h3>${esc(n.t)}</h3><p>${esc(n.d)}${n.d ? ' · ' : ''}${esc(n.s)}</p></div></div>`).join('') : '<p class="note">No news yet. Check back soon.</p>';
  const o = projects.filter(p => p.k == 'Ongoing').length, c = projects.length - o, m = Math.max(o, c, news.length, 1);
  $('#s1').textContent = o; $('#s2').textContent = c; $('#s3').textContent = news.length; $('#s4').textContent = PART.length;
  $('#bars').innerHTML = [['Ongoing', o], ['Completed', c], ['News posts', news.length]].map(r => `<div class="row"><span>${r[0]}</span><i style="width:${r[1] / m * 100}%"></i><b>${r[1]}</b></div>`).join('');
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { filt = b.dataset.f; document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-pressed', x == b)); render(); });
$('#menu').onclick = () => { const o = $('#nav').classList.toggle('open'); $('#menu').setAttribute('aria-expanded', o); };
$('#nav').onclick = () => $('#nav').classList.remove('open');
$('#up').onclick = () => scrollTo({ top: 0 });
$('#dn').onclick = () => scrollTo({ top: document.body.scrollHeight });
$('#cf').onsubmit = async e => {
  e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), n = $('#cmsg');
  if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || !f.msg.trim()) { n.textContent = 'Please fill in your name, a valid email, and a message.'; return; }
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    if (!r.ok) throw 0; n.textContent = 'Thank you! Your message was sent. We will get back to you soon.'; e.target.reset();
  } catch {
    location.href = 'mailto:rso@uc-bcf.edu.ph?subject=' + encodeURIComponent(f.subject) + '&body=' + encodeURIComponent(f.msg + '\n\n' + f.name + ' (' + f.email + ')');
    n.textContent = 'We could not send it from the page, so your email app is opening instead.';
  }
};
render();
Promise.all([load('/api/projects', null), load('/api/news', null), load('data/services.json', []), load('data/partners.json', []), load('data/gallery.json', []), load('data/site.json', {})]).then(([p, n, sv, pa, ga, si]) => {
  projects = p || []; news = n || []; SVC = sv; PART = pa; GAL = ga; applySite(si); render();
  if (p === null || n === null) $('#newsList').innerHTML = '<p class="note">News and projects could not be loaded. The website server may not be running.</p>';
});
