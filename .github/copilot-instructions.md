# Copilot Instructions for CopilotTTS

## Repository Overview

This repository contains a Chrome browser extension (Manifest V3) that monitors GitHub Copilot Tasks pages and speaks AI responses using text-to-speech. The extension is written in vanilla JavaScript with no build process or external dependencies.

**Purpose**: Provide audio feedback for GitHub Copilot task conversations with visual highlighting of content being spoken.

## Project Type and Architecture

- **Type**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript (ES6+)
- **Dependencies**: None (uses Web APIs only)
- **Build System**: None required - pure client-side code
- **Target Environment**: Chrome/Chromium browsers with Web Speech API support

### Key Technologies
- **Chrome Extension APIs**: `chrome.runtime`, `chrome.storage`, `chrome.tabs`, `chrome.scripting`
- **Web Speech API**: `window.speechSynthesis` for text-to-speech
- **DOM APIs**: `MutationObserver` for monitoring page changes
- **Storage**: `chrome.storage.sync` for persisting user preferences

## File Structure

```
CopilotTTS/
├── .github/           # GitHub-specific files
│   └── copilot-instructions.md  # Instructions for GitHub Copilot agents
├── manifest.json      # Extension configuration (Manifest V3)
├── content.js         # Content script injected into Copilot Tasks pages
├── popup.html         # Extension popup UI (navigation controls)
├── popup.js           # Popup logic and message passing
├── icons/             # Extension icons (16px, 48px, 128px)
├── seeds/             # Sample HTML pages for manual testing
├── README.md          # User documentation
├── TESTING.md         # Comprehensive testing guide
├── LICENSE            # MIT License
└── .gitignore         # Excludes editor files, OS files, build artifacts
```

### Core Components

1. **manifest.json**: Extension configuration
   - Manifest version 3
   - Content script injected on `https://github.com/copilot/tasks/*`
   - Permissions: `activeTab`, `scripting`, `storage`
   - Runs at `document_idle` for better performance

2. **content.js**: Main logic (~740 lines)
   - Monitors GitHub Copilot Tasks page DOM
   - Extracts text from markdown containers
   - Manages speech queue with 2-second delays
   - Handles user interaction requirements
   - Provides visual highlighting (yellow background)
   - Excludes tool execution logs from speech

3. **popup.js/popup.html**: User interface
   - Navigation controls (Previous, Play/Pause, Next)
   - Progress slider for jumping to items
   - Test Speak button for verification
   - Speech rate control (0.5x to 2x, default 1.2x)
   - Speech pitch control (0.5x to 2x, default 1.0x)
   - Real-time status display

## Development Workflow

### Installation for Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the CopilotTTS directory
5. Verify no errors in the extensions list

### Testing

**No automated tests exist** - this project relies on manual testing. See `TESTING.md` for comprehensive test scenarios.

#### Manual Testing Process:
1. Navigate to `https://github.com/copilot/tasks/*`
2. Open browser console (F12) to view logs
3. Look for `CopilotTTS-Content:` log messages
4. Click anywhere on page to enable speech (browser security requirement)
5. Test popup controls and speech functionality

#### Common Test Scenarios:
- Extension loads on correct pages only
- Speech queues and plays automatically after user interaction
- Visual highlighting appears on spoken elements
- Navigation controls work (Prev/Next/Pause/Play)
- Settings persist across sessions
- Tool logs are excluded from speech

### Debugging

**Console Logging**: 
- Content script logs tagged with `CopilotTTS-Content:`
- Popup script logs tagged with `CopilotTTS-Popup:`
- Verbose logging for tracking speech queue, mutations, and errors

**Common Debugging Steps**:
1. Check browser console for error messages
2. Verify Web Speech API is available (`window.speechSynthesis`)
3. Ensure page URL matches `https://github.com/copilot/tasks/*`
4. Confirm user has clicked/pressed key (required for speech)
5. Use "Test Speak" button to verify speech works
6. Reload extension if DOM observers aren't firing

## Code Patterns and Conventions

