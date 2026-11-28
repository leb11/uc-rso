const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let SVC = [], PART = [], GAL = [], SITE = {};
let projects = [], news = [], filt = 'all';

const SERVICE_ICONS = {
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="15.5,8.5 13.6,13.6 8.5,15.5 10.4,10.4"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>',
  graduation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="2,10 12,5 22,10 12,15"/><path d="M6 12.5v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/><line x1="22" y1="10" x2="22" y2="16"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="20" x2="21" y2="20"/><rect x="5" y="12" width="3.5" height="8" rx="0.8"/><rect x="10.25" y="7" width="3.5" height="13" rx="0.8"/><rect x="15.5" y="4" width="3.5" height="16" rx="0.8"/></svg>',
  document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14,3 14,8 19,8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M8.5 14.2 7 21l5-2.5L17 21l-1.5-6.8"/></svg>'
};

async function load(url, fallback) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw 0;
    return await r.json();
  } catch {
    return fallback;
  }
}

function applySite(site) {
  SITE = site || {};
  document.querySelectorAll('[data-site]').forEach(el => {
    const v = SITE[el.dataset.site];
    if (!v) return;
    el.textContent = v;
    if (el.hasAttribute('data-mail')) el.href = 'mailto:' + v;
  });
}

function render() {
  $('#svc').innerHTML = SVC.map(x =>
    `<a class="card service-card" href="service.html?id=${esc(x.slug || '')}"><div class="ico" aria-hidden="true">${SERVICE_ICONS[x.icon] || SERVICE_ICONS.document}</div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><span class="svc-more">Learn more <span aria-hidden="true">→</span></span></a>`
  ).join('');

  $('#gal').innerHTML = GAL.map((g, idx) => {
    if (g.video) {
      const thumb = g.poster
        ? `<img src="images/${esc(g.poster)}" alt="${esc(g.caption)}" loading="lazy">`
        : `<video class="gal-vid-thumb" src="video/${esc(g.video)}" muted playsinline preload="metadata"></video>`;
      return `<figure tabindex="0" data-idx="${idx}"><div class="gal-img-wrap">${thumb}<span class="gal-vid-pill">Video</span><span class="gal-play-badge" aria-hidden="true"><span><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><polygon points="7,4 20,12 7,20"/></svg></span></span></div><figcaption>${esc(g.caption)}</figcaption></figure>`;
    }
    return `<figure tabindex="0" data-idx="${idx}"><div class="gal-img-wrap"><img src="images/${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"></div><figcaption>${esc(g.caption)}</figcaption></figure>`;
  }).join('');

  $('#part').innerHTML = PART.map(p => `<span>${esc(p)}</span>`).join('');

  const list = projects.filter(p => filt === 'all' || p.k === filt);
  $('#proj').innerHTML = list.length
    ? list.map(p =>
      `<article class="card ${p.img ? 'm' : ''}">${p.img ? `<div class="cover-wrap"><img class="cover" src="${esc(p.img)}" alt="${esc(p.t)}" loading="lazy"></div>` : ''}<div class="${p.img ? 'card-body' : ''}"><div class="meta-row"><span class="tag ${p.k === 'Completed' ? 'c' : ''}">${esc(p.k)}</span></div><h3>${esc(p.t)}</h3><p>${esc(p.s)}</p></div></article>`
    ).join('')
    : '<p class="note">No projects in this group yet.</p>';

  $('#newsList').innerHTML = news.length
    ? news.map(n =>
      `<article class="card ${n.img ? 'm' : ''}">${n.img ? `<div class="cover-wrap"><img class="cover" src="${esc(n.img)}" alt="${esc(n.t)}" loading="lazy"></div>` : ''}<div class="${n.img ? 'card-body' : ''}"><div class="meta-row"><span class="tag">${esc(n.k)}</span>${n.d ? `<time class="date-chip">${esc(n.d)}</time>` : ''}</div><h3>${esc(n.t)}</h3><p>${esc(n.s)}</p></div></article>`
    ).join('')
    : '<p class="note">No news yet. Check back soon.</p>';

  const o = projects.filter(p => p.k === 'Ongoing').length;
  const c = projects.length - o;
  $('#s1').textContent = o;
  $('#s2').textContent = c;
  $('#s3').textContent = news.length;
  $('#s4').textContent = PART.length;
}

document.querySelectorAll('.tab').forEach(b => {
  b.onclick = () => {
    filt = b.dataset.f;
    document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-pressed', x === b));
    render();
  };
});

$('#menu').onclick = () => {
  const open = $('#nav').classList.toggle('open');
  $('#menu').setAttribute('aria-expanded', open);
};
$('#nav').onclick = () => {
  $('#nav').classList.remove('open');
  $('#menu').setAttribute('aria-expanded', 'false');
};

