// Fallback PDF generation for browsers without a working print dialog
// (in-app browsers on phones, some webviews). Renders the readable view to a
// PDF file in the browser with html2pdf.js, which is loaded only when needed.
// Pages are images of the document, so the browser print path stays preferred.

import { useLightCodeTheme } from './theme.js';

const LIBRARY_URL = new URL('../../vendor/html2pdf/html2pdf.bundle.min.js', import.meta.url).href;

let libraryPromise = null;

function loadLibrary() {
  libraryPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LIBRARY_URL;
    script.onload = () => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error('html2pdf missing')));
    script.onerror = () => {
      libraryPromise = null;
      reject(new Error('Could not load the PDF library'));
    };
    document.head.append(script);
  });
  return libraryPromise;
}

/**
 * Build a PDF of the document element.
 * @param {HTMLElement} documentEl the rendered Markdown
 * @returns {Promise<Blob>}
 */
export async function createPdf(documentEl) {
  const html2pdf = await loadLibrary();

  // Render a light-themed copy at A4 width, away from the visible page.
  const stage = document.createElement('div');
  stage.className = 'pdf-stage';
  const copy = documentEl.cloneNode(true);
  copy.removeAttribute('id');
  copy.removeAttribute('hidden');
  copy.className = 'markdown-body pdf-export';
  for (const d of copy.querySelectorAll('details')) d.open = true;
  keepHeadingsWithNext(copy);
  stage.append(copy);
  document.body.append(stage);
  useLightCodeTheme(true);

  try {
    return await html2pdf()
      .set({
        margin: [15, 14, 15, 14],
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['.pdf-keep', 'pre', 'blockquote', 'table', 'img', 'tr', 'li'],
        },
      })
      .from(copy)
      .outputPdf('blob');
  } finally {
    useLightCodeTheme(false);
    stage.remove();
  }
}

/** Wrap each heading with the block after it so a page never ends on a heading. */
function keepHeadingsWithNext(root) {
  for (const heading of root.querySelectorAll(':scope > :is(h1, h2, h3, h4, h5, h6)')) {
    const next = heading.nextElementSibling;
    const group = document.createElement('div');
    group.className = 'pdf-keep';
    heading.replaceWith(group);
    group.append(heading);
    if (next && !/^H[1-6]$/.test(next.tagName)) group.append(next);
  }
}

/**
 * Offer the PDF to the user: start a download, and return an object URL the
 * caller can show as a link for browsers that ignore downloads.
 */
export function deliverPdf(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  return url;
}