### Naming Conventions
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_RATE`, `TAG`)
- Variables: `camelCase` (e.g., `spokenItems`, `currentIndex`)
- Functions: `camelCase` (e.g., `processMarkdownContainer`, `queueSpeech`)
- DOM selectors: Attribute selectors for dynamic class names (e.g., `[class*="MarkdownRenderer-module__container--"]`)

### DOM Selection Strategy
GitHub's Copilot Tasks page uses CSS Modules with dynamic class suffixes. Always use **attribute selectors** with wildcards:
- ✅ `document.querySelector('[class*="TaskChat-module__stickableContainer--"]')`
- ❌ `document.querySelector('.TaskChat-module__stickableContainer--abc123')`

This ensures selectors work regardless of webpack build hashes.

### State Management
Global state in `content.js`:
- `spokenItems[]`: Array of `{text, element, timestamp}` objects
- `currentSpeakingIndex`: Index of currently speaking item (-1 if none)
- `speechQueue[]`: Queue of text strings to speak
- `isPaused`: Boolean for pause state
- `userHasInteracted`: Boolean tracking first user gesture
- `speechRate` and `speechPitch`: Current TTS settings

### Message Passing Pattern
Popup ↔ Content Script communication via `chrome.runtime.onMessage`:
```javascript
// Popup sends message
chrome.tabs.sendMessage(tab.id, { action: 'previous' });

// Content script handles message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'previous') {
    // Handle action
    sendResponse({ success: true, currentIndex: 0, total: 5 });
  }
  return true; // Keep channel open for async
});
```

### MutationObserver Pattern
Content script uses nested observers for monitoring dynamic content:
1. **Session Observer**: Watches TaskChat container for new sessions
2. **Content Observer**: Watches each session for new markdown/shimmer text
3. **Markdown Observer**: Watches each markdown container for new paragraphs

Always disconnect unused observers to prevent memory leaks (though not explicitly done in current code).

### Speech Queue Management
- Speech items are queued automatically when detected
- 2-second delay between items for better pacing
- Queue processing is sequential (one at a time)
- User interaction required before first speech (browser security)
- Visual highlighting added/removed on speech start/end

## Important Constraints and Requirements

### Browser Security Policies
- **User Gesture Requirement**: Speech cannot start without a click or keypress
- **Content Script Limitations**: Cannot access `chrome.tabs` directly (only popup can)
- **Same-Origin Policy**: Extension only works on GitHub Copilot domains

### GitHub Copilot DOM Structure
- Class names are dynamically generated (CSS Modules)
- DOM structure may change with GitHub updates
- Tool execution logs must be excluded (inside `Tool-module__detailsContainer`)
- Multiple sessions can exist on one page

### Web Speech API Limitations
- Voice selection may vary by OS/browser
- Default voice: "Daniel (English UK)" if available, else first available
- Speech rate/pitch changes only apply to new utterances
- Errors should be logged but not break functionality

## Common Tasks

### Adding New Features
1. Update `content.js` for content script logic
2. Update `popup.js` and `popup.html` if UI changes needed
3. Add new message action types if popup needs to communicate
4. Test manually using `TESTING.md` scenarios
5. Update `README.md` with user-facing feature description

### Modifying Speech Behavior
- Default settings: `content.js` constants (`DEFAULT_RATE`, `DEFAULT_PITCH`)
- Voice selection: `initVoices()` function in `content.js`
- Queue timing: `setTimeout` delays in `processNextInQueue()` and related functions

### Changing DOM Selectors
When GitHub updates their class names:
1. Inspect the Copilot Tasks page DOM with DevTools
2. Update attribute selectors in `content.js` (search for `class*=`)
3. Test all scenarios from `TESTING.md`

### Updating Extension Metadata
Edit `manifest.json`:
- Version number (follow semver)
- Permissions (only add if absolutely necessary)
- Content script URL patterns (currently only Copilot Tasks)

## Deployment Process

**No CI/CD exists**. Distribution is manual:
1. Update version in `manifest.json`
2. Test all scenarios from `TESTING.md`
3. Package extension (optional): `chrome://extensions/` → "Pack extension"
4. Distribute `.crx` file or instruct users to load unpacked

