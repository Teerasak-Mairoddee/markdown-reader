// Saving a generated file (PDF, Markdown) to the user's device.

/**
 * Offer a file to the user: start a download, and return an object URL the
 * caller can show as a link for browsers that ignore downloads.
 */
export function deliverFile(blob, fileName) {
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
