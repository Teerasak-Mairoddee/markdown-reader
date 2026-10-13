// Reading files from the file picker and drag-and-drop.

const MARKDOWN_EXT = /\.(md|markdown|mdown|mkdn|mkd|txt)$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;

const MAX_MARKDOWN_BYTES = 10 * 1024 * 1024;

/**
 * Split files into Markdown documents (read as text) and images.
 * @param {Iterable<File>} files
 * @returns {Promise<{docs: {name: string, text: string}[], images: File[], skipped: string[]}>}
 */
export async function readFiles(files) {
  const docs = [];
  const images = [];
  const skipped = [];

  for (const file of files) {
    if (MARKDOWN_EXT.test(file.name) || file.type === 'text/markdown') {
      if (file.size > MAX_MARKDOWN_BYTES) {
        skipped.push(`${file.name} (too large)`);
        continue;
      }
      docs.push({ name: file.name, text: await file.text() });
    } else if (IMAGE_EXT.test(file.name) || file.type.startsWith('image/')) {
      images.push(file);
    } else {
      skipped.push(file.name);
    }
  }

  docs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return { docs, images, skipped };
}

/** Wire an <input type="file"> to a callback receiving the selected files. */
export function bindFileInput(input, onFiles) {
  input.addEventListener('change', () => {
    if (input.files?.length) onFiles([...input.files]);
    input.value = ''; // allow re-selecting the same file
  });
}

/**
 * Accept files dropped anywhere on the page.
 * @param {HTMLElement} overlay shown while files are dragged over the window
 */
export function bindDropTarget(overlay, onFiles) {
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer?.types?.includes('Files');

  window.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (depth++ === 0) overlay.hidden = false;
  });

  window.addEventListener('dragover', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('dragleave', (e) => {
    if (!hasFiles(e)) return;
    if (--depth <= 0) {
      depth = 0;
      overlay.hidden = true;
    }
  });

  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    overlay.hidden = true;
    if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
  });
}
