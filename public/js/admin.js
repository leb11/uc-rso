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
  const row = (kind, x) => kind === 'projects'
    ? `<div class="msg project-row"><b>${esc(x.t)}</b><label class="project-status">Status<select class="project-status-select" data-id="${esc(x.id)}" data-status="${esc(x.k)}" aria-label="Status for ${esc(x.t)}"><option${x.k === 'Ongoing' ? ' selected' : ''}>Ongoing</option><option${x.k === 'Completed' ? ' selected' : ''}>Completed</option></select></label><button class="del" data-kind="${kind}" data-id="${esc(x.id)}">Delete</button></div>`
    : `<div class="msg"><b>${esc(x.t)}</b> <span class="tag ${x.k == 'Completed' ? 'c' : ''}">${esc(x.k)}</span><button class="del" data-kind="${kind}" data-id="${esc(x.id)}">Delete</button></div>`;
  $('#nl').innerHTML = n.map(x => row('news', x)).join('') || '<p class="note">No news yet.</p>';
  $('#pl').innerHTML = p.map(x => row('projects', x)).join('') || '<p class="note">No projects yet.</p>';
  $('#inbox').innerHTML = m.map(x => `<article class="inbox-message"><div class="inbox-header"><div><b>${esc(x.name)}</b><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></div><time>${esc(new Date(x.at).toLocaleString())}</time></div><p class="inbox-body">${esc(x.msg)}</p>${(x.replies || []).map(reply => `<div class="sent-reply"><b>Reply sent</b><time>${esc(new Date(reply.at).toLocaleString())}</time><p>${esc(reply.text)}</p></div>`).join('')}<form class="reply-form" data-id="${esc(x.id)}"><label>Reply<textarea name="reply" rows="4" required></textarea></label><button class="btn s" type="submit">Send reply by email</button></form></article>`).join('') || '<p class="note">No messages yet.</p>';
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
document.addEventListener('change', async e => {
  const select = e.target.closest('.project-status-select'); if (!select) return;
  const previous = select.dataset.status; select.disabled = true;
  try {
    const project = await api('PATCH', `/api/projects/${select.dataset.id}`, { k: select.value });
    $('#status').textContent = `${project.t} status saved as ${project.k}.`; refresh();
  } catch (x) { select.value = previous; $('#status').textContent = x.message; }
  finally { select.disabled = false; }
});
document.addEventListener('submit', async e => {
  const form = e.target.closest('.reply-form'); if (!form) return;
  e.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
  try {
    await api('POST', `/api/messages/${form.dataset.id}`, { reply: form.elements.reply.value });
    $('#status').textContent = 'Reply sent to the visitor.'; await refresh();
  } catch (x) { $('#status').textContent = x.message; button.disabled = false; }
});
if (token) show();
