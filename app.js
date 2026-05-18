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
// coin display is set by the Firestore settings listener below

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

/* ===== COIN BALANCE ===== */
let coinBalance = 0;
let userSettings = {};

db.collection('settings').doc('user').onSnapshot(snap => {
  if (snap.exists) {
    userSettings = snap.data();
    coinBalance = userSettings.coins ?? 0;
  } else {
    userSettings = {};
    coinBalance = 0;
    db.collection('settings').doc('user').set({ coins: 0 });
  }
  setCoinDisplay(coinBalance);
  renderStats();
});

async function updateCoins(delta) {
  coinBalance += delta;
  setCoinDisplay(coinBalance);
  try {
    const update = { coins: coinBalance };
    if (delta > 0) update.coinsEarned = firebase.firestore.FieldValue.increment(delta);
    await db.collection('settings').doc('user').set(update, { merge: true });
  } catch (e) {
    console.error('updateCoins error:', e);
  }
}

/* ===== FILTERS & SMART SORT ===== */
let allTaskDocs   = [];
let currentFilter = 'tutte';
let pendingComplete = null;

const emptyMessages = {
  tutte:  { icon: '⚔️', text: 'Nessuna quest attiva.<br>Premi + per aggiungerne una.' },
  oggi:   { icon: '🎉', text: 'Nessuna task in scadenza oggi!<br>Goditela!' },
  domani: { icon: '🎉', text: 'Nessuna task in scadenza domani!' }
};

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function smartSort(docs) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(tomorrow); dayAfter.setDate(tomorrow.getDate() + 1);

  const active = docs.filter(d => d.data().stato === 'attiva');
  const failed = docs.filter(d => d.data().stato === 'fallita');

  const gr1 = active.filter(d => isSameDay(d.data().scadenza.toDate(), today));
  const gr2 = active.filter(d => isSameDay(d.data().scadenza.toDate(), tomorrow));
  const gr3 = active.filter(d => {
    const s = d.data().scadenza.toDate(); s.setHours(0,0,0,0);
    return s >= dayAfter;
  });

  gr1.sort((a,b) => b.data().reward - a.data().reward);
  gr2.sort((a,b) => b.data().reward - a.data().reward);
  gr3.sort((a,b) => a.data().scadenza.toDate() - b.data().scadenza.toDate());
  failed.sort((a,b) => b.data().scadenza.toDate() - a.data().scadenza.toDate());

  return [...gr1, ...gr2, ...gr3, ...failed];
}

function getFilteredDocs() {
  const skipId = pendingComplete?.docId;
  const docs   = skipId ? allTaskDocs.filter(d => d.id !== skipId) : allTaskDocs;

  if (currentFilter === 'tutte') return smartSort(docs);

  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const ref = currentFilter === 'oggi' ? today : tomorrow;

  return docs
    .filter(d => d.data().stato === 'attiva' && isSameDay(d.data().scadenza.toDate(), ref))
    .sort((a,b) => b.data().reward - a.data().reward);
}

function applyFilter() {
  renderTasks(getFilteredDocs());
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    applyFilter();
  });
});

