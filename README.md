# Drive Path Copier

A lightweight Chrome/Edge extension that lets you quickly copy the full path of files and folders from Google Drive.

Instead of manually recreating folder structures, Drive Path Copier extracts the current Drive location and copies it in a clean, shareable format.

---

## Features

### Copy Full Google Drive Paths

Copy paths such as:

```text
My Drive › Projects › Design Assets › Logo.png
```

### Copy Share Links

Copy the selected file's Google Drive link directly to your clipboard.

### Markdown Support

Optionally copy paths and links in Markdown format:

```markdown
[My Drive › Projects › Design Assets › Logo.png](https://drive.google.com/...)
```

### Keyboard Shortcut

Use:

```text
Ctrl + Shift + L
```

Windows/Linux

```text
Command + Shift + L
```

macOS

to instantly copy the currently selected Drive path.

### Lightweight

* No frameworks
* No React
* No Vue
* No build step
* Plain Vanilla JavaScript

### Privacy First

The extension:

* Does not collect user data
* Does not send data to external servers
* Does not require accounts
* Runs entirely inside the browser

---



# Installation

## Install from Source

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/drive-path-copier.git
```

### 2. Open Extensions Page

Chrome:

```text
chrome://extensions
```

Edge:

```text
edge://extensions
```

### 3. Enable Developer Mode

Toggle:

```text
Developer Mode = ON
```

### 4. Load Extension

Click:

```text
Load unpacked
```

Select the project folder.

---

# Project Structure

```text
drive-path-copier/
│
├── manifest.json
│
├── popup.html
│
├── popup/
│   ├── popup.js
│   └── popup.css
│
├── scripts/
│   ├── content.js
│   └── background.js
│
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
└── README.md
```

---

# How It Works

## Content Script

The content script runs inside Google Drive and:

* Detects selected files/folders
* Reads breadcrumb navigation
* Builds the full path
* Extracts Drive links
* Responds to popup requests

File:

```text
scripts/content.js
```

---

## Popup

The popup provides:

* Current file name
* Current path
* Copy Path button
* Copy Link button
* Markdown mode toggle

Files:

```text
popup.html
popup/popup.js
popup/popup.css
```

---

## Background Service Worker

Responsible for:

* Keyboard shortcut handling
* Content script communication
* Script injection fallback

File:

```text
scripts/background.js
```

---

# Permissions

The extension requires:

| Permission     | Purpose                              |
| -------------- | ------------------------------------ |
| activeTab      | Access current Google Drive tab      |
| scripting      | Inject content scripts when required |
| storage        | Save Markdown preference             |
| clipboardWrite | Copy text to clipboard               |

Host Permission:

```text
https://drive.google.com/*
```

---


# Browser Support

* Google Chrome
* Microsoft Edge
* Brave
* Opera
* Chromium-based browsers

---

# Troubleshooting

## Extension Not Detecting Drive Data

Refresh Google Drive:

```text
Ctrl + F5
```

or

```text
Command + Shift + R
```

Then reload the extension.

---

## Content Script Not Running

Verify:

```text
chrome://extensions
```

or

```text
edge://extensions
```

and ensure:

* Developer Mode is enabled
* Extension is reloaded
* Google Drive tab is refreshed

---

## Keyboard Shortcut Not Working

Open:

```text
chrome://extensions/shortcuts
```

or

```text
edge://extensions/shortcuts
```

Verify:

```text
Copy full Google Drive path
```

is assigned to:

```text
Ctrl + Shift + L
```

---

# Roadmap

Future enhancements:

* Shared Drive support improvements
* Multi-file selection support
* Custom separators
* Custom path formats
* Teams/Notion export formats
* Folder tree preview
* One-click path history

---

# Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

# License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files to deal in the Software without restriction.
