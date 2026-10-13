---
title: Welcome
---

# Welcome to Markdown Reader

Open any `.md` file to read it as a clean, formatted document, then press
**Save as PDF** to print exactly what you see.

## Getting started

1. Click **Open** in the toolbar, or drag files anywhere onto the page.
2. Pick a file from the sidebar to switch between documents.
3. Press **Save as PDF** and choose *Save as PDF* as the destination in the print dialog.

> Tip: if your Markdown references local images like `![diagram](images/diagram.png)`,
> drop the image files together with the `.md` file and they will show up inline.

## What is supported

- GitHub Flavored Markdown: tables, task lists, ~~strikethrough~~ and autolinks like https://github.com
- Syntax highlighting for fenced code blocks
- Inline HTML (sanitized), e.g. <kbd>Ctrl</kbd> + <kbd>P</kbd>
- A table of contents built from the headings

### Task list

- [x] Render Markdown
- [x] Print to PDF
- [ ] Read your own document

### Table

| Feature        | Screen | PDF |
| -------------- | :----: | :-: |
| Dark mode      |  Yes   | Always light |
| Code wrapping  | Scroll | Wraps |
| Link URLs      | Hidden | Shown after the link |

### Code

```js
import { renderMarkdown } from './renderer.js';

const { fragment, headings } = renderMarkdown('# Hello', {
  resolveAsset: (name) => null,
});
console.log(headings); // [{ id: 'md-hello', text: 'Hello', level: 1 }]
```

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

<details>
<summary>Privacy</summary>

Everything happens in your browser. Files are never uploaded to a server,
and closing the tab clears them.

</details>

---

Jump back to [Getting started](#getting-started).