function renderTasks(docs) {
  const list      = document.getElementById('task-list');
  const empty     = document.getElementById('empty-state');
  const emptyIcon = document.getElementById('empty-icon');
  const emptyMsg  = document.getElementById('empty-msg');
  list.innerHTML  = '';

  if (docs.length === 0) {
    const m = emptyMessages[currentFilter];
    emptyIcon.textContent = m.icon;
    emptyMsg.innerHTML    = m.text;
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  docs.forEach(doc => {
    const t      = doc.data();
    const failed = t.stato === 'fallita';
    const card   = document.createElement('div');
    card.className  = 'task-card' + (failed ? ' task-card-failed' : '');
    card.dataset.id = doc.id;
    card.innerHTML  = `
      <div class="task-card-top">
        <span class="task-name">${escapeHtml(t.nome)}</span>
        <span class="priority-dot priority-${t.priorita}"></span>
      </div>
      ${t.descrizione ? `<p class="task-desc">${escapeHtml(t.descrizione)}</p>` : ''}
      <div class="task-card-bottom">
        <span class="task-date">${failed ? '⚠️' : '📅'} ${formatDateIT(t.scadenza)}</span>
        <div class="task-pills">
          ${!failed ? `<span class="pill pill-green">💰 +${t.reward}</span>` : ''}
          <span class="pill pill-red">💀 -${t.penalita}</span>
        </div>
        <button class="btn-complete${failed ? ' btn-complete-late' : ''}" data-id="${doc.id}">✓</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = allTaskDocs.find(d => d.id === btn.dataset.id);
      if (doc) completeTask(btn.dataset.id, doc.data(), btn);
    });
  });
}

/* ===== COIN ANIMATION ===== */
function showCoinAnimation(reward, anchorEl) {
  const anim = document.createElement('div');
  anim.className   = 'coin-float';
  anim.textContent = `+${reward} 💰`;
  const rect = anchorEl.getBoundingClientRect();
  anim.style.left  = (rect.left + rect.width / 2) + 'px';
  anim.style.top   = rect.top + 'px';
  document.body.appendChild(anim);
  setTimeout(() => anim.remove(), 1200);
}

/* ===== UNDO TOAST ===== */
let undoTimeout = null;

function showUndoToast(onUndo, onCommit) {
  const toast = document.getElementById('undo-toast');
  const bar   = document.getElementById('toast-progress-bar');
  let undoBtn = document.getElementById('toast-undo-btn');

  bar.style.transition = 'none';
  bar.style.width = '100%';
  toast.classList.remove('hidden');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = 'width 10s linear';
    bar.style.width = '0%';
  }));

  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(async () => {
    toast.classList.add('hidden');
    await onCommit();
  }, 10000);

  const fresh = undoBtn.cloneNode(true);
  undoBtn.parentNode.replaceChild(fresh, undoBtn);
  fresh.addEventListener('click', async () => {
    clearTimeout(undoTimeout);
    toast.classList.add('hidden');
    await onUndo();
  });
}

function dismissToast() {
  if (undoTimeout) clearTimeout(undoTimeout);
  document.getElementById('undo-toast').classList.add('hidden');
}

/* ===== COMPLETE TASK ===== */
async function completeTask(docId, taskData, anchorEl) {
  if (pendingComplete) {
    dismissToast();
    await commitPendingComplete();
  }

  if (taskData.stato === 'fallita') {
    showLateCompleteModal(docId, taskData);
    return;
  }

  const coinDelta = taskData.reward;
  showCoinAnimation(coinDelta, anchorEl);
  if (navigator.vibrate) navigator.vibrate(100);
  await updateCoins(coinDelta);

  pendingComplete = { docId, taskData, coinDelta };
  applyFilter();

  showUndoToast(
    async () => {
      await updateCoins(-coinDelta);
      pendingComplete = null;
      applyFilter();
    },
    async () => { await commitPendingComplete(); }
  );
}

async function commitPendingComplete() {
  if (!pendingComplete) return;
  const { docId, coinDelta } = pendingComplete;
  pendingComplete = null;
  try {
    await db.collection('tasks').doc(docId).update({
      stato:           'completata',
      coinAccreditati: coinDelta > 0,
      completedAt:     firebase.firestore.FieldValue.serverTimestamp()
    });
    if (coinDelta > 0) {
      await db.collection('settings').doc('user').set(
        { consecutiveCompleted: firebase.firestore.FieldValue.increment(1) },
        { merge: true }
      );
    }
  } catch (e) {
    console.error('commitPendingComplete error:', e);
  }
}

/* ===== LATE COMPLETE MODAL ===== */
function showLateCompleteModal(docId, taskData) {
  const overlay = document.getElementById('late-modal-overlay');
  const panel   = document.getElementById('late-modal-panel');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const closeLate = () => {
    panel.classList.remove('open');
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  };

  document.getElementById('btn-late-yes').onclick = async () => {
    closeLate();
    const gain = taskData.reward + taskData.penalita;
    await updateCoins(gain);
    if (navigator.vibrate) navigator.vibrate(100);
    await db.collection('tasks').doc(docId).update({
      stato: 'completata', coinAccreditati: true,
      completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  document.getElementById('btn-late-no').onclick = async () => {
    closeLate();
    await db.collection('tasks').doc(docId).update({
      stato: 'completata', coinAccreditati: false,
      completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  document.getElementById('btn-late-modal-close').onclick = closeLate;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLate(); }, { once: true });
}

/* ===== EXPIRY CHECK ===== */
let expiryInProgress = false;

async function checkExpiredTasks() {
  if (expiryInProgress) return;
  expiryInProgress = true;
  try {
    const today   = new Date(); today.setHours(0,0,0,0);
    const expired = allTaskDocs.filter(d => {
      const t = d.data();
      if (t.stato !== 'attiva') return false;
      const s = t.scadenza.toDate(); s.setHours(0,0,0,0);
      return s < today;
    });
    if (!expired.length) return;

    const batch   = db.batch();
    let   penalty = 0;
    expired.forEach(doc => {
      batch.update(doc.ref, { stato: 'fallita' });
      penalty += doc.data().penalita;
    });
    await batch.commit();
    await db.collection('settings').doc('user').set({ consecutiveCompleted: 0 }, { merge: true });
    if (penalty > 0) await updateCoins(-penalty);
  } finally {
    expiryInProgress = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkExpiredTasks();
});

/* ===== FIRESTORE LISTENER ===== */
db.collection('tasks')
  .where('stato', 'in', ['attiva', 'fallita'])
  .onSnapshot(snapshot => {
    allTaskDocs = snapshot.docs;
    checkExpiredTasks();
    applyFilter();
  }, err => {
    console.error('Firestore listener error:', err);
  });

/* ===== RESET ===== */
document.getElementById('btn-reset').addEventListener('click', () => {
  const overlay = document.getElementById('reset-modal-overlay');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => document.getElementById('reset-modal-panel').classList.add('open'));
  document.body.style.overflow = 'hidden';
});

const closeResetModal = () => {
  document.getElementById('reset-modal-panel').classList.remove('open');
  setTimeout(() => {
    document.getElementById('reset-modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
};

document.getElementById('btn-reset-cancel').addEventListener('click', closeResetModal);
document.getElementById('reset-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('reset-modal-overlay')) closeResetModal();
});

document.getElementById('btn-reset-confirm').addEventListener('click', async () => {
  const btn = document.getElementById('btn-reset-confirm');
  btn.disabled    = true;
  btn.textContent = '⏳ Reset…';
  try {
    const snap  = await db.collection('tasks').get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    await db.collection('settings').doc('user').set({
      coins: 0, coinsEarned: 0,
      totalOpenings: 0, dailyOpenings: 0,
      streak: 0, maxStreak: 0,
      lastOpenDate: null, activeDays: [],
      unlockedBadges: [], consecutiveCompleted: 0
    });
  } catch (e) {
    console.error('Reset error:', e);
  }
  window.location.reload();
});

/* ===== SETTINGS DATETIME ===== */
const GIORNI_IT = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MESI_IT   = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio',
                   'agosto','settembre','ottobre','novembre','dicembre'];

function updateDatetime() {
  const elDate = document.getElementById('datetime-display');
  const elTz   = document.getElementById('timezone-display');
  if (!elDate) return;
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const ss  = String(now.getSeconds()).padStart(2,'0');
  elDate.textContent = `${GIORNI_IT[now.getDay()]} ${now.getDate()} ${MESI_IT[now.getMonth()]} ${now.getFullYear()} — ${hh}:${mm}:${ss}`;
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -now.getTimezoneOffset();
  const sign   = offset >= 0 ? '+' : '-';
  const oh     = Math.floor(Math.abs(offset) / 60);
  const om     = Math.abs(offset) % 60;
  elTz.textContent = `${tzName} UTC${sign}${oh}${om ? ':' + String(om).padStart(2,'0') : ''}`;
}

setInterval(updateDatetime, 1000);
updateDatetime();

/* ===== CHANGELOG MODAL ===== */
document.getElementById('btn-changelog').addEventListener('click', () => {
  const overlay = document.getElementById('changelog-overlay');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => document.getElementById('changelog-panel').classList.add('open'));
  document.body.style.overflow = 'hidden';
});

const closeChangelog = () => {
  document.getElementById('changelog-panel').classList.remove('open');
  setTimeout(() => {
    document.getElementById('changelog-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
};

document.getElementById('btn-changelog-close').addEventListener('click', closeChangelog);
document.getElementById('changelog-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('changelog-overlay')) closeChangelog();
});

/* ===== STORICO ===== */
let storicoDocs   = [];
let storicoFilter = 'tutte';

function renderStorico() {
  const list    = document.getElementById('storico-list');
  const empty   = document.getElementById('storico-empty');
  const earnEl  = document.getElementById('storico-earned');
  const lostEl  = document.getElementById('storico-lost');
  if (!list) return;

  // Counters (always over all docs, ignoring current tab)
  const totalEarned = storicoDocs
    .filter(d => d.data().stato === 'completata')
    .reduce((s, d) => s + (d.data().reward || 0), 0);
  const totalLost = storicoDocs
    .filter(d => d.data().stato === 'fallita')
    .reduce((s, d) => s + (d.data().penalita || 0), 0);
  earnEl.textContent = `${totalEarned} coin`;
  lostEl.textContent = `${totalLost} coin`;

  // Apply tab filter
  let filtered = [...storicoDocs];
  if (storicoFilter === 'completate') filtered = filtered.filter(d => d.data().stato === 'completata');
  if (storicoFilter === 'fallite')    filtered = filtered.filter(d => d.data().stato === 'fallita');

  // Sort: most recent first (completedAt, fallback to scadenza)
  filtered.sort((a, b) => {
    const ts = d => ((d.data().completedAt || d.data().scadenza).toDate()).getTime();
    return ts(b) - ts(a);
  });

  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(doc => {
    const t         = doc.data();
    const completed = t.stato === 'completata';
    const dateRef   = t.completedAt || t.scadenza;
    const card      = document.createElement('div');
    card.className  = `history-card ${completed ? 'history-card-ok' : 'history-card-fail'}`;
    card.innerHTML  = `
      <div class="history-card-top">
        <span class="task-name">${escapeHtml(t.nome)}</span>
        <span class="priority-dot priority-${t.priorita}"></span>
      </div>
      <div class="history-card-bottom">
        <span class="task-date">📅 ${formatDateIT(dateRef)}</span>
        <span class="pill ${completed ? 'pill-green' : 'pill-red'}">
          ${completed ? `💰 +${t.reward}` : `💀 -${t.penalita}`}
        </span>
        <button class="btn-delete-history" data-id="${doc.id}" title="Elimina voce">🗑️</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.btn-delete-history').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await db.collection('tasks').doc(btn.dataset.id).delete();
        showInfoToast('Voce eliminata');
      } catch (e) {
        console.error('Delete history error:', e);
      }
    });
  });
}

