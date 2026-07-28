// ==========================================
// Drive Path Copier - Content Script
// ==========================================

// --- Utility Functions --- //

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function uniqueNonEmpty(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

function cleanName(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  return normalized.split(",")[0].trim();
}

// --- DOM Extraction Strategies --- //

function getSelectedItem() {
  return (
    document.querySelector('[role="row"][aria-selected="true"]') ||
    document.querySelector('[aria-selected="true"][data-id]') ||
    document.querySelector('[aria-selected="true"]')
  );
}

function getSelectedFileName() {
  const selected = getSelectedItem();

  if (!selected) {
    return null;
  }

  const textCandidates = [
    selected.querySelector('[data-tooltip]')?.getAttribute('data-tooltip'),
    selected.querySelector('[data-tooltip]')?.textContent,
    selected.getAttribute('aria-label'),
    selected.querySelector('[aria-label]')?.getAttribute('aria-label'),
    selected.querySelector('[data-name]')?.getAttribute('data-name'),
    selected.textContent
  ];

  for (const candidate of textCandidates) {
    const cleaned = cleanName(candidate);

    if (
      cleaned &&
      !cleaned.toLowerCase().includes("drive for")
    ) {
      return cleaned;
    }
  }

  return null;
}

function getBreadcrumbs() {
  const crumbs = [];

  const pathElements = document.querySelectorAll(
    'nav[aria-label*="Breadcrumb"] button, ' +
    'nav[aria-label*="breadcrumb"] a, ' +
    'nav[aria-label*="Breadcrumb"] a, ' +
    '[role="navigation"] button[aria-label], ' +
    'div[data-location-path] button'
  );

  pathElements.forEach((el) => {
    const text = cleanName(
      el.textContent ||
      el.getAttribute("aria-label")
    );

    if (
      text &&
      !text.toLowerCase().includes("drive for") &&
      !text.includes("@")
    ) {
      crumbs.push(text);
    }
  });

  if (crumbs.length > 0) {
    return uniqueNonEmpty(crumbs);
  }

  const pageTitle = document.title
    .replace("- Google Drive", "")
    .trim();

  if (
    pageTitle &&
    pageTitle !== "Google Drive"
  ) {
    crumbs.push(
      "My Drive",
      pageTitle
    );
  } else {
    crumbs.push("My Drive");
  }

  return uniqueNonEmpty(crumbs);
}

function getSelectedFileLink() {
  const selected = getSelectedItem();

  if (!selected) {
    return window.location.href;
  }

  const directLink =
    selected.querySelector(
      'a[href*="/file/d/"]'
    )?.href;

  if (directLink) {
    return directLink;
  }

  const dataId =
    selected.getAttribute('data-id') ||
    selected.dataset?.id;

  if (dataId) {
    return `https://drive.google.com/file/d/${dataId}/view`;
  }

  return window.location.href;
}

function buildFullPathString() {
  const fileName = getSelectedFileName();

  let breadcrumbs = getBreadcrumbs();

  if (
    fileName &&
    breadcrumbs[breadcrumbs.length - 1] === fileName
  ) {
    breadcrumbs.pop();
  }

  const fullPathArray =
    fileName
      ? [...breadcrumbs, fileName]
      : breadcrumbs;

  return fullPathArray.join(' › ');
}

// --- Keyboard Shortcut Support --- //

window.addEventListener(
  'keydown',
  (event) => {

    const isMac =
      navigator.platform
        .toUpperCase()
        .includes('MAC');

    const modifierPressed =
      isMac
        ? event.metaKey
        : event.ctrlKey;

    if (
      modifierPressed &&
      event.shiftKey &&
      event.code === 'KeyL'
    ) {

      event.preventDefault();
      event.stopPropagation();

      const fullPath =
        buildFullPathString();

      if (fullPath) {

        navigator.clipboard
          .writeText(fullPath)
          .then(() => {
            console.log(
              'Drive Path Copied:',
              fullPath
            );
          })
          .catch((err) => {
            console.error(
              'Clipboard write failed:',
              err
            );
          });
      }
    }
  },
  true
);

// --- Extension Messaging --- //

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {

    if (
      request.action ===
      'EXECUTE_COPY_PATH'
    ) {

      const fullPath =
        buildFullPathString();

      if (fullPath) {

        navigator.clipboard
          .writeText(fullPath)
          .then(() => {
            sendResponse({
              ok: true,
              path: fullPath
            });
          })
          .catch((err) => {
            sendResponse({
              ok: false,
              error: err.message
            });
          });

      } else {

        sendResponse({
          ok: false,
          error: 'No item selected'
        });
      }

      return true;
    }

    if (
      request.action ===
      'GET_DATA'
    ) {

      setTimeout(() => {

        const fileName =
          getSelectedFileName();

        let breadcrumbs =
          getBreadcrumbs();

        if (
          fileName &&
          breadcrumbs[
            breadcrumbs.length - 1
          ] === fileName
        ) {
          breadcrumbs.pop();
        }

        const fullPath =
          buildFullPathString();

        sendResponse({
          ok: Boolean(
            fileName ||
            breadcrumbs.length
          ),
          fileName:
            fileName ||
            (
              breadcrumbs.length
                ? breadcrumbs[
                    breadcrumbs.length - 1
                  ]
                : ''
            ),
          breadcrumbs,
          path: fullPath,
          link: getSelectedFileLink()
        });

      }, 150);

      return true;
    }
  }
);