$('#up').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
$('#dn').onclick = () => scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

// Gallery lightbox with video support, arrow buttons, keyboard & touch/mouse swipe
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbVid = $('#lbVid'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
let lbIndex = 0;

function stopVideo() {
  lbVid.pause();
  lbVid.removeAttribute('src');
  lbVid.load();
}

function showLightboxItem(index) {
  if (!GAL.length) return;
  lbIndex = (index + GAL.length) % GAL.length;
  const item = GAL[lbIndex];
  stopVideo();
  if (item.video) {
    lbImg.hidden = true;
    lbImg.src = '';
    lbVid.hidden = false;
    lbVid.poster = item.poster ? 'images/' + item.poster : '';
    lbVid.src = 'video/' + item.video;
    lbVid.play().catch(() => {});
  } else {
    lbVid.hidden = true;
    lbImg.hidden = false;
    lbImg.src = 'images/' + item.image;
    lbImg.alt = item.caption || '';
  }
  lbCap.textContent = item.caption || '';
  lbCount.textContent = `${lbIndex + 1} / ${GAL.length}`;
}

function openLightbox(fig) {
  if (!fig) return;
  const idx = Number(fig.dataset.idx);
  if (!Number.isInteger(idx)) return;
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  showLightboxItem(idx);
}

function closeLightbox() {
  stopVideo();
  lbImg.src = '';
  lb.hidden = true;
  document.body.style.overflow = '';
}

$('#gal').addEventListener('click', e => openLightbox(e.target.closest('figure')));
$('#gal').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const fig = e.target.closest('figure');
    if (fig) { e.preventDefault(); openLightbox(fig); }
  }
});

$('#lbClose').onclick = closeLightbox;
$('#lbPrev').onclick = () => showLightboxItem(lbIndex - 1);
$('#lbNext').onclick = () => showLightboxItem(lbIndex + 1);
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') showLightboxItem(lbIndex + 1);
  else if (e.key === 'ArrowLeft') showLightboxItem(lbIndex - 1);
});

// Touch & mouse swipe navigation inside the lightbox
let swipeStartX = null, swipeStartY = null;
function startSwipe(x, y, target) {
  if (target.closest('button')) return;
  swipeStartX = x;
  swipeStartY = y;
}
function endSwipe(x, y) {
  if (swipeStartX === null) return;
  const dx = x - swipeStartX, dy = y - swipeStartY;
  swipeStartX = swipeStartY = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    showLightboxItem(dx < 0 ? lbIndex + 1 : lbIndex - 1);
  }
}
lb.addEventListener('touchstart', e => {
  if (e.touches.length === 1) startSwipe(e.touches[0].clientX, e.touches[0].clientY, e.target);
}, { passive: true });
lb.addEventListener('touchend', e => {
  if (e.changedTouches.length === 1) endSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
}, { passive: true });
lb.addEventListener('mousedown', e => {
  if (e.button === 0 && !e.target.closest('video')) startSwipe(e.clientX, e.clientY, e.target);
});
lb.addEventListener('mouseup', e => endSwipe(e.clientX, e.clientY));

$('#cf').onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), n = $('#cmsg');
  if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || !f.msg.trim()) {
    n.textContent = 'Please fill in your name, a valid email, and a message.';
    return;
  }
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f)
    });
    if (!r.ok) throw 0;
    n.textContent = 'Thank you! Your message was sent to UC-IRPA. We will get back to you soon.';
    e.target.reset();
  } catch {
    const fallbackEmail = SITE.email || 'rso@uc-bcf.edu.ph';
    location.href = 'mailto:' + fallbackEmail + '?subject=' + encodeURIComponent(f.subject) + '&body=' + encodeURIComponent(f.msg + '\n\n' + f.name + ' (' + f.email + ')');
    n.textContent = 'We could not send it from the page, so your email app is opening instead.';
  }
};

const preSubject = new URLSearchParams(location.search).get('subject');
if (preSubject) {
  const select = $('#cf select[name="subject"]');
  if (select && [...select.options].some(o => o.value === preSubject)) {
    select.value = preSubject;
  }
}

render();
Promise.all([
  load('/api/projects', null),
  load('/api/news', null),
  load('data/services.json', []),
  load('/api/partners', []),
  load('data/gallery.json', []),
  load('data/site.json', {})
]).then(([p, n, sv, pa, ga, si]) => {
  projects = p || [];
  news = n || [];
  SVC = sv;
  PART = pa;
  GAL = ga;
  applySite(si);
  render();
  if (p === null || n === null) {
    $('#newsList').innerHTML = '<p class="note">News and projects could not be loaded. The website server may not be running.</p>';
  }
});