document.querySelectorAll('[data-storico-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('[data-storico-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    storicoFilter = chip.dataset.storicoFilter;
    renderStorico();
  });
});

db.collection('tasks')
  .where('stato', 'in', ['completata', 'fallita'])
  .onSnapshot(snapshot => {
    storicoDocs = snapshot.docs;
    renderStorico();
    renderStats();
  }, err => {
    console.error('Storico listener error:', err);
  });

/* ===== INFO TOAST ===== */
let infoToastTimeout = null;

function showInfoToast(msg) {
  const toast = document.getElementById('info-toast');
  document.getElementById('info-toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  if (infoToastTimeout) clearTimeout(infoToastTimeout);
  infoToastTimeout = setTimeout(() => toast.classList.add('hidden'), 2500);
}

/* ===== CHECK UPDATES ===== */
document.getElementById('btn-update-check').addEventListener('click', async () => {
  const label = document.querySelector('#btn-update-check .settings-row-label');
  label.textContent = '🔄 Pulizia cache…';
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
    }
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  } catch (e) {
    console.error('Update check error:', e);
  }
  window.location.reload(true);
});

/* ===== SERVICE WORKER ===== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/todo-gamification/sw.js')
      .catch(err => console.warn('SW non registrato (funziona solo su HTTPS o localhost):', err));
  });
}

/* ===== RECORD OPENING ===== */
async function recordOpening() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  try {
    const snap = await db.collection('settings').doc('user').get();
    const data = snap.exists ? snap.data() : {};

    const lastOpenDate  = data.lastOpenDate ?? null;
    const streak        = data.streak ?? 0;
    const maxStreak     = data.maxStreak ?? 0;
    const totalOpenings = (data.totalOpenings ?? 0) + 1;

    if (lastOpenDate === todayStr) {
      await db.collection('settings').doc('user').set(
        { totalOpenings, dailyOpenings: firebase.firestore.FieldValue.increment(1) },
        { merge: true }
      );
      return;
    }

    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const newStreak    = lastOpenDate === yesterdayStr ? streak + 1 : 1;
    const newMaxStreak = Math.max(newStreak, maxStreak);

    let activeDays = [...(data.activeDays ?? [])];
    if (!activeDays.includes(todayStr)) activeDays.push(todayStr);
    const cutoff = new Date(today); cutoff.setDate(today.getDate() - 89);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    activeDays = activeDays.filter(d => d >= cutoffStr);

    await db.collection('settings').doc('user').set({
      totalOpenings, dailyOpenings: 1,
      streak: newStreak, maxStreak: newMaxStreak,
      lastOpenDate: todayStr, activeDays
    }, { merge: true });
  } catch (e) {
    console.error('recordOpening error:', e);
  }
}

