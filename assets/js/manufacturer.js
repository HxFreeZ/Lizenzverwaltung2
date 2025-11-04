import {
  loadData,
  findManufacturer,
  updateManufacturer,
  isAdmin,
  setAdmin,
  requireAdmin,
  generateId
} from './dataStore.js';

const params = new URLSearchParams(window.location.search);
const manufacturerId = params.get('id');
const title = document.querySelector('[data-manufacturer-title]');
const breadcrumbTitle = document.querySelector('[data-breadcrumb-title]');
const tableHead = document.querySelector('[data-table-head]');
const tableBody = document.querySelector('[data-table-body]');
const addColumnForm = document.querySelector('[data-add-column-form]');
const addRowButton = document.querySelector('[data-add-row]');
const adminButton = document.querySelector('[data-admin-button]');
const adminStatus = document.querySelector('[data-admin-status]');
const adminModal = document.querySelector('[data-admin-modal]');
const adminForm = document.querySelector('[data-admin-form]');
const adminCancel = document.querySelector('[data-admin-cancel]');
const feedback = document.querySelector('[data-feedback]');
const homeLink = document.querySelector('[data-home-link]');

let data = loadData();
let manufacturer = manufacturerId ? findManufacturer(data, manufacturerId) : null;
let feedbackTimer;

if (!manufacturer) {
  title.textContent = 'Hersteller nicht gefunden';
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = 'Unbekannter Hersteller';
  }
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = '<p class="empty-state">Bitte zur Übersicht zurückkehren und einen gültigen Hersteller wählen.</p>';
  }
  if (homeLink) {
    homeLink.focus();
  }
} else {
  normalizeRows();
  renderAll();
}

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

if (addColumnForm) {
  addColumnForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!manufacturer) return;
    if (!isAdmin()) {
      showFeedback('Nur Admins können Spalten hinzufügen.', 'error');
      return;
    }

    const name = new FormData(addColumnForm).get('columnName').trim();
    if (!name) {
      showFeedback('Bitte einen Spaltennamen eingeben.', 'error');
      return;
    }

    const newColumn = { id: generateId(), name };
    manufacturer.columns.push(newColumn);
    for (const row of manufacturer.rows) {
      row.cells.push({ columnId: newColumn.id, value: '' });
    }
    updateManufacturerData();
    addColumnForm.reset();
    showFeedback(`Spalte "${name}" hinzugefügt.`, 'success');
  });
}

if (addRowButton) {
  addRowButton.addEventListener('click', () => {
    if (!manufacturer) return;
    if (!isAdmin()) {
      showFeedback('Nur Admins können Zeilen hinzufügen.', 'error');
      return;
    }

    const newRow = {
      id: generateId(),
      cells: manufacturer.columns.map((column) => ({ columnId: column.id, value: '' }))
    };
    manufacturer.rows.push(newRow);
    updateManufacturerData();
    showFeedback('Neue Zeile erstellt.', 'success');
  });
}

tableBody.addEventListener('input', (event) => {
  if (!manufacturer) return;
  const cellElement = event.target.closest('[data-cell]');
  if (!cellElement) return;
  const { rowId, columnId } = cellElement.dataset;
  const row = manufacturer.rows.find((r) => r.id === rowId);
  if (!row) return;
  let cell = row.cells.find((c) => c.columnId === columnId);
  if (!cell) {
    cell = { columnId, value: '' };
    row.cells.push(cell);
  }
  cell.value = event.target.textContent.trim();
  updateManufacturerData(false);
});

tableHead.addEventListener('click', (event) => {
  if (!manufacturer) return;
  const button = event.target.closest('[data-remove-column]');
  if (!button) return;
  if (!isAdmin()) {
    showFeedback('Nur Admins können Spalten löschen.', 'error');
    return;
  }
  const columnId = button.dataset.columnId;
  const column = manufacturer.columns.find((c) => c.id === columnId);
  if (!column) return;
  if (!confirm(`Spalte "${column.name}" wirklich löschen?`)) {
    return;
  }
  manufacturer.columns = manufacturer.columns.filter((c) => c.id !== columnId);
  for (const row of manufacturer.rows) {
    row.cells = row.cells.filter((cell) => cell.columnId !== columnId);
  }
  updateManufacturerData();
  showFeedback(`Spalte "${column.name}" gelöscht.`, 'info');
});

