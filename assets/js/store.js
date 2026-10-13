// In-memory state: loaded documents, image assets and the active document.
// Nothing is persisted or sent anywhere; reloading the page clears it.

const listeners = new Set();

const state = {
  /** @type {{id: string, name: string, text: string}[]} */
  docs: [],
  /** Image file name (lower-cased) -> object URL. */
  assets: new Map(),
  /** @type {string | null} */
  activeId: null,
};

let nextId = 1;

function emit() {
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function getActiveDoc() {
  return state.docs.find((d) => d.id === state.activeId) ?? null;
}

/** Add documents, replacing any with the same name. Activates the first one added. */
export function addDocs(newDocs) {
  let firstId = null;
  for (const { name, text } of newDocs) {
    const existing = state.docs.find((d) => d.name === name);
    if (existing) {
      existing.text = text;
      firstId ??= existing.id;
    } else {
      const id = `doc-${nextId++}`;
      state.docs.push({ id, name, text });
      firstId ??= id;
    }
  }
  if (firstId) state.activeId = firstId;
  emit();
}

/** Register image files so Markdown can reference them by file name. */
export function addAssets(files) {
  for (const file of files) {
    const key = file.name.toLowerCase();
    const old = state.assets.get(key);
    if (old) URL.revokeObjectURL(old);
    state.assets.set(key, URL.createObjectURL(file));
  }
  if (files.length) emit();
}

export function getAssetUrl(name) {
  return state.assets.get(name.toLowerCase()) ?? null;
}

export function setActive(id) {
  if (state.activeId === id || !state.docs.some((d) => d.id === id)) return;
  state.activeId = id;
  emit();
}

export function findDocByName(name) {
  const key = name.toLowerCase();
  return state.docs.find((d) => d.name.toLowerCase() === key) ?? null;
}

export function removeDoc(id) {
  const index = state.docs.findIndex((d) => d.id === id);
  if (index === -1) return;
  state.docs.splice(index, 1);
  if (state.activeId === id) {
    state.activeId = state.docs[Math.min(index, state.docs.length - 1)]?.id ?? null;
  }
  emit();
}