recordOpening();

/* ===== LEVELS & BADGES ===== */
const LEVELS = [
  { level: 1,  name: 'Novizio',          min: 0    },
  { level: 2,  name: 'Apprendista',      min: 25   },
  { level: 3,  name: 'Avventuriero',     min: 75   },
  { level: 4,  name: 'Guerriero',        min: 150  },
  { level: 5,  name: 'Campione',         min: 300  },
  { level: 6,  name: 'Maestro',          min: 500  },
  { level: 7,  name: 'Leggenda',         min: 800  },
  { level: 8,  name: 'Mito',             min: 1200 },
  { level: 9,  name: 'Immortale',        min: 1800 },
  { level: 10, name: 'Dio delle Quest',  min: 2500 }
];

const BADGES = [
  { id: 'first_task', icon: '⚔️', name: 'Prima Quest',       desc: 'Completa la tua prima task' },
  { id: 'streak_3',   icon: '🔥', name: 'In Fiamme',         desc: '3 giorni di streak' },
  { id: 'streak_7',   icon: '🌟', name: 'Settimana Perfetta', desc: '7 giorni di streak' },
  { id: 'streak_30',  icon: '👑', name: 'Dominatore',        desc: '30 giorni di streak' },
  { id: 'coins_50',   icon: '💰', name: 'Primo Tesoro',      desc: 'Guadagna 50 coin totali' },
  { id: 'coins_200',  icon: '💎', name: 'Ricco Sfondato',    desc: 'Guadagna 200 coin totali' },
  { id: 'coins_500',  icon: '🏦', name: 'Banchiere',         desc: 'Guadagna 500 coin totali' },
  { id: 'tasks_10',   icon: '📜', name: 'Veterano',          desc: 'Completa 10 task in tempo' },
  { id: 'tasks_50',   icon: '🗡️', name: 'Gladiatore',        desc: 'Completa 50 task in tempo' },
  { id: 'no_fail',    icon: '🛡️', name: 'Senza Macchia',     desc: 'Completa 5 task di fila senza fallirne nessuna' },
  { id: 'level_5',    icon: '⭐', name: 'Metà Strada',       desc: 'Raggiungi il livello 5' },
  { id: 'level_10',   icon: '🔱', name: 'Asceso',            desc: 'Raggiungi il livello 10' },
];

