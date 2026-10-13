// DOM updates for the sidebar, table of contents, document area and toasts.

const $ = (id) => document.getElementById(id);

const els = {
  docName: $('doc-name'),
  fileList: $('file-list'),
  fileListEmpty: $('file-list-empty'),
  tocSection: $('toc-section'),
  toc: $('toc'),
  dropzone: $('dropzone'),
  document: $('document'),
  pdfBtn: $('pdf-btn'),
  sidebar: $('sidebar'),
  sidebarToggle: $('sidebar-toggle'),
  toast: $('toast'),
};

export { els };

export function renderFileList(docs, activeId, { onOpen, onRemove }) {
  els.fileList.replaceChildren(
    ...docs.map((doc) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.setAttribute('aria-current', String(doc.id === activeId));

      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'file-item__open';
      open.textContent = doc.name;
      open.title = doc.name;
      open.addEventListener('click', () => onOpen(doc.id));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn file-item__remove';
      remove.setAttribute('aria-label', `Close ${doc.name}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      remove.addEventListener('click', () => onRemove(doc.id));

      li.append(open, remove);
      return li;
    }),
  );
  els.fileListEmpty.hidden = docs.length > 0;
}

export function renderToc(headings) {
  const items = headings.filter((h) => h.level <= 3);
  els.tocSection.hidden = items.length < 2;

  const ul = document.createElement('ul');
  for (const h of items) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${h.slug}`;
    a.textContent = h.text;
    a.className = `toc--h${h.level}`;
    a.title = h.text;
    li.append(a);
    ul.append(li);
  }
  els.toc.replaceChildren(ul);
}

export function showDocument(name, fragment) {
  els.document.replaceChildren(fragment);
  els.document.hidden = false;
  els.dropzone.hidden = true;
  els.docName.textContent = name;
  els.pdfBtn.disabled = false;
}

export function showEmpty() {
  els.document.replaceChildren();
  els.document.hidden = true;
  els.dropzone.hidden = false;
  els.docName.textContent = '';
  els.pdfBtn.disabled = true;
  renderToc([]);
}

export function setSidebarOpen(open) {
  els.sidebar.classList.toggle('is-open', open);
  els.sidebarToggle.setAttribute('aria-expanded', String(open));
}

let toastTimer;
export function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 4000);
}
