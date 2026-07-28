// DOM Element References
let copyPathBtn, copyLinkBtn, markdownToggle, toggleStatusLabel, fileNameEl, breadcrumbEl, syncStatusEl;

// 1. Initialize State, References & Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Bind DOM References after HTML is fully parsed
  copyPathBtn = document.getElementById('copyPathBtn');
  copyLinkBtn = document.getElementById('copyLinkBtn');
  markdownToggle = document.getElementById('markdownToggle');
  toggleStatusLabel = document.getElementById('toggleStatusLabel');

  fileNameEl = document.querySelector('.file-name');
  breadcrumbEl = document.querySelector('.breadcrumb');
  syncStatusEl = document.querySelector('.sync-status span');

  // Load saved Markdown setting from chrome.storage
  if (chrome.storage && chrome.storage.local && markdownToggle) {
    chrome.storage.local.get(['useMarkdown'], (result) => {
      const isChecked = Boolean(result.useMarkdown);
      markdownToggle.checked = isChecked;
      updateToggleLabel(isChecked);
    });
  }

  // Attach Event Listeners safely
  markdownToggle?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    updateToggleLabel(isChecked);

    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ useMarkdown: isChecked });
    }
  });

  copyPathBtn?.addEventListener('click', handleCopyPath);
  copyLinkBtn?.addEventListener('click', handleCopyLink);

  // Load current Drive data on popup open
  await refreshDriveInfo();
});

function updateToggleLabel(isChecked) {
  if (toggleStatusLabel) {
    toggleStatusLabel.textContent = isChecked ? 'ON' : 'OFF';
  }
}

// 2. Drive Data & Tab Communication
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

// Self-healing communication handler
async function requestDriveData(tabId) {
  return new Promise((resolve, reject) => {

    // First attempt normal communication
    chrome.tabs.sendMessage(
      tabId,
      { action: 'GET_DATA' },
      async (response) => {

        // Content script missing/disconnected
        if (chrome.runtime.lastError) {

          console.warn(
            'Initial message failed. Attempting content script injection...',
            chrome.runtime.lastError
          );

          try {

            // IMPORTANT:
            // Updated path after refactor
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['scripts/content.js']
            });

            // Give script time to initialize
            await new Promise((r) => setTimeout(r, 150));

            // Retry communication
            chrome.tabs.sendMessage(
              tabId,
              { action: 'GET_DATA' },
              (retryResponse) => {

                if (chrome.runtime.lastError) {

                  console.error(
                    'Retry message failed:',
                    chrome.runtime.lastError
                  );

                  reject(
                    new Error(
                      'Please refresh the Google Drive page and try again.'
                    )
                  );

                  return;
                }

                if (!retryResponse) {
                  reject(
                    new Error(
                      'Google Drive page did not return any data.'
                    )
                  );

                  return;
                }

                resolve(retryResponse);
              }
            );

          } catch (err) {

            console.error(
              'Content script injection failed:',
              err
            );

            reject(
              new Error(
                `Content script injection failed: ${err.message}`
              )
            );
          }

          return;
        }

        if (!response) {
          reject(
            new Error(
              'No response received from Google Drive page.'
            )
          );

          return;
        }

        resolve(response);
      }
    );
  });
}

// Helper to construct the full path with the ' › ' separator
function buildFullPath(data) {

  if (
    Array.isArray(data.breadcrumbs) &&
    data.breadcrumbs.length > 0
  ) {

    const cleanBreadcrumbs =
      data.breadcrumbs.filter(Boolean);

    // Append file name if not already included
    if (
      data.fileName &&
      cleanBreadcrumbs[cleanBreadcrumbs.length - 1] !== data.fileName
    ) {
      cleanBreadcrumbs.push(data.fileName);
    }

    return cleanBreadcrumbs.join(' › ');
  }

  if (data.path) {
    return data.path.replace(/\s*[\/\>]\s*/g, ' › ');
  }

  return data.fileName || '';
}

// Fetch and update dynamic UI elements
async function refreshDriveInfo() {

  try {

    const tab = await getActiveTab();

    if (!tab?.id) {
      return;
    }

    const data = await requestDriveData(tab.id);

    if (!data.ok) {
      return;
    }

    if (data.fileName && fileNameEl) {
      fileNameEl.textContent = data.fileName;
    }

    if (
      data.breadcrumbs &&
      Array.isArray(data.breadcrumbs) &&
      breadcrumbEl
    ) {

      breadcrumbEl.innerHTML =
        data.breadcrumbs
          .map(
            (folder) =>
              `<span>${escapeHtml(folder)}</span>`
          )
          .join(
            ' <span class="sep">&rsaquo;</span> '
          );
    }

    if (syncStatusEl) {
      syncStatusEl.textContent =
        'Synced just now';
    }

  } catch (err) {

    console.error(
      'Failed to load Drive information:',
      err
    );

    if (syncStatusEl) {
      syncStatusEl.textContent =
        'Select an item in Google Drive';
    }
  }
}

// 3. Action Handlers
async function handleCopyPath() {

  try {

    const tab = await getActiveTab();

    if (!tab?.id) {
      alert('Could not detect active tab.');
      return;
    }

    const data = await requestDriveData(tab.id);

    const fullPath = buildFullPath(data);

    if (!fullPath) {
      alert(
        'No selected file detected. Select one file and try again.'
      );
      return;
    }

    let textToCopy = fullPath;

    // Markdown formatting
    if (
      markdownToggle?.checked &&
      data.link
    ) {
      textToCopy =
        `[${fullPath}](${data.link})`;
    }

    await navigator.clipboard.writeText(
      textToCopy
    );

    if (copyPathBtn) {

      const originalText =
        copyPathBtn.innerText;

      copyPathBtn.innerText =
        'Copied Path!';

      setTimeout(() => {
        copyPathBtn.innerText =
          originalText;
      }, 1500);
    }

  } catch (error) {

    console.error(error);

    alert(
      `Error: ${error.message}`
    );
  }
}

async function handleCopyLink() {

  try {

    const tab = await getActiveTab();

    if (!tab?.id) {
      alert('Could not detect active tab.');
      return;
    }

    const data = await requestDriveData(tab.id);

    if (!data.link) {
      alert(
        'Could not retrieve share link.'
      );
      return;
    }

    let textToCopy = data.link;

    // Markdown formatting
    if (markdownToggle?.checked) {

      const label =
        data.fileName || 'File Link';

      textToCopy =
        `[${label}](${data.link})`;
    }

    await navigator.clipboard.writeText(
      textToCopy
    );

    if (copyLinkBtn) {

      const originalText =
        copyLinkBtn.innerText;

      copyLinkBtn.innerText =
        'Copied Link!';

      setTimeout(() => {
        copyLinkBtn.innerText =
          originalText;
      }, 1500);
    }

  } catch (error) {

    console.error(error);

    alert(
      `Error: ${error.message}`
    );
  }
}

// Utilities
function escapeHtml(str) {

  if (!str) {
    return '';
  }

  return str.replace(
    /[&<>"']/g,
    (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m])
  );
}