// "Save as PDF" opens the browser's print dialog on the readable view
// (see print.css). While printing, the page title is set to the document's
// name so the suggested PDF file name matches it, and collapsed <details>
// are expanded so their content is not lost. This also covers Ctrl/Cmd+P.

export function initPrint(button, documentEl, getFileName) {
  let savedTitle = null;
  let expanded = [];

  window.addEventListener('beforeprint', () => {
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

  button.addEventListener('click', () => window.print());
}