## Known Issues and Limitations

1. **Only works on Copilot Tasks pages** (`https://github.com/copilot/tasks/*`)
2. **Requires user interaction** before speech begins (browser requirement)
3. **English voice only** by default (hardcoded to UK English)
4. **No automated tests** - all testing is manual
5. **Tool logs excluded** from speech (intentional design)
6. **Dynamic class names** require attribute selectors to be robust
7. **No error recovery** for permanent speech failures (relies on queue continuation)

## Troubleshooting

### Speech Not Working
- Check console for "Waiting for user interaction" message
- Click anywhere on page to enable speech
- Use "Test Speak" button to verify Web Speech API
- Check browser audio settings and permissions

### Extension Not Loading
- Verify URL matches `https://github.com/copilot/tasks/*`
- Check for JavaScript errors in console
- Reload extension in `chrome://extensions/`
- Ensure Developer Mode is enabled

### Content Not Being Detected
- Check console for "TaskChat container not found" message
- Verify page has loaded completely (wait 1-2 seconds)
- Inspect DOM to ensure expected class names exist
- GitHub may have changed their class structure (update selectors)

### Speech Queue Stuck
- Check if playback is paused (button shows "▶ Play")
- Look for errors in console
- Use popup controls to navigate or test speech
- Reload page if queue is unrecoverable

## Tips for AI Coding Agents

1. **No Build Process**: This is vanilla JS - do not add webpack, babel, or npm packages
2. **No Dependencies**: Keep using Web APIs only (no external libraries)
3. **Preserve Logging**: Console logs are essential for debugging (don't remove)
4. **Test Manually**: No automated tests exist - use browser and `TESTING.md`
5. **Check `TESTING.md`**: Comprehensive test scenarios document expected behavior
6. **Use Attribute Selectors**: Always use `[class*="..."]` for GitHub's dynamic classes
7. **Respect User Interaction**: Never try to bypass browser autoplay policies
8. **Console Tag**: Keep `CopilotTTS-Content:` and `CopilotTTS-Popup:` prefixes for logs
9. **Minimal Changes**: This is a working extension - surgical edits only
10. **Visual Highlighting**: Preserve the yellow background effect on spoken elements

## Security Considerations

- **No Secrets**: Extension has no API keys or authentication
- **Storage**: Only stores user preferences (speech rate/pitch) in `chrome.storage.sync`
- **Permissions**: Limited to `activeTab`, `scripting`, `storage` (minimal scope)
- **Content Security**: Runs only on GitHub domains
- **No Network Requests**: Extension is fully client-side
- **No Data Collection**: Extension does not track or transmit user data

## Additional Resources

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/mv3/
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **MutationObserver**: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
- **GitHub Copilot**: https://github.com/features/copilot

## Quick Reference Commands

```bash
# Load extension in Chrome
# Navigate to chrome://extensions/ → Enable Developer Mode → Load unpacked

# Test on Copilot Tasks page
# Navigate to https://github.com/copilot/tasks/

# View console logs
# Press F12 → Console tab → Filter by "CopilotTTS"

# Reload extension after changes
# chrome://extensions/ → Click reload icon for CopilotTTS

# Package extension (optional)
# chrome://extensions/ → Pack extension → Select CopilotTTS directory
```

## File Modification Guidelines

- **manifest.json**: Only change version, permissions, or URL patterns
- **content.js**: Main logic - be careful with state management and observers
- **popup.js**: Message passing and UI logic - test all button interactions
- **popup.html**: Simple HTML - maintain consistent styling
- **README.md**: Update for user-facing changes only
- **TESTING.md**: Add new test scenarios when adding features
- **icons/**: Don't modify unless rebranding
- **seeds/**: Sample HTML for manual testing - update if GitHub DOM changes

---

*Last Updated: 2025-12-29*
*Project Type: Chrome Extension (Manifest V3)*
*No Build Required - Pure Vanilla JavaScript*
