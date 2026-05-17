/* ===== NAVIGATION ===== */
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

function navigateTo(sectionName) {
  sections.forEach(s => s.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  const target = document.getElementById('section-' + sectionName);
  if (target) target.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
  if (navBtn) navBtn.classList.add('active');
}

navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.section));
});

/* ===== COIN DISPLAY ===== */
function setCoinDisplay(value) {
  document.getElementById('coin-count').textContent = value ?? '0';
}

/* ===== FIREBASE TEST ===== */
const btnTest = document.getElementById('btn-test-firebase');
const statusEl = document.getElementById('firebase-status');
const resultEl = document.getElementById('firebase-result');

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status-' + type;
}

async function runFirebaseTest() {
  btnTest.disabled = true;
  resultEl.classList.add('hidden');
  resultEl.textContent = '';
  setStatus('⏳ Scrittura documento di test su Firestore…', 'loading');

  try {
    // Scrivi documento di test
    const testRef = db.collection('_test').doc('connection');
    const payload = {
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      message:   'connessione ok',
      client:    navigator.userAgent.slice(0, 60)
    };
    await testRef.set(payload);
    setStatus('📤 Documento scritto. Lettura in corso…', 'loading');

    // Leggi documento appena scritto
    const snap = await testRef.get();
    if (snap.exists) {
      const data = snap.data();
      setStatus('✅ Firebase connesso correttamente!', 'ok');
      resultEl.textContent = JSON.stringify({
        id:        snap.id,
        message:   data.message,
        timestamp: data.timestamp?.toDate?.()?.toISOString() ?? '(server timestamp)'
      }, null, 2);
      resultEl.classList.remove('hidden');
    } else {
      setStatus('⚠️ Documento scritto ma non trovato in lettura.', 'error');
    }
  } catch (err) {
    setStatus('❌ Errore: ' + err.message, 'error');
    resultEl.textContent = err.stack ?? err.message;
    resultEl.classList.remove('hidden');
  } finally {
    btnTest.disabled = false;
  }
}

btnTest.addEventListener('click', runFirebaseTest);

/* ===== INIT ===== */
setCoinDisplay(0);

/* ===== FORM STATE ===== */
let calYear, calMonth, calSelected = null;
let formReward = null, formPenalty = null, formPriority = null;

/* ===== MODAL ===== */
const fabAdd       = document.getElementById('fab-add');
const modalOverlay = document.getElementById('modal-overlay');
const modalPanel   = document.getElementById('modal-panel');
const btnCancel    = document.getElementById('btn-cancel');
const btnCreate    = document.getElementById('btn-create');

function openModal() {
  resetForm();
  modalOverlay.classList.remove('hidden');
  requestAnimationFrame(() => modalPanel.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalPanel.classList.remove('open');
  setTimeout(() => {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

function resetForm() {
  document.getElementById('f-nome').value = '';
  document.getElementById('f-desc').value = '';
  calSelected = null;
  formReward = null;
  formPenalty = null;
  formPriority = null;

  const dateDisplay = document.getElementById('f-date-display');
  dateDisplay.textContent = '📅 Seleziona una data';
  dateDisplay.classList.remove('selected');

  document.getElementById('cal-widget').classList.add('hidden');
  document.querySelectorAll('.coin-sq').forEach(sq => sq.classList.remove('selected-green', 'selected-red'));
  document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('selected'));

  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();
  renderCalendar();
}

fabAdd.addEventListener('click', openModal);
btnCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

/* ===== CALENDAR ===== */
const MESI_LONG  = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                    'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MESI_SHORT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

function renderCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.getElementById('cal-month-label').textContent = `${MESI_LONG[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const offset = (firstDayOfWeek + 6) % 7; // Mon-first
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const btn  = document.createElement('button');
    btn.className   = 'cal-cell';
    btn.textContent = d;

    if (date < today) {
      btn.classList.add('disabled');
      btn.disabled = true;
    } else {
      if (calSelected && date.toDateString() === calSelected.toDateString()) {
        btn.classList.add('selected');
      }
      btn.addEventListener('click', () => selectDate(date));
    }
    if (date.toDateString() === today.toDateString()) btn.classList.add('today');
    grid.appendChild(btn);
  }

  const prevBtn = document.getElementById('cal-prev');
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();
  prevBtn.disabled = isCurrentMonth;
  prevBtn.style.opacity = isCurrentMonth ? '0.3' : '1';
}

function selectDate(date) {
  calSelected = date;
  const dd = document.getElementById('f-date-display');
  dd.textContent = `📅 ${date.getDate()} ${MESI_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  dd.classList.add('selected');
  document.getElementById('cal-widget').classList.add('hidden');
}

document.getElementById('f-date-display').addEventListener('click', () => {
  document.getElementById('cal-widget').classList.toggle('hidden');
});

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

/* ===== COIN SELECTORS ===== */
document.getElementById('sel-reward').querySelectorAll('.coin-sq').forEach(sq => {
  sq.addEventListener('click', () => {
    document.getElementById('sel-reward').querySelectorAll('.coin-sq').forEach(s => s.classList.remove('selected-green'));
    sq.classList.add('selected-green');
    formReward = parseInt(sq.dataset.val);
  });
});

document.getElementById('sel-penalty').querySelectorAll('.coin-sq').forEach(sq => {
  sq.addEventListener('click', () => {
    document.getElementById('sel-penalty').querySelectorAll('.coin-sq').forEach(s => s.classList.remove('selected-red'));
    sq.classList.add('selected-red');
    formPenalty = parseInt(sq.dataset.val);
  });
});

/* ===== PRIORITY SELECTOR ===== */
document.querySelectorAll('.priority-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    formPriority = btn.dataset.val;
  });
});

