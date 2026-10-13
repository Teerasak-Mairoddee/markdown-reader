// Markdown -> sanitized DOM, with heading ids, code highlighting and local images.

import { Marked } from '../../vendor/marked/marked.esm.js';
import DOMPurify from '../../vendor/dompurify/purify.es.mjs';
import hljs from '../../vendor/highlight/highlight.min.js';

export const HEADING_ID_PREFIX = 'md-';

const marked = new Marked({ gfm: true, breaks: false });

hljs.configure({ ignoreUnescapedHTML: true });

// Open external links in a new tab without giving it access to this page.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && /^https?:/i.test(node.getAttribute('href') ?? '')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    // In print, show the URL after links whose text does not already show it.
    const href = node.getAttribute('href');
    const text = node.textContent.trim();
    if (text && text !== href && !node.querySelector('img')) node.classList.add('print-url');
  }
});

const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/**
 * @param {string} markdown
 * @param {{resolveAsset: (name: string) => string | null}} options
 * @returns {{fragment: DocumentFragment, headings: {id: string, slug: string, text: string, level: number}[]}}
 */
export function renderMarkdown(markdown, { resolveAsset }) {
  const html = marked.parse(stripFrontMatter(markdown));

  const fragment = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    // Prefix user ids/names so raw HTML cannot clobber the app's own elements.
    SANITIZE_NAMED_PROPS: true,
    ADD_ATTR: ['target'],
  });

  const headings = addHeadingIds(fragment);
  resolveImages(fragment, resolveAsset);
  highlightCode(fragment);

  return { fragment, headings };
}

function stripFrontMatter(text) {
  return text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\r?\n/, '');
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function addHeadingIds(root) {
  const used = new Map();
  const headings = [];

  for (const el of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const text = el.textContent.trim();
    const base = slugify(text) || 'section';
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const slug = count ? `${base}-${count}` : base;

    el.id = HEADING_ID_PREFIX + slug;

    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${slug}`;
    anchor.setAttribute('aria-label', `Link to "${text}"`);
    anchor.textContent = '#';
    el.append(anchor);

    headings.push({ id: el.id, slug, text, level: Number(el.tagName[1]) });
  }

  return headings;
}

function resolveImages(root, resolveAsset) {
  for (const img of root.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (!src || ABSOLUTE_URL.test(src)) continue;

    const name = fileNameFromPath(src);
    const url = resolveAsset(name);
    if (url) {
      img.src = url;
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'missing-image';
      placeholder.title = 'Open this image together with the Markdown file to show it here.';
      placeholder.textContent = `Image not loaded: ${img.getAttribute('alt') || name}`;
      img.replaceWith(placeholder);
    }
  }
}

export function fileNameFromPath(path) {
  const clean = path.split(/[?#]/)[0];
  const last = clean.split('/').pop() ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function highlightCode(root) {
  for (const code of root.querySelectorAll('pre > code')) {
    const lang = [...code.classList].find((c) => c.startsWith('language-'))?.slice(9);
    if (lang && hljs.getLanguage(lang)) {
      hljs.highlightElement(code);
    } else {
      code.classList.add('hljs');
    }
  }
}
