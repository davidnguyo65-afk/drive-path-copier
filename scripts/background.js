if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === "copy-path-shortcut") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.id) return;

        // Message the active content script to execute copy logic
        chrome.tabs.sendMessage(activeTab.id, { action: "EXECUTE_COPY_PATH" }, (response) => {
          // If content script is disconnected, attempt dynamic script injection
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['scripts/content.js']
            }).then(() => {
              // Retry dispatch after script initialization
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, { action: "EXECUTE_COPY_PATH" });
              }, 100);
            }).catch((err) => {
              console.warn("Drive Path Copier: Cannot execute script on this tab.", err);
            });
          }
        });
      });
    }
  });
}