/* ===== CREATE TASK ===== */
btnCreate.addEventListener('click', async () => {
  const nome = document.getElementById('f-nome').value.trim();
  const desc = document.getElementById('f-desc').value.trim();

  if (!nome)         { showFormError('Inserisci il nome della task.'); return; }
  if (!calSelected)  { showFormError('Seleziona una data di scadenza.'); return; }
  if (!formReward)   { showFormError('Seleziona le coin di reward.'); return; }
  if (!formPenalty)  { showFormError('Seleziona le coin di penalità.'); return; }
  if (!formPriority) { showFormError('Seleziona la priorità.'); return; }

  btnCreate.disabled    = true;
  btnCreate.textContent = '⏳ Salvataggio…';

  try {
    await db.collection('tasks').add({
      nome,
      descrizione:     desc,
      scadenza:        firebase.firestore.Timestamp.fromDate(calSelected),
      reward:          formReward,
      penalita:        formPenalty,
      priorita:        formPriority,
      stato:           'attiva',
      coinAccreditati: false,
      createdAt:       firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
  } catch (err) {
    showFormError('Errore Firestore: ' + err.message);
  } finally {
    btnCreate.disabled    = false;
    btnCreate.textContent = 'Crea Task';
  }
});

function showFormError(msg) {
  alert(msg);
}

/* ===== TASK LIST ===== */
function formatDateIT(ts) {
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getDate()} ${MESI_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTasks(docs) {
  const list  = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';

  if (docs.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  docs.forEach(doc => {
    const t    = doc.data();
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-card-top">
        <span class="task-name">${escapeHtml(t.nome)}</span>
        <span class="priority-dot priority-${t.priorita}"></span>
      </div>
      ${t.descrizione ? `<p class="task-desc">${escapeHtml(t.descrizione)}</p>` : ''}
      <div class="task-card-bottom">
        <span class="task-date">📅 ${formatDateIT(t.scadenza)}</span>
        <div class="task-pills">
          <span class="pill pill-green">💰 +${t.reward}</span>
          <span class="pill pill-red">💀 -${t.penalita}</span>
        </div>
        <button class="btn-complete" data-id="${doc.id}" title="Completa task">✓</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', () => completeTask(btn.dataset.id));
  });
}

async function completeTask(id) {
  try {
    await db.collection('tasks').doc(id).update({ stato: 'completata' });
  } catch (err) {
    alert('Errore: ' + err.message);
  }
}

/* ===== FIRESTORE REAL-TIME LISTENER ===== */
db.collection('tasks')
  .where('stato', '==', 'attiva')
  .orderBy('scadenza', 'asc')
  .onSnapshot(snapshot => {
    renderTasks(snapshot.docs);
  }, err => {
    console.error('Firestore listener error:', err);
  });
