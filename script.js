// ---------- Mobile nav ----------
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ---------- Dashboard tabs ----------
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(t => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
  tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length]);
    if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
  });
});

// ---------- Live standings demo ----------
const START = [
  { name: 'Northside', p: 6, w: 6, d: 0, l: 0, gf: 14, ga: 3 },
  { name: 'Riverside', p: 6, w: 5, d: 0, l: 1, gf: 11, ga: 5 },
  { name: 'United',    p: 6, w: 4, d: 0, l: 2, gf: 9,  ga: 8 },
  { name: 'City',      p: 6, w: 3, d: 0, l: 3, gf: 7,  ga: 9 }
];
let teams = structuredClone(START);

const body = document.getElementById('standings-body');
const home = document.getElementById('home');
const away = document.getElementById('away');
const hg = document.getElementById('home-goals');
const ag = document.getElementById('away-goals');
const err = document.getElementById('form-error');
const feed = document.getElementById('feed');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const pts = t => t.w * 3 + t.d;
const gd = t => t.gf - t.ga;
const sorted = () => [...teams].sort((a, b) => pts(b) - pts(a) || gd(b) - gd(a) || b.gf - a.gf || a.name.localeCompare(b.name));

function fillSelects() {
  const options = teams.map(t => `<option>${t.name}</option>`).join('');
  home.innerHTML = options;
  away.innerHTML = options;
  home.value = 'City';
  away.value = 'Northside';
}

function render(flashName) {
  // FLIP: remember old row positions so rows can glide to new ones
  const before = {};
  body.querySelectorAll('tr').forEach(r => before[r.dataset.team] = r.getBoundingClientRect().top);

  body.innerHTML = sorted().map((t, i) => `
    <tr data-team="${t.name}" class="${i === 0 ? 'leader' : ''} ${t.name === flashName ? 'flash' : ''}">
      <td>${i + 1}</td><td>${t.name}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
      <td>${gd(t) > 0 ? '+' : ''}${gd(t)}</td><td>${pts(t)}</td>
    </tr>`).join('');

  if (reduceMotion) return;
  body.querySelectorAll('tr').forEach(r => {
    const old = before[r.dataset.team];
    if (old === undefined) return;
    const dy = old - r.getBoundingClientRect().top;
    if (!dy) return;
    r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.3,.7,.2,1)' });
  });
}

function addFeed(lines) {
  feed.querySelector('.feed-empty')?.remove();
  lines.reverse().forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    feed.prepend(li);
  });
  while (feed.children.length > 6) feed.lastElementChild.remove();
}

document.getElementById('result-form').addEventListener('submit', e => {
  e.preventDefault();
  const h = home.value, a = away.value;
  const x = parseInt(hg.value, 10), y = parseInt(ag.value, 10);

  if (h === a) return showError('Pick two different teams.');
  if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || y < 0) return showError('Enter a goal count of 0 or more for both teams.');
  err.hidden = true;

  const H = teams.find(t => t.name === h);
  const A = teams.find(t => t.name === a);
  H.p++; A.p++;
  H.gf += x; H.ga += y; A.gf += y; A.ga += x;
  if (x > y) { H.w++; A.l++; }
  else if (x < y) { A.w++; H.l++; }
  else { H.d++; A.d++; }

  const leaderBefore = document.querySelector('#standings-body tr')?.dataset.team;
  render(x === y ? null : (x > y ? h : a));
  const leaderAfter = body.querySelector('tr').dataset.team;

  const lines = [
    `Result recorded: ${h} ${x}–${y} ${a}`,
    'Standings, goal difference and team statistics updated',
    `Fan update ready: ${h} ${x}–${y} ${a}`,
    'Match report sent to administrators and officials'
  ];
  if (leaderAfter !== leaderBefore) lines.splice(2, 0, `${leaderAfter} move to the top of the table`);
  addFeed(lines);
});

function showError(msg) {
  err.textContent = msg;
  err.hidden = false;
}

document.getElementById('reset').addEventListener('click', () => {
  teams = structuredClone(START);
  err.hidden = true;
  feed.innerHTML = '<li class="feed-empty">Submit a result to see the updates it triggers.</li>';
  render();
});

fillSelects();
render();