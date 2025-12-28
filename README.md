# Copilot Text To Speech

A Chrome browser extension that monitors GitHub Copilot Tasks pages and speaks the AI responses using text-to-speech.

## Features

- Automatically monitors `https://github.com/copilot/tasks/*` pages
- Speaks markdown content from Copilot's responses as they appear
- Navigation controls to skip to previous/next items
- Stop button to halt speaking
- Visual status feedback showing current item position

## How It Works

The extension monitors the DOM of GitHub Copilot Tasks pages for:
1. The `TaskChat-module__stickableContainer--*` node
2. All `Session-module__detailsContainer--*` nodes within it
3. All `markdown-body MarkdownRenderer-module__container--*` paragraphs within each session
4. New sessions and paragraphs added dynamically as the conversation progresses

When new text content is detected, it automatically speaks it using the Web Speech API.

## Installation

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" button
5. Select the directory containing this extension (the folder with `manifest.json`)
6. The extension should now appear in your extensions list

## Usage

1. Navigate to a GitHub Copilot Tasks page (`https://github.com/copilot/tasks/*`)
2. The extension will automatically start monitoring for new content
3. As Copilot responds, the text will be spoken aloud
4. Click the extension icon to access controls:
   - **⏮ Prev**: Go back to the previous item and speak it again
   - **⏹ Stop**: Stop speaking immediately
   - **Next ⏭**: Skip to the next item and speak it
5. The status shows your current position (e.g., "Item 3 of 10")

## File Structure

```
CopilotTTS/
├── manifest.json      # Extension configuration and metadata
├── content.js         # Content script that monitors the page
├── popup.html         # Extension popup UI
├── popup.js          # Extension popup logic
├── copilot.html      # Reference template for DOM structure
├── icons/            # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## Requirements

- Google Chrome browser (or Chromium-based browser)
- Access to GitHub Copilot Tasks
- No external dependencies required

## Development

The extension consists of:
- **Content Script** (`content.js`): Injected into Copilot Tasks pages to monitor DOM and speak text
- **Popup** (`popup.html`, `popup.js`): User interface for navigation controls
- **Manifest** (`manifest.json`): Extension configuration with proper permissions and content script injection

## License

See LICENSE file for details.