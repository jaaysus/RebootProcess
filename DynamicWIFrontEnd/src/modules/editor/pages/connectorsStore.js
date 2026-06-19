// Local Connectors storage utility
// Uses localStorage for demo; replace with backend/file for production

const STORAGE_KEY = 'connectors-list-v1';

export function getConnectors() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConnectors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addConnector(connectorObj) {
  const list = getConnectors();
  list.push(connectorObj);
  saveConnectors(list);
}

export function bulkAddConnectors(newConnectors) {
  const list = getConnectors();
  const filteredNew = newConnectors.filter(n => !list.some(existing => existing.name === n.name));
  saveConnectors([...list, ...filteredNew]);
}

export function deleteConnector(name) {
  const list = getConnectors().filter(c => c.name !== name);
  saveConnectors(list);
}

export function updateConnector(name, update) {
  const list = getConnectors();
  const idx = list.findIndex(c => c.name === name);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...update };
    saveConnectors(list);
  }
}

export function findConnector(name) {
  return getConnectors().find(c => c.name === name);
}