const shownBadges = new Set();

/* ===== RENDER STATS ===== */
function renderStats() {
  if (!document.getElementById('stat-level-num')) return;

  const s             = userSettings;
  const completedDocs = storicoDocs.filter(d => d.data().stato === 'completata');
  const failedDocs    = storicoDocs.filter(d => d.data().stato === 'fallita');

  const coinsEarned = s.coinsEarned ?? 0;
  const streak      = s.streak ?? 0;
  const maxStreak   = s.maxStreak ?? 0;
  const totalOpen   = s.totalOpenings ?? 0;
  const activeDays  = s.activeDays ?? [];

  // Level
  let lvl = LEVELS[0], nextLvl = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (coinsEarned >= LEVELS[i].min) { lvl = LEVELS[i]; nextLvl = LEVELS[i + 1] || null; break; }
  }
  document.getElementById('stat-level-num').textContent  = lvl.level;
  document.getElementById('stat-level-name').textContent = lvl.name;
  if (nextLvl) {
    const pct = Math.round(((coinsEarned - lvl.min) / (nextLvl.min - lvl.min)) * 100);
    document.getElementById('stat-level-xp').textContent  = `${coinsEarned} / ${nextLvl.min} coin`;
    document.getElementById('stat-level-bar').style.width = Math.min(pct, 100) + '%';
  } else {
    document.getElementById('stat-level-xp').textContent  = `${coinsEarned} coin — Livello massimo!`;
    document.getElementById('stat-level-bar').style.width = '100%';
  }

  // Streak / activity
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-streak',      streak);
  setEl('stat-max-streak',  maxStreak);
  setEl('stat-openings',    totalOpen);
  setEl('stat-active-days', activeDays.length);

  // Task stats
  const total = completedDocs.length + failedDocs.length;
  setEl('stat-completed', completedDocs.length);
  setEl('stat-failed',    failedDocs.length);
  setEl('stat-total',     total);
  setEl('stat-rate',      total > 0 ? Math.round((completedDocs.length / total) * 100) + '%' : '—');

  // Weekly stats (Mon–Sun of current week)
  const monday = new Date(); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDocs  = completedDocs.filter(d => {
    const ref = d.data().completedAt || d.data().scadenza;
    return ref.toDate() >= monday;
  });
  const weekCoins = weekDocs.reduce((sum, d) => sum + (d.data().reward || 0), 0);
  setEl('stat-week-completed', weekDocs.length);
  setEl('stat-week-coins',     weekCoins);

  renderCoinChart(completedDocs);
  renderHeatmap(completedDocs);
  renderBadges(s, completedDocs, lvl.level);
}

