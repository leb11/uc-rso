const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let token = sessionStorage.getItem('rso_token') || '';
async function api(method, url, data) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { sessionStorage.removeItem('rso_token'); location.reload(); }
  if (!r.ok) throw new Error(j.error || 'Something went wrong.');
  return j;
}
const readFile = f => new Promise((ok, no) => { if (!f || !f.size) return ok(''); if (f.size > 4e6) return no(new Error('That photo is over 4 MB. Please choose a smaller one.')); const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error('Could not read the photo.')); r.readAsDataURL(f); });
async function refresh() {
  const [n, p, m] = await Promise.all([api('GET', '/api/news'), api('GET', '/api/projects'), api('GET', '/api/messages')]);
  const row = (kind, x) => `<div class="msg"><b>${esc(x.t)}</b> <span class="tag ${x.k == 'Completed' ? 'c' : ''}">${esc(x.k)}</span><button class="del" data-kind="${kind}" data-id="${esc(x.id)}">Delete</button></div>`;
  $('#nl').innerHTML = n.map(x => row('news', x)).join('') || '<p class="note">No news yet.</p>';
  $('#pl').innerHTML = p.map(x => row('projects', x)).join('') || '<p class="note">No projects yet.</p>';
  $('#inbox').innerHTML = m.map(x => `<div class="msg"><b>${esc(x.name)}</b> (${esc(x.email)}) · ${esc(x.subject)} · <span class="note">${esc(new Date(x.at).toLocaleString())}</span><br>${esc(x.msg)}</div>`).join('') || '<p class="note">No messages yet.</p>';
}
function show() { $('#login').hidden = true; $('#panel').hidden = false; refresh().catch(e => $('#status').textContent = e.message); }
$('#lf').onsubmit = async e => {
  e.preventDefault();
  try { const j = await api('POST', '/api/login', { password: $('#pw').value }); token = j.token; sessionStorage.setItem('rso_token', token); show(); }
  catch (x) { $('#lerr').textContent = x.message; }
};
for (const [id, kind] of [['#nf', 'news'], ['#pf', 'projects']]) {
  $(id).onsubmit = async e => {
    e.preventDefault(); const f = e.target, st = $('#status');
    try {
      const data = { t: f.t.value, k: f.k.value, s: f.s.value, d: f.d ? f.d.value : '', image: await readFile(f.image.files[0]) };
      await api('POST', '/api/' + kind, data); f.reset(); st.textContent = 'Published. It is now on the website.'; refresh();
    } catch (x) { st.textContent = x.message; }
  };
}
document.addEventListener('click', async e => {
  const b = e.target.closest('.del'); if (!b || !confirm('Delete this item? This cannot be undone.')) return;
  try { await api('DELETE', `/api/${b.dataset.kind}/${b.dataset.id}`); $('#status').textContent = 'Deleted.'; refresh(); } catch (x) { $('#status').textContent = x.message; }
});
if (token) show();
