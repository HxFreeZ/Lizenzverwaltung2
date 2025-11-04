const STORAGE_KEY = 'licenseTrackerData';
const ADMIN_PASSWORD = 'admin123';

function generateId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = {
      manufacturers: [
        {
          id: generateId(),
          name: 'Beispiel Hersteller',
          columns: [
            { id: generateId(), name: 'Lizenzschlüssel' },
            { id: generateId(), name: 'Ablaufdatum' },
            { id: generateId(), name: 'Anzahl Plätze' }
          ],
          rows: []
        }
      ]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Fehler beim Lesen der Daten, initialisiere neu.', error);
    localStorage.removeItem(STORAGE_KEY);
    return loadData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function findManufacturer(data, id) {
  return data.manufacturers.find((m) => m.id === id);
}

function removeManufacturer(data, id) {
  data.manufacturers = data.manufacturers.filter((m) => m.id !== id);
  saveData(data);
}

function addManufacturer(data, name) {
  const manufacturer = {
    id: generateId(),
    name,
    columns: [],
    rows: []
  };
  data.manufacturers.push(manufacturer);
  saveData(data);
  return manufacturer;
}

function updateManufacturer(data, manufacturer) {
  const index = data.manufacturers.findIndex((m) => m.id === manufacturer.id);
  if (index !== -1) {
    data.manufacturers[index] = manufacturer;
    saveData(data);
  }
}

function isAdmin() {
  return sessionStorage.getItem('licenseTrackerAdmin') === 'true';
}

function setAdmin(value) {
  if (value) {
    sessionStorage.setItem('licenseTrackerAdmin', 'true');
  } else {
    sessionStorage.removeItem('licenseTrackerAdmin');
  }
}

function requireAdmin(password) {
  return password === ADMIN_PASSWORD;
}

export {
  ADMIN_PASSWORD,
  generateId,
  loadData,
  saveData,
  addManufacturer,
  removeManufacturer,
  findManufacturer,
  updateManufacturer,
  isAdmin,
  setAdmin,
  requireAdmin
};
