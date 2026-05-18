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
let prevCoinBalance = null;

function setCoinDisplay(value) {
  const numVal = value ?? 0;
  document.getElementById('coin-count').textContent = numVal;
  if (prevCoinBalance !== null && numVal !== prevCoinBalance) {
    const disp = document.querySelector('.coin-display');
    disp.classList.remove('coin-pulse-green', 'coin-pulse-red');
    void disp.offsetWidth;
    disp.classList.add(numVal > prevCoinBalance ? 'coin-pulse-green' : 'coin-pulse-red');
  }
  prevCoinBalance = numVal;
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
let formRicorrente = false, formRicorrenza = null;
let editDocId = null;

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
  formRicorrente = false;
  formRicorrenza = null;
  editDocId = null;

  const dateDisplay = document.getElementById('f-date-display');
  dateDisplay.textContent = '📅 Seleziona una data';
  dateDisplay.classList.remove('selected');

  document.getElementById('cal-widget').classList.add('hidden');
  document.querySelectorAll('.coin-sq').forEach(sq => sq.classList.remove('selected-green', 'selected-red'));
  document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('selected'));

  const toggle = document.getElementById('f-ricorrente-toggle');
  if (toggle) {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-checked', 'false');
  }
  const opts = document.getElementById('f-ricorrenza-options');
  if (opts) opts.classList.add('hidden');
  document.querySelectorAll('.ricorrenza-btn').forEach(b => b.classList.remove('selected'));

  document.getElementById('btn-create').textContent = 'Crea Task';
  document.querySelector('.modal-title').textContent = 'Nuova Quest';

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

  if (!nome)                              { showFormError('Inserisci il nome della task.'); return; }
  if (!calSelected)                       { showFormError('Seleziona una data di scadenza.'); return; }
  if (!formReward)                        { showFormError('Seleziona le coin di reward.'); return; }
  if (!formPenalty)                       { showFormError('Seleziona le coin di penalità.'); return; }
  if (!formPriority)                      { showFormError('Seleziona la priorità.'); return; }
  if (formRicorrente && !formRicorrenza)  { showFormError('Seleziona la frequenza di ricorrenza.'); return; }

  const isEdit = !!editDocId;
  btnCreate.disabled    = true;
  btnCreate.textContent = '⏳ Salvataggio…';

  const payload = {
    nome,
    descrizione:  desc,
    scadenza:     firebase.firestore.Timestamp.fromDate(calSelected),
    reward:       formReward,
    penalita:     formPenalty,
    priorita:     formPriority,
    ricorrente:   formRicorrente,
    ricorrenza:   formRicorrente ? formRicorrenza : null,
  };

  try {
    if (isEdit) {
      await db.collection('tasks').doc(editDocId).update(payload);
    } else {
      await db.collection('tasks').add({
        ...payload,
        stato:           'attiva',
        coinAccreditati: false,
        createdAt:       firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    closeModal();
  } catch (err) {
    showFormError('Errore Firestore: ' + err.message);
  } finally {
    btnCreate.disabled    = false;
    btnCreate.textContent = isEdit ? 'Salva modifiche' : 'Crea Task';
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
let currentSearch = '';
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

  let result;
  if (currentFilter === 'tutte') {
    result = smartSort(docs);
  } else {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const ref = currentFilter === 'oggi' ? today : tomorrow;
    result = docs
      .filter(d => d.data().stato === 'attiva' && isSameDay(d.data().scadenza.toDate(), ref))
      .sort((a,b) => b.data().reward - a.data().reward);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    result = result.filter(d => {
      const t = d.data();
      return t.nome.toLowerCase().includes(q) ||
             (t.descrizione && t.descrizione.toLowerCase().includes(q));
    });
  }
  return result;
}

function applyFilter() {
  renderTasks(getFilteredDocs());
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    currentSearch = '';
    const sb = document.getElementById('search-bar');
    if (sb) sb.value = '';
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
    if (currentSearch) {
      emptyIcon.textContent = '🔍';
      emptyMsg.textContent  = `Nessun risultato per "${currentSearch}"`;
    } else {
      const m = emptyMessages[currentFilter];
      emptyIcon.textContent = m.icon;
      emptyMsg.innerHTML    = m.text;
    }
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
        <div class="task-card-top-right">
          <span class="priority-dot priority-${t.priorita}"></span>
          ${!failed ? `
          <div class="task-menu-wrap">
            <button class="btn-task-menu" aria-label="Opzioni">⋮</button>
            <div class="task-menu-dropdown hidden">
              <button class="task-menu-item" data-action="edit" data-id="${doc.id}">✏️ Modifica</button>
              <button class="task-menu-item" data-action="delete" data-id="${doc.id}">🗑️ Elimina</button>
            </div>
          </div>` : ''}
        </div>
      </div>
      ${t.descrizione ? `<p class="task-desc">${escapeHtml(t.descrizione)}</p>` : ''}
      <div class="task-card-bottom">
        <div class="task-date-col">
          <span class="task-date">${failed ? '⚠️' : '📅'} ${formatDateIT(t.scadenza)}</span>
          ${t.ricorrente && RICORRENZA_LABEL[t.ricorrenza] ? `<span class="recurring-label">${RICORRENZA_LABEL[t.ricorrenza]}</span>` : ''}
        </div>
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
      if (!doc) return;
      const t = doc.data();
      if (t.stato === 'fallita') {
        completeTask(btn.dataset.id, t, btn);
      } else {
        showNoteModal(btn.dataset.id, t, btn);
      }
    });
  });

  list.querySelectorAll('.btn-task-menu').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      const isHidden = dropdown.classList.contains('hidden');
      document.querySelectorAll('.task-menu-dropdown').forEach(d => d.classList.add('hidden'));
      if (isHidden) dropdown.classList.remove('hidden');
    });
  });

  list.querySelectorAll('.task-menu-item').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.task-menu-dropdown').forEach(d => d.classList.add('hidden'));
      const docId   = item.dataset.id;
      const taskDoc = allTaskDocs.find(d => d.id === docId);
      if (!taskDoc) return;
      if (item.dataset.action === 'edit')   openEditModal(docId, taskDoc.data());
      if (item.dataset.action === 'delete') showDeleteTaskModal(docId);
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
    bar.style.transition = 'width 5s linear';
    bar.style.width = '0%';
  }));

  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(async () => {
    toast.classList.add('hidden');
    await onCommit();
  }, 5000);

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
async function completeTask(docId, taskData, anchorEl, nota = null) {
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

  pendingComplete = { docId, taskData, coinDelta, nota };
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
  const { docId, taskData, coinDelta, nota } = pendingComplete;
  pendingComplete = null;
  try {
    const taskUpdate = {
      stato:           'completata',
      coinAccreditati: coinDelta > 0,
      completedAt:     firebase.firestore.FieldValue.serverTimestamp()
    };
    if (nota) taskUpdate.nota = nota;
    await db.collection('tasks').doc(docId).update(taskUpdate);
    if (coinDelta > 0) {
      await db.collection('settings').doc('user').set(
        { consecutiveCompleted: firebase.firestore.FieldValue.increment(1) },
        { merge: true }
      );
    }
    if (taskData && taskData.ricorrente && taskData.ricorrenza) {
      const nextDate = computeNextScadenza(taskData.scadenza.toDate(), taskData.ricorrenza);
      await db.collection('tasks').add({
        nome: taskData.nome, descrizione: taskData.descrizione,
        reward: taskData.reward, penalita: taskData.penalita, priorita: taskData.priorita,
        ricorrente: true, ricorrenza: taskData.ricorrenza,
        scadenza: firebase.firestore.Timestamp.fromDate(nextDate),
        stato: 'attiva', coinAccreditati: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
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
    const recurringExpired = expired.filter(d => d.data().ricorrente && d.data().ricorrenza);
    if (recurringExpired.length > 0) {
      await Promise.all(recurringExpired.map(doc => {
        const t = doc.data();
        const nextDate = computeNextScadenza(t.scadenza.toDate(), t.ricorrenza);
        return db.collection('tasks').add({
          nome: t.nome, descrizione: t.descrizione,
          reward: t.reward, penalita: t.penalita, priorita: t.priorita,
          ricorrente: true, ricorrenza: t.ricorrenza,
          scadenza: firebase.firestore.Timestamp.fromDate(nextDate),
          stato: 'attiva', coinAccreditati: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }));
    }
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
    tasksLoaded = true;
    checkExpiredTasks();
    applyFilter();
    maybeShowMorningReminder();
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
      ${t.nota ? `<p class="history-note">${escapeHtml(t.nota)}</p>` : ''}
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

    // New day — flag morning reminder
    morningReminderPending = true;

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
    maybeShowMorningReminder();
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

/* ===== RECURRING LABEL MAP ===== */
const RICORRENZA_LABEL = {
  giornaliera:   '🔁 si ripete ogni giorno',
  settimanale:   '🔁 si ripete ogni settimana',
  bisettimanale: '🔁 si ripete ogni 2 settimane',
  mensile:       '🔁 si ripete ogni mese'
};

/* ===== RECURRING HELPER ===== */
function computeNextScadenza(date, ricorrenza) {
  const next = new Date(date);
  switch (ricorrenza) {
    case 'giornaliera':   next.setDate(next.getDate() + 1);   break;
    case 'settimanale':   next.setDate(next.getDate() + 7);   break;
    case 'bisettimanale': next.setDate(next.getDate() + 14);  break;
    case 'mensile':       next.setMonth(next.getMonth() + 1); break;
  }
  return next;
}

/* ===== EDIT TASK MODAL ===== */
function openEditModal(docId, taskData) {
  resetForm();
  editDocId = docId;

  document.getElementById('f-nome').value = taskData.nome || '';
  document.getElementById('f-desc').value = taskData.descrizione || '';

  const scadDate  = taskData.scadenza.toDate();
  calYear         = scadDate.getFullYear();
  calMonth        = scadDate.getMonth();
  calSelected     = new Date(scadDate); calSelected.setHours(0, 0, 0, 0);
  renderCalendar();
  const dd = document.getElementById('f-date-display');
  dd.textContent = `📅 ${calSelected.getDate()} ${MESI_SHORT[calSelected.getMonth()]} ${calSelected.getFullYear()}`;
  dd.classList.add('selected');

  formReward = taskData.reward;
  document.getElementById('sel-reward').querySelectorAll('.coin-sq').forEach(sq => {
    if (parseInt(sq.dataset.val) === formReward) sq.classList.add('selected-green');
  });

  formPenalty = taskData.penalita;
  document.getElementById('sel-penalty').querySelectorAll('.coin-sq').forEach(sq => {
    if (parseInt(sq.dataset.val) === formPenalty) sq.classList.add('selected-red');
  });

  formPriority = taskData.priorita;
  document.querySelectorAll('.priority-btn').forEach(btn => {
    if (btn.dataset.val === formPriority) btn.classList.add('selected');
  });

  if (taskData.ricorrente) {
    formRicorrente = true;
    formRicorrenza = taskData.ricorrenza || null;
    const toggle = document.getElementById('f-ricorrente-toggle');
    toggle.classList.add('active');
    toggle.setAttribute('aria-checked', 'true');
    document.getElementById('f-ricorrenza-options').classList.remove('hidden');
    if (formRicorrenza) {
      document.querySelectorAll('.ricorrenza-btn').forEach(btn => {
        if (btn.dataset.val === formRicorrenza) btn.classList.add('selected');
      });
    }
  }

  document.getElementById('btn-create').textContent = 'Salva modifiche';
  document.querySelector('.modal-title').textContent = 'Modifica Quest';

  modalOverlay.classList.remove('hidden');
  requestAnimationFrame(() => modalPanel.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

/* ===== DELETE TASK MODAL ===== */
let deleteDocId = null;

function showDeleteTaskModal(docId) {
  deleteDocId = docId;
  const overlay = document.getElementById('delete-task-modal-overlay');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => document.getElementById('delete-task-modal-panel').classList.add('open'));
  document.body.style.overflow = 'hidden';
}

const closeDeleteTaskModal = () => {
  document.getElementById('delete-task-modal-panel').classList.remove('open');
  setTimeout(() => {
    document.getElementById('delete-task-modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    deleteDocId = null;
  }, 300);
};

document.getElementById('btn-delete-task-cancel').addEventListener('click', closeDeleteTaskModal);
document.getElementById('delete-task-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('delete-task-modal-overlay')) closeDeleteTaskModal();
});
document.getElementById('btn-delete-task-confirm').addEventListener('click', async () => {
  if (!deleteDocId) return;
  const btn = document.getElementById('btn-delete-task-confirm');
  btn.disabled = true;
  try {
    await db.collection('tasks').doc(deleteDocId).delete();
    closeDeleteTaskModal();
    showInfoToast('Task eliminata');
  } catch (e) {
    console.error('Delete task error:', e);
    btn.disabled = false;
  }
});

/* ===== CLOSE CONTEXT MENU ON OUTSIDE CLICK ===== */
document.addEventListener('click', () => {
  document.querySelectorAll('.task-menu-dropdown').forEach(d => d.classList.add('hidden'));
});

/* ===== RECURRING TOGGLE LISTENERS ===== */
document.getElementById('f-ricorrente-toggle').addEventListener('click', () => {
  formRicorrente = !formRicorrente;
  const toggle = document.getElementById('f-ricorrente-toggle');
  toggle.classList.toggle('active', formRicorrente);
  toggle.setAttribute('aria-checked', String(formRicorrente));
  const opts = document.getElementById('f-ricorrenza-options');
  opts.classList.toggle('hidden', !formRicorrente);
  if (!formRicorrente) {
    formRicorrenza = null;
    document.querySelectorAll('.ricorrenza-btn').forEach(b => b.classList.remove('selected'));
  }
});

document.querySelectorAll('.ricorrenza-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ricorrenza-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    formRicorrenza = btn.dataset.val;
  });
});

/* ===== MORNING REMINDER ===== */
let tasksLoaded            = false;
let morningReminderPending = false;
let morningReminderShown   = false;

function maybeShowMorningReminder() {
  if (morningReminderPending && !morningReminderShown && tasksLoaded) {
    morningReminderPending = false;
    morningReminderShown   = true;
    setTimeout(showMorningReminder, 1000);
  }
}

/* ===== SEARCH BAR ===== */
document.getElementById('search-bar').addEventListener('input', e => {
  currentSearch = e.target.value.trim().toLowerCase();
  applyFilter();
});

/* ===== NOTE MODAL ===== */
function showNoteModal(docId, taskData, anchorEl) {
  document.getElementById('f-nota').value = '';
  const overlay = document.getElementById('note-modal-overlay');
  const panel   = document.getElementById('note-modal-panel');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('open'));
  document.body.style.overflow = 'hidden';

  const proceed = nota => {
    panel.classList.remove('open');
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      completeTask(docId, taskData, anchorEl, nota);
    }, 250);
  };

  document.getElementById('btn-nota-skip').onclick = () => proceed(null);
  document.getElementById('btn-nota-save').onclick = () => {
    const nota = document.getElementById('f-nota').value.trim();
    proceed(nota || null);
  };
}

/* ===== BACKUP EXPORT ===== */
function serializeForExport(val) {
  if (val === null || val === undefined) return val;
  if (val && typeof val.toDate === 'function') return { _ts: val.toDate().toISOString() };
  if (Array.isArray(val)) return val.map(serializeForExport);
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = serializeForExport(val[k]);
    return out;
  }
  return val;
}

function deserializeFromImport(val) {
  if (val === null || val === undefined) return val;
  if (val && typeof val === 'object' && val._ts) return firebase.firestore.Timestamp.fromDate(new Date(val._ts));
  if (Array.isArray(val)) return val.map(deserializeFromImport);
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) { if (k !== '_id') out[k] = deserializeFromImport(val[k]); }
    return out;
  }
  return val;
}