tableBody.addEventListener('click', (event) => {
  if (!manufacturer) return;
  const button = event.target.closest('[data-remove-row]');
  if (!button) return;
  if (!isAdmin()) {
    showFeedback('Nur Admins können Zeilen löschen.', 'error');
    return;
  }
  const rowId = button.dataset.rowId;
  if (!confirm('Zeile wirklich löschen?')) {
    return;
  }
  manufacturer.rows = manufacturer.rows.filter((row) => row.id !== rowId);
  updateManufacturerData();
  showFeedback('Zeile gelöscht.', 'info');
});

function renderAll() {
  title.textContent = manufacturer.name;
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = manufacturer.name;
  }
  updateAdminUI();
}

function renderTable() {
  const admin = isAdmin();
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';

  const headerRow = document.createElement('tr');
  for (const column of manufacturer.columns) {
    const th = document.createElement('th');
    th.textContent = column.name;
    if (admin) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = '✕';
      removeButton.title = 'Spalte löschen';
      removeButton.className = 'icon-button';
      removeButton.dataset.removeColumn = '';
      removeButton.dataset.columnId = column.id;
      th.appendChild(removeButton);
    }
    headerRow.appendChild(th);
  }
  const actionsTh = document.createElement('th');
  actionsTh.textContent = admin ? 'Aktionen' : 'Status';
  headerRow.appendChild(actionsTh);
  tableHead.appendChild(headerRow);

  for (const row of manufacturer.rows) {
    const tr = document.createElement('tr');
    for (const column of manufacturer.columns) {
      const cell = row.cells.find((c) => c.columnId === column.id) || { value: '' };
      const td = document.createElement('td');
      td.dataset.cell = '';
      td.dataset.rowId = row.id;
      td.dataset.columnId = column.id;
      td.contentEditable = admin;
      td.classList.toggle('editable-cell', admin);
      td.textContent = cell.value;
      tr.appendChild(td);
    }
    const actionsTd = document.createElement('td');
    if (admin) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'primary-button danger-button';
      removeButton.dataset.removeRow = '';
      removeButton.dataset.rowId = row.id;
      removeButton.textContent = 'Zeile löschen';
      actionsTd.appendChild(removeButton);
    } else {
      actionsTd.textContent = '—';
      actionsTd.classList.add('muted');
    }
    tr.appendChild(actionsTd);
    tableBody.appendChild(tr);
  }

  if (manufacturer.rows.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = manufacturer.columns.length + 1;
    emptyCell.className = 'empty-state';
    emptyCell.textContent = 'Noch keine Zeilen vorhanden.';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
  }
}

function updateAdminUI() {
  if (!manufacturer) {
    adminStatus.textContent = 'Admin-Modus inaktiv';
    adminButton.textContent = 'Admin-Login';
    return;
  }
  const admin = isAdmin();
  adminStatus.textContent = admin ? 'Admin-Modus aktiv' : 'Admin-Modus inaktiv';
  adminButton.textContent = admin ? 'Admin-Modus beenden' : 'Admin-Login';
  const fieldset = addColumnForm.querySelector('fieldset');
  if (fieldset) {
    fieldset.disabled = !admin;
  }
  if (addRowButton) {
    addRowButton.disabled = !admin;
  }
  renderTable();
}

function updateManufacturerData(refresh = true) {
  const data = loadData();
  updateManufacturer(data, manufacturer);
  normalizeRows();
  if (refresh) {
    renderTable();
  }
}

function normalizeRows() {
  for (const row of manufacturer.rows) {
    if (!Array.isArray(row.cells)) {
      row.cells = [];
    }
    for (const column of manufacturer.columns) {
      const existing = row.cells.find((cell) => cell.columnId === column.id);
      if (!existing) {
        row.cells.push({ columnId: column.id, value: '' });
      }
    }
  }
}

function showFeedback(message, variant) {
  if (!feedback) return;
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
