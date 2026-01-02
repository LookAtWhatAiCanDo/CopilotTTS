# Copilot Text To Speech

A Chrome browser extension that monitors GitHub Copilot Tasks pages and speaks the AI responses using text-to-speech.

## Features

- Automatically monitors `https://github.com/copilot/tasks/*` pages
- Speaks markdown content from Copilot's responses as they appear
- Visual highlighting of the element currently being spoken
- Navigation controls: Previous, Pause/Play, Next
- Progress slider to jump to any item in the conversation
- Test Speak button to verify speech functionality
- **Speech verbosity control** with three levels:
  - **All**: Speaks all content including tool execution logs
  - **Highlights & Summary** (default): Speaks Copilot responses and summaries, excludes tool logs
  - **Summary Only**: Speaks only final summary messages from Copilot
- **New Only mode** (checkbox, enabled by default): Skip pre-existing content and only speak new content that appears after extension loads
- **Debug Mode** (checkbox, disabled by default): Shows element class names on hover for troubleshooting and understanding content structure
- Adjustable speech rate (0.5x to 2x, default 1.2x)
- Adjustable speech pitch (0.5x to 2x, default 1.0x)
- Speech queue with 2-second delays between items for better pacing
- Persistent settings saved across sessions
- Visual status feedback showing current item position

## How It Works

The extension monitors the DOM of GitHub Copilot Tasks pages for:
1. The `TaskChat-module__stickableContainer--*` node
2. All `Session-module__detailsContainer--*` nodes within it
3. All `MarkdownRenderer-module__container--*` elements within Copilot responses and messages
4. Status messages with shimmer effects (`WithShimmerEffect-module__shimmerText--*`)
5. New sessions and content added dynamically as the conversation progresses

The extension filters content based on the selected **Speech Verbosity** level:
- **All**: Speaks all markdown content, including tool execution logs within `Tool-module__detailsContainer--*`
- **Highlights & Summary** (default): Speaks Copilot responses from `SessionLogs-module__markdownWrapper--*` and summary messages from `CopilotMessage-module__container--*`, but excludes tool logs
- **Summary Only**: Only speaks summary messages from `CopilotMessage-module__container--*`

The **New Only** checkbox (enabled by default) controls whether to skip pre-existing content:
- When checked: Only speaks content that appears after the extension loads (2-second grace period)
- When unchecked: Speaks all content found on the page, including what was already there

When new text content is detected, it is queued for speaking. After the first user interaction (click or keypress), items are spoken automatically using the Web Speech API with:
- A 2-second delay between items for better pacing
- Visual highlighting (yellow background) on the element currently being spoken
- Configurable speech rate and pitch settings saved across sessions

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
3. **Click anywhere on the page** to enable speech (required by browser security)
4. As Copilot responds, the text will be spoken aloud automatically with visual highlighting
5. Click the extension icon to access controls:
   - **⏮ Prev**: Go back to the previous item and speak it again
   - **⏸ Pause / ▶ Play**: Pause or resume speaking
   - **Next ⏭**: Skip to the next item and speak it
   - **Progress Slider**: Jump to any specific item in the conversation
   - **🔊 Test Speak**: Test the speech synthesis
   - **Speech Verbosity**: Control what content is spoken
     - **All**: Speaks everything including tool execution logs
     - **Highlights & Summary**: Speaks Copilot responses and summaries (default)
     - **Summary Only**: Speaks only final summary messages
   - **New Only**: Checkbox to skip pre-existing content (enabled by default)
   - **Debug Mode**: Checkbox to show element class names on hover (disabled by default, useful for troubleshooting)
   - **Speed Slider**: Adjust speech rate (0.5x to 2x, default 1.2x)
   - **Pitch Slider**: Adjust speech pitch (0.5x to 2x, default 1.0x)
6. The status shows your current position (e.g., "Item 3 of 10")

**Note:** The extension requires a user interaction (click or keypress) before it can speak. This is a browser security requirement. Once you interact with the page, all queued content will be spoken automatically with a 2-second delay between items. Elements being spoken are highlighted with a yellow background.

## Debug Mode

The **Debug Mode** feature helps understand what content is being spoken and troubleshoot issues by showing element class names on hover.

**To enable Debug Mode:**
1. Click the extension icon to open the popup
2. Check the "Debug Mode (show class names on hover)" checkbox
3. Close the popup and hover over any div element on the page

**Features:**
- Shows native browser tooltips with element class names when hovering over divs
- Displays `<div> (no classes)` for elements without classes
- Helps identify key containers like:
  - `TaskChat-module__stickableContainer--*`
  - `Session-module__detailsContainer--*`
  - `MarkdownRenderer-module__container--*`
  - `Tool-module__detailsContainer--*`
- Automatically applies to dynamically added content
- Setting persists across page reloads and browser sessions

**Use Cases:**
- Understanding GitHub Copilot's DOM structure
- Troubleshooting speech issues (e.g., why certain content is/isn't spoken)
- Identifying which elements are being targeted for speech
- Debugging the extension's behavior with new GitHub UI updates

## File Structure

```
CopilotTTS/
├── manifest.json      # Extension configuration and metadata
├── content.js         # Content script that monitors the page
├── popup.html         # Extension popup UI
├── popup.js           # Extension popup logic
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── seeds/             # Sample Copilot Tasks HTML pages for testing
│   ├── copilot_task1.html
│   └── copilot_task2.html
├── README.md          # This file
└── TESTING.md         # Testing guide
```

## Requirements

- Google Chrome browser (or Chromium-based browser)
- Access to GitHub Copilot Tasks
- No external dependencies required

## Development

The extension consists of:
- **Content Script** (`content.js`): Injected into Copilot Tasks pages to monitor DOM, queue speech items, and speak text with visual highlighting
- **Popup** (`popup.html`, `popup.js`): User interface for navigation controls, progress slider, test button, and speech settings
- **Manifest** (`manifest.json`): Extension configuration with proper permissions and content script injection

### Key Features
- **Speech Queue**: Items are queued and spoken sequentially with 2-second delays
- **Visual Feedback**: Yellow highlighting indicates which element is currently being spoken
- **User Interaction Requirement**: Complies with browser autoplay policies by requiring initial user interaction
- **Persistent Settings**: Speech rate and pitch preferences are saved using chrome.storage.sync
- **Smart Content Filtering**: Only speaks Copilot responses and status messages, excludes tool execution logs

## License

See LICENSE file for details.