document.getElementById('btn-export').addEventListener('click', async () => {
  const btn = document.getElementById('btn-export');
  btn.disabled = true; btn.textContent = '⏳ Esportazione…';
  try {
    const [tasksSnap, settingsSnap] = await Promise.all([
      db.collection('tasks').get(),
      db.collection('settings').doc('user').get()
    ]);
    const data = {
      version:    '1.0',
      exportDate: new Date().toISOString(),
      tasks:      tasksSnap.docs.map(d => ({ _id: d.id, ...serializeForExport(d.data()) })),
      settings:   settingsSnap.exists ? serializeForExport(settingsSnap.data()) : {}
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `questlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showInfoToast('Backup esportato ✓');
  } catch (e) {
    console.error('Export error:', e);
    showInfoToast('Errore esportazione');
  } finally {
    btn.disabled = false; btn.textContent = '⬇️ Esporta JSON';
  }
});

/* ===== BACKUP IMPORT ===== */
let importData = null;

document.getElementById('btn-import-json').addEventListener('click', () => {
  document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.version || !Array.isArray(data.tasks)) { showInfoToast('File non valido'); return; }
      importData = data;
      const overlay = document.getElementById('import-modal-overlay');
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => document.getElementById('import-modal-panel').classList.add('open'));
      document.body.style.overflow = 'hidden';
    } catch { showInfoToast('File non valido'); }
  };
  reader.readAsText(file);
});

const closeImportModal = () => {
  document.getElementById('import-modal-panel').classList.remove('open');
  setTimeout(() => {
    document.getElementById('import-modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    importData = null;
  }, 300);
};

document.getElementById('btn-import-cancel').addEventListener('click', closeImportModal);
document.getElementById('import-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('import-modal-overlay')) closeImportModal();
});

document.getElementById('btn-import-confirm').addEventListener('click', async () => {
  if (!importData) return;
  const btn = document.getElementById('btn-import-confirm');
  btn.disabled = true; btn.textContent = '⏳ Importazione…';
  try {
    const existing = await db.collection('tasks').get();
    const delBatch = db.batch();
    existing.docs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();

    if (importData.settings) {
      await db.collection('settings').doc('user').set(deserializeFromImport(importData.settings));
    }

    const tasks = importData.tasks || [];
    for (let i = 0; i < tasks.length; i += 400) {
      const batch = db.batch();
      tasks.slice(i, i + 400).forEach(task => {
        const { _id, ...rest } = task;
        const ref = _id ? db.collection('tasks').doc(_id) : db.collection('tasks').doc();
        batch.set(ref, deserializeFromImport(rest));
      });
      await batch.commit();
    }
    window.location.reload();
  } catch (e) {
    console.error('Import error:', e);
    showInfoToast('Errore importazione');
    btn.disabled = false; btn.textContent = 'Importa';
  }
});

function showMorningReminder() {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayTasks  = allTaskDocs.filter(d => {
    const t = d.data();
    if (t.stato !== 'attiva') return false;
    const s = t.scadenza.toDate(); s.setHours(0, 0, 0, 0);
    return s.getTime() === today.getTime();
  });
  const failedTasks = allTaskDocs.filter(d => d.data().stato === 'fallita');

  const overlay = document.getElementById('morning-modal-overlay');
  const panel   = document.getElementById('morning-modal-panel');

  const todayEl = document.getElementById('morning-today-list');
  if (todayTasks.length === 0) {
    todayEl.innerHTML = '<p class="morning-empty">Nessuna task in scadenza oggi 🎉</p>';
  } else {
    todayEl.innerHTML = todayTasks.map(doc => {
      const t = doc.data();
      return `<div class="morning-task-row">
        <span class="morning-task-name">${escapeHtml(t.nome)}</span>
        <span class="priority-dot priority-${t.priorita}"></span>
        <span class="pill pill-green">💰 ${t.reward}</span>
      </div>`;
    }).join('');
  }

  const failedSection = document.getElementById('morning-failed-section');
  if (failedTasks.length > 0) {
    failedSection.classList.remove('hidden');
    document.getElementById('morning-failed-list').innerHTML = failedTasks.map(doc => {
      const t = doc.data();
      return `<div class="morning-task-row">
        <span class="morning-task-name">${escapeHtml(t.nome)}</span>
        <span class="pill pill-red">💀 -${t.penalita}</span>
      </div>`;
    }).join('');
  } else {
    failedSection.classList.add('hidden');
  }

  overlay.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('open'));
  document.body.style.overflow = 'hidden';

  document.getElementById('btn-morning-close').onclick = () => {
    panel.classList.remove('open');
    setTimeout(() => { overlay.classList.add('hidden'); document.body.style.overflow = ''; }, 300);
  };
  overlay.addEventListener('click', e => {
    if (e.target === overlay) document.getElementById('btn-morning-close').click();
  }, { once: true });
}
