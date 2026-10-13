// "Save as PDF": opens the browser's print dialog on the readable view
// (see print.css). While printing, the page title is set to the document's
// name so the suggested PDF file name matches it, and collapsed <details>
// are expanded so their content is not lost. This also covers Ctrl/Cmd+P.
//
// Some browsers, notably in-app browsers on phones, ignore window.print().
// When no print dialog opens, a PDF file is generated and downloaded instead.

import { createPdf } from './pdf-export.js';
import { deliverFile } from './download.js';

const PRINT_TIMEOUT_MS = 1200;

/**
 * @param {object} options
 * @param {HTMLButtonElement} options.button
 * @param {HTMLElement} options.documentEl
 * @param {() => string | null} options.getFileName name of the open document, if any
 * @param {(message: string, link?: {href: string, label: string, download?: string}) => void} options.notify
 */
export function initPrint({ button, documentEl, getFileName, notify }) {
  let savedTitle = null;
  let expanded = [];
  let printStarted = false;
  let busy = false;

  const pdfName = () => `${(getFileName() ?? 'document').replace(/\.[^.]+$/, '')}.pdf`;

  window.addEventListener('beforeprint', () => {
    printStarted = true;
    const name = getFileName();
    if (!name || savedTitle !== null) return;
    savedTitle = document.title;
    document.title = name.replace(/\.[^.]+$/, '') || savedTitle;

    expanded = [...documentEl.querySelectorAll('details:not([open])')];
    for (const d of expanded) d.open = true;
  });

  window.addEventListener('afterprint', () => {
    if (savedTitle !== null) document.title = savedTitle;
    savedTitle = null;
    for (const d of expanded) d.open = false;
    expanded = [];
  });

  async function downloadPdf() {
    busy = true;
    button.setAttribute('aria-busy', 'true');
    notify('Creating PDF…');
    try {
      const blob = await createPdf(documentEl);
      const name = pdfName();
      const url = deliverFile(blob, name);
      notify('PDF ready. If it did not download,', { href: url, label: 'open the PDF', download: name });
    } catch (err) {
      console.error(err);
      notify('Could not create the PDF. Try opening this page in Safari or Chrome.');
    } finally {
      busy = false;
      button.removeAttribute('aria-busy');
    }
  }

  button.addEventListener('click', () => {
    if (busy) return;
    if (!getFileName()) {
      notify('Open a Markdown file first.');
      return;
    }

    printStarted = false;
    let printAvailable = typeof window.print === 'function';
    if (printAvailable) {
      try {
        window.print();
      } catch {
        printAvailable = false;
      }
    }

    // Desktop browsers block inside print() and have fired beforeprint by now.
    // Elsewhere, wait briefly for a dialog before falling back to a file.
    if (printStarted) return;
    if (!printAvailable) {
      downloadPdf();
      return;
    }
    setTimeout(() => {
      if (!printStarted) downloadPdf();
    }, PRINT_TIMEOUT_MS);
  });
}
