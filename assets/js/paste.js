// "Paste": a dialog to paste or type Markdown, then download it as a .md
// file or open it in the reader. The draft stays in the dialog until the
// page is reloaded, so closing it by accident loses nothing.

import { deliverFile } from './download.js';

/** Turn whatever was typed into a safe "name.md" file name. */
export function toMarkdownFileName(raw) {
  const base = raw
    .trim()
    .replace(/\.(md|markdown|mdown|mkdn|mkd|txt)$/i, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
    .replace(/\s*-[\s-]*/g, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '');
  return `${base || 'untitled'}.md`;
}

/** Use the first heading as a name suggestion when the name is still the default. */
function suggestName(text) {
  const match = /^#{1,6}[ \t]+(.+?)[ \t#]*$/m.exec(text);
  if (!match) return null;
  return match[1].replace(/[*_`[\]]/g, '').trim().slice(0, 60) || null;
}

/**
 * @param {object} options
 * @param {HTMLElement[]} options.openers buttons that open the dialog
 * @param {(doc: {name: string, text: string}) => void} options.onPreview
 * @param {(message: string, link?: {href: string, label: string, download?: string}) => void} options.notify
 */
export function initPaste({ openers, onPreview, notify }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('paste-dialog');
  const nameInput = $('paste-name');
  const textArea = $('paste-text');
  const clipboardBtn = $('paste-clipboard');

  // Stop renaming from the first heading once the user picks a name.
  let nameTouched = false;

  const open = () => {
    dialog.showModal();
    textArea.focus();
  };

  const draft = () => {
    const text = textArea.value;
    if (!text.trim()) {
      notify('Paste or type some Markdown first.');
      textArea.focus();
      return null;
    }
    return { name: toMarkdownFileName(nameInput.value), text };
  };

  for (const btn of openers) btn.addEventListener('click', open);
  $('paste-close').addEventListener('click', () => dialog.close());

  // Clicking the backdrop (outside the form) closes the dialog.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  nameInput.addEventListener('input', () => { nameTouched = true; });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); textArea.focus(); }
  });

  textArea.addEventListener('input', () => {
    if (nameTouched) return;
    const suggestion = suggestName(textArea.value);
    if (suggestion) nameInput.value = toMarkdownFileName(suggestion).slice(0, -3);
  });

  $('paste-preview').addEventListener('click', () => {
    const doc = draft();
    if (!doc) return;
    dialog.close();
    onPreview(doc);
  });

  $('paste-download').addEventListener('click', () => {
    const doc = draft();
    if (!doc) return;
    const blob = new Blob([doc.text], { type: 'text/markdown;charset=utf-8' });
    const url = deliverFile(blob, doc.name);
    notify(`Downloading ${doc.name}. If nothing happens,`, { href: url, label: 'open the file', download: doc.name });
  });

  // Reading the clipboard needs a secure context and isn't offered everywhere.
  if (navigator.clipboard?.readText) {
    clipboardBtn.hidden = false;
    clipboardBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) { notify('The clipboard is empty.'); return; }
        const { selectionStart: start, selectionEnd: end, value } = textArea;
        textArea.value = value.slice(0, start) + text + value.slice(end);
        textArea.dispatchEvent(new Event('input'));
        textArea.focus();
      } catch {
        notify('Clipboard access was blocked. Long-press the text box and choose Paste.');
      }
    });
  }
}
