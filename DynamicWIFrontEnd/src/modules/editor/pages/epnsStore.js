// Local EPNs storage utility
// Uses localStorage for demo; replace with backend/file for production

const STORAGE_KEY = 'epns-list-v1';

export function getEPNs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEPNs(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function findEPN(epn) {
  return getEPNs().find(e => e.epn === epn);
}

export function addEPN(epnObj) {
  const list = getEPNs();
  list.push(epnObj);
  saveEPNs(list);
}

export function bulkAddEPNs(newEpns) {
  const list = getEPNs();
  // Filter out duplicates just in case
  const filteredNew = newEpns.filter(n => !list.some(existing => existing.epn === n.epn));
  saveEPNs([...list, ...filteredNew]);
}

export function updateEPN(epn, update) {
  const list = getEPNs();
  const idx = list.findIndex(e => e.epn === epn);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...update };
    saveEPNs(list);
  }
}

export function deleteEPN(epn) {
  const list = getEPNs().filter(e => e.epn !== epn);
  saveEPNs(list);
}