function renderCoinChart(completedDocs) {
  const el = document.getElementById('coin-chart');
  if (!el) return;

  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const labels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const data = [];
  for (let i = 6; i >= 0; i--) {
    const day     = new Date(today); day.setDate(today.getDate() - i);
    const nextDay = new Date(day);   nextDay.setDate(day.getDate() + 1);
    const coins   = completedDocs
      .filter(doc => { const t = (doc.data().completedAt || doc.data().scadenza).toDate(); return t >= day && t < nextDay; })
      .reduce((s, doc) => s + (doc.data().reward || 0), 0);
    data.push({ day, coins });
  }

  const maxCoins = Math.max(...data.map(d => d.coins), 1);

  el.innerHTML = data.map(d => {
    const pct      = Math.round((d.coins / maxCoins) * 100);
    const dayLabel = labels[(d.day.getDay() + 6) % 7];
    const isToday  = d.day.toDateString() === today.toDateString();
    return `
      <div class="coin-bar-col">
        <span class="coin-bar-val">${d.coins > 0 ? d.coins : ''}</span>
        <div class="coin-bar-wrap">
          <div class="coin-bar${isToday ? ' coin-bar-today' : ''}" style="height:${pct}%"></div>
        </div>
        <span class="coin-bar-label${isToday ? ' coin-bar-label-today' : ''}">${dayLabel}</span>
      </div>`;
  }).join('');
}

