// Entry point: wires the store, file loading, rendering and UI together.

import * as store from './store.js';
import { readFiles, bindFileInput, bindDropTarget } from './loader.js';
import { renderMarkdown, fileNameFromPath, HEADING_ID_PREFIX } from './renderer.js';
import { els, renderFileList, renderToc, showDocument, showEmpty, setSidebarOpen, toast } from './view.js';
import { initTheme } from './theme.js';
import { initPrint } from './print.js';
import { initPaste } from './paste.js';

const SAMPLE_URL = 'samples/welcome.md';

async function handleFiles(files) {
  const { docs, images, skipped } = await readFiles(files);

  store.addAssets(images);
  if (docs.length) store.addDocs(docs);

  if (skipped.length) toast(`Skipped unsupported files: ${skipped.join(', ')}`);
  else if (!docs.length && images.length) toast(`Added ${images.length} image(s). Open a Markdown file that uses them.`);

  setSidebarOpen(false);
}

// What is currently on screen, to skip needless re-renders.
let rendered = { id: null, text: null, assetCount: 0 };

function render(state) {
  renderFileList(state.docs, state.activeId, {
    onOpen: (id) => { store.setActive(id); setSidebarOpen(false); },
    onRemove: (id) => store.removeDoc(id),
  });

  const doc = store.getActiveDoc();
  if (!doc) {
    rendered = { id: null, text: null, assetCount: 0 };
    showEmpty();
    return;
  }

  const assetCount = state.assets.size;
  if (doc.id === rendered.id && doc.text === rendered.text && assetCount === rendered.assetCount) return;
  const switched = doc.id !== rendered.id;
  rendered = { id: doc.id, text: doc.text, assetCount };

  const { fragment, headings } = renderMarkdown(doc.text, { resolveAsset: store.getAssetUrl });
  showDocument(doc.name, fragment);
  renderToc(headings);
  if (switched) window.scrollTo({ top: 0 });
}

/** In-document links: #heading jumps, and links to other loaded .md files. */
function handleDocumentClick(event) {
  const link = event.target.closest('a[href]');
  if (!link || link.target === '_blank') return;

  const href = link.getAttribute('href');

  if (href.startsWith('#')) {
    const slug = decodeURIComponent(href.slice(1));
    const target = document.getElementById(HEADING_ID_PREFIX + slug)
      ?? document.getElementById(`user-content-${slug}`);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${slug}`);
      setSidebarOpen(false);
    }
    return;
  }

  const name = fileNameFromPath(href);
  const other = store.findDocByName(name);
  if (other) {
    event.preventDefault();
    store.setActive(other.id);
  } else if (!/^[a-z][a-z\d+.-]*:/i.test(href)) {
    event.preventDefault();
    toast(`"${name}" is not open. Add it to view it here.`);
  }
}

async function loadSample() {
  try {
    const res = await fetch(SAMPLE_URL);
    if (!res.ok) throw new Error(res.statusText);
    store.addDocs([{ name: 'welcome.md', text: await res.text() }]);
  } catch {
    toast('Could not load the sample document.');
  }
}

function init() {
  initTheme(document.getElementById('theme-toggle'));

  bindFileInput(document.getElementById('file-input'), handleFiles);
  bindDropTarget(document.getElementById('drag-overlay'), handleFiles);

  document.getElementById('sample-btn').addEventListener('click', loadSample);

  initPaste({
    openers: [document.getElementById('paste-btn'), document.getElementById('paste-start-btn')],
    onPreview: (doc) => { store.addDocs([doc]); setSidebarOpen(false); },
    notify: toast,
  });

  initPrint({
    button: els.pdfBtn,
    documentEl: els.document,
    getFileName: () => store.getActiveDoc()?.name ?? null,
    notify: toast,
  });

  els.sidebarToggle.addEventListener('click', () => {
    setSidebarOpen(!els.sidebar.classList.contains('is-open'));
  });

  els.document.addEventListener('click', handleDocumentClick);
  els.toc.addEventListener('click', handleDocumentClick);

  store.subscribe(render);
  render(store.getState());
}

init();
