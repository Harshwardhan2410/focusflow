const $ = s => document.querySelector(s);
const today = () => new Date().toDateString();
const DEFAULTS = {
  focusMin: 25, breakMin: 5, mode: 'focus', running: false,
  endTime: null, remaining: 25 * 60000, sessions: 0, day: today(), tasks: []
};
let S;

async function load() {
  const stored = await chrome.storage.local.get(null);
  const st = { ...DEFAULTS, ...stored };
  if (st.day !== today()) { st.day = today(); st.sessions = 0; }
  return st;
}
const save = () => chrome.storage.local.set(S);
const duration = mode => (mode === 'focus' ? S.focusMin : S.breakMin) * 60000;

function fmt(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

function render() {
  const left = S.running ? S.endTime - Date.now() : S.remaining;
  const total = duration(S.mode);
  $('#time').textContent = fmt(left);
  $('#mode').textContent = S.mode === 'focus' ? 'Focus' : 'Break';
  $('#bar').style.width = Math.min(100, Math.max(0, (1 - left / total) * 100)) + '%';
  $('#startBtn').textContent = S.running ? 'Pause' : 'Start';
  $('#sessions').textContent = S.sessions;
  $('#focusMin').value = S.focusMin;
  $('#breakMin').value = S.breakMin;
  document.body.classList.toggle('break', S.mode === 'break');
  document.title = S.running ? fmt(left) + ' – FocusFlow' : 'FocusFlow';
}

function renderTasks() {
  const list = $('#list');
  list.innerHTML = '';
  S.tasks.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.done) li.className = 'done';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = t.done;
    cb.onchange = () => { S.tasks[i].done = cb.checked; save(); renderTasks(); };
    const span = document.createElement('span');
    span.textContent = t.text;   // textContent prevents HTML injection
    const del = document.createElement('button');
    del.className = 'del'; del.textContent = '✕'; del.title = 'Delete';
    del.onclick = () => { S.tasks.splice(i, 1); save(); renderTasks(); };
    li.append(cb, span, del);
    list.append(li);
  });
  $('#empty').style.display = S.tasks.length ? 'none' : 'block';
}

async function toggleTimer() {
  if (S.running) {
    S.remaining = Math.max(0, S.endTime - Date.now());
    S.running = false; S.endTime = null;
    await chrome.alarms.clear('pomodoro');
    chrome.action.setBadgeText({ text: '' });
  } else {
    S.endTime = Date.now() + S.remaining;
    S.running = true;
    await chrome.alarms.create('pomodoro', { when: S.endTime });
    chrome.action.setBadgeBackgroundColor({ color: S.mode === 'focus' ? '#8b85ff' : '#22c55e' });
    chrome.action.setBadgeText({ text: '●' });
  }
  await save(); render();
}

async function resetTimer(mode = S.mode) {
  await chrome.alarms.clear('pomodoro');
  chrome.action.setBadgeText({ text: '' });
  S.mode = mode; S.running = false; S.endTime = null; S.remaining = duration(mode);
  await save(); render();
}

function addTask() {
  const text = $('#taskInput').value.trim();
  if (!text) return;
  S.tasks.push({ text, done: false });
  $('#taskInput').value = '';
  save(); renderTasks();
}

function setDuration(key, el) {
  const v = Math.min(120, Math.max(1, parseInt(el.value, 10) || DEFAULTS[key]));
  S[key] = v;
  if (!S.running) S.remaining = duration(S.mode);
  save(); render();
}

(async function init() {
  S = await load();
  render(); renderTasks();
  $('#startBtn').onclick = toggleTimer;
  $('#resetBtn').onclick = () => resetTimer();
  $('#switchBtn').onclick = () => resetTimer(S.mode === 'focus' ? 'break' : 'focus');
  $('#addBtn').onclick = addTask;
  $('#taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  $('#focusMin').onchange = e => setDuration('focusMin', e.target);
  $('#breakMin').onchange = e => setDuration('breakMin', e.target);
  setInterval(render, 500);
  // When the background worker finishes a session, refresh the popup.
  chrome.storage.onChanged.addListener(async () => { S = await load(); render(); renderTasks(); });
})();