function renderHeatmap(completedDocs) {
  const el = document.getElementById('heatmap-grid');
  if (!el) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const countMap = {};
  completedDocs.forEach(doc => {
    const d = (doc.data().completedAt || doc.data().scadenza).toDate();
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    countMap[key] = (countMap[key] || 0) + 1;
  });

  const start = new Date(today); start.setDate(today.getDate() - 89);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // align to Monday

  const cells = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key   = cursor.toISOString().slice(0, 10);
    cells.push({ key, count: countMap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxCount = Math.max(...cells.map(c => c.count), 1);
  el.innerHTML = cells.map(c => {
    const intensity = c.count > 0 ? Math.ceil((c.count / maxCount) * 4) : 0;
    return `<div class="heatmap-cell heatmap-${intensity}" title="${c.key}: ${c.count} task"></div>`;
  }).join('');
}

function renderBadges(s, completedDocs, level) {
  const el = document.getElementById('badges-grid');
  if (!el) return;

  const unlockedBadges        = s.unlockedBadges ?? [];
  const streak                = s.streak ?? 0;
  const coinsEarned           = s.coinsEarned ?? 0;
  const consecutiveCompleted  = s.consecutiveCompleted ?? 0;
  const completed             = completedDocs.length;

  const checks = {
    first_task: completed >= 1,
    streak_3:   streak >= 3,
    streak_7:   streak >= 7,
    streak_30:  streak >= 30,
    coins_50:   coinsEarned >= 50,
    coins_200:  coinsEarned >= 200,
    coins_500:  coinsEarned >= 500,
    tasks_10:   completed >= 10,
    tasks_50:   completed >= 50,
    no_fail:    consecutiveCompleted >= 5,
    level_5:    level >= 5,
    level_10:   level >= 10,
  };

  const newlyUnlocked = BADGES.filter(b => checks[b.id] && !unlockedBadges.includes(b.id));

  if (newlyUnlocked.length > 0) {
    const allUnlocked = [...unlockedBadges, ...newlyUnlocked.map(b => b.id)];
    db.collection('settings').doc('user').set({ unlockedBadges: allUnlocked }, { merge: true });
    newlyUnlocked.forEach(b => {
      if (!shownBadges.has(b.id)) {
        shownBadges.add(b.id);
        setTimeout(() => showBadgeModal(b), 600);
      }
    });
  }

  const allUnlocked = [...unlockedBadges, ...newlyUnlocked.map(b => b.id)];
  el.innerHTML = BADGES.map(b => {
    const unlocked = allUnlocked.includes(b.id);
    return `
      <div class="badge-item${unlocked ? '' : ' badge-item-locked'}" title="${b.desc}">
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-name">${b.name}</span>
      </div>`;
  }).join('');
}

function showBadgeModal(badge) {
  const overlay = document.getElementById('badge-modal-overlay');
  const panel   = document.getElementById('badge-modal-panel');
  document.getElementById('badge-modal-icon').textContent = badge.icon;
  document.getElementById('badge-modal-name').textContent = badge.name;
  document.getElementById('badge-modal-desc').textContent = badge.desc;
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const close = () => {
    panel.classList.remove('open');
    setTimeout(() => { overlay.classList.add('hidden'); document.body.style.overflow = ''; }, 300);
  };
  document.getElementById('btn-badge-modal-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); }, { once: true });
}
