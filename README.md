# Copilot Text To Speech

A simple Chrome browser extension that demonstrates text-to-speech functionality with a "Hello World" example.

## Features

- Simple and clean user interface
- Text-to-speech functionality using the Web Speech API
- "Hello World" demo button
- Visual status feedback

## Installation

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" button
5. Select the directory containing this extension (the folder with `manifest.json`)
6. The extension should now appear in your extensions list

## Usage

1. Click on the extension icon in your Chrome toolbar
2. A popup window will appear with the "Copilot Text To Speech" interface
3. Click the "Say Hello World!" button
4. The extension will use text-to-speech to say "Hello World!"
5. The status will update to show when speaking starts and finishes

## File Structure

```
CopilotTTS/
├── manifest.json      # Extension configuration and metadata
├── popup.html         # Extension popup UI
├── popup.js          # Extension popup logic
├── icons/            # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md         # This file
```

## Development

This is a skeleton/hello-world Chrome extension that can be extended with additional features such as:
- Reading selected text from web pages
- Customizable voice settings
- Speech rate and pitch controls
- Support for multiple languages
- Text input for custom speech

## Requirements

- Google Chrome browser (or Chromium-based browser)
- No external dependencies required

## License

See LICENSE file for details.