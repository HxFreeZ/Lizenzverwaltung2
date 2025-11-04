import {
  loadData,
  addManufacturer,
  removeManufacturer,
  isAdmin,
  setAdmin,
  requireAdmin
} from './dataStore.js';

const manufacturerList = document.querySelector('[data-manufacturer-list]');
const adminStatus = document.querySelector('[data-admin-status]');
const adminButton = document.querySelector('[data-admin-button]');
const adminModal = document.querySelector('[data-admin-modal]');
const adminForm = document.querySelector('[data-admin-form]');
const adminCancel = document.querySelector('[data-admin-cancel]');
const manufacturerForm = document.querySelector('[data-new-manufacturer-form]');
const manufacturerNameInput = document.querySelector('[data-new-manufacturer-name]');
const feedback = document.querySelector('[data-feedback]');

let data = loadData();
let feedbackTimer;
renderManufacturers();
updateAdminUI();

adminButton.addEventListener('click', () => {
  if (isAdmin()) {
    setAdmin(false);
    updateAdminUI();
    showFeedback('Admin-Modus beendet.', 'info');
  } else {
    adminModal.showModal();
  }
});

adminCancel.addEventListener('click', (event) => {
  event.preventDefault();
  adminForm.reset();
  adminModal.close();
});

adminForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const password = new FormData(adminForm).get('password');
  if (requireAdmin(password)) {
    setAdmin(true);
    updateAdminUI();
    adminForm.reset();
    adminModal.close();
    showFeedback('Admin-Modus aktiviert.', 'success');
  } else {
    showFeedback('Falsches Passwort.', 'error');
  }
});

manufacturerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!isAdmin()) {
    showFeedback('Nur Admins können Hersteller hinzufügen.', 'error');
    return;
  }

  const name = manufacturerNameInput.value.trim();
  if (!name) {
    showFeedback('Bitte einen Herstellernamen eingeben.', 'error');
    return;
  }

  const existing = data.manufacturers.find((m) => m.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    showFeedback('Dieser Hersteller existiert bereits.', 'error');
    return;
  }

  const manufacturer = addManufacturer(data, name);
  data = loadData();
  manufacturerNameInput.value = '';
  showFeedback(`Hersteller "${manufacturer.name}" hinzugefügt.`, 'success');
  renderManufacturers();
});

function renderManufacturers() {
  data = loadData();
  manufacturerList.innerHTML = '';
  if (data.manufacturers.length === 0) {
    manufacturerList.innerHTML = '<p class="empty-state">Keine Hersteller vorhanden. Bitte im Admin-Modus hinzufügen.</p>';
    return;
  }

  for (const manufacturer of data.manufacturers) {
    const item = document.createElement('article');
    item.className = 'manufacturer-item';
    item.innerHTML = `
      <a href="manufacturer.html?id=${manufacturer.id}">${manufacturer.name}</a>
      <p class="muted">${manufacturer.columns.length} Spalten · ${manufacturer.rows.length} Einträge</p>
      <div class="table-actions">
        <a class="secondary-button" href="manufacturer.html?id=${manufacturer.id}">Details öffnen</a>
        ${isAdmin() ? '<button class="primary-button danger-button" type="button" data-delete>Hersteller löschen</button>' : ''}
      </div>
    `;

    if (isAdmin()) {
      const deleteButton = item.querySelector('[data-delete]');
      deleteButton.addEventListener('click', () => {
        if (confirm(`Hersteller "${manufacturer.name}" wirklich löschen?`)) {
          removeManufacturer(data, manufacturer.id);
          data = loadData();
          renderManufacturers();
          showFeedback(`Hersteller "${manufacturer.name}" gelöscht.`, 'info');
        }
      });
    }

    manufacturerList.appendChild(item);
  }
}

function updateAdminUI() {
  const admin = isAdmin();
  adminStatus.textContent = admin ? 'Admin-Modus aktiv' : 'Admin-Modus inaktiv';
  adminButton.textContent = admin ? 'Admin-Modus beenden' : 'Admin-Login';
  const fieldset = manufacturerForm.querySelector('fieldset');
  if (fieldset) {
    fieldset.disabled = !admin;
  }
  renderManufacturers();
}

function showFeedback(message, variant) {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
  }
  feedback.textContent = message;
  feedback.dataset.variant = variant;
  feedback.hidden = false;
  feedbackTimer = setTimeout(() => {
    feedback.hidden = true;
    feedbackTimer = undefined;
  }, 4000);
}
