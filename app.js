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
