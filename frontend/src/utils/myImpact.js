const KEY = "my_impact_transaction_ids";

export function getSavedTransactionIds() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransactionId(id) {
  const ids = getSavedTransactionIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(KEY, JSON.stringify(ids));
  }
  return ids;
}

export function removeTransactionId(id) {
  const ids = getSavedTransactionIds().filter((existing) => existing !== id);
  localStorage.setItem(KEY, JSON.stringify(ids));
  return ids;
}
