# Testing Guide for Copilot TTS Extension

## Prerequisites
1. Chrome browser with the extension installed in developer mode
2. Access to GitHub Copilot Tasks (https://github.com/copilot/tasks/*)

## Installation for Testing
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the CopilotTTS directory
5. Verify the extension appears in the list with no errors

## Test Scenarios

### Test 1: Extension Loads on Copilot Tasks Page
**Steps:**
1. Navigate to `https://github.com/copilot/tasks/` (or any task URL)
2. Open browser console (F12)
3. Look for log messages starting with "CopilotTTS-Content:"

**Expected Results:**
- Console shows: "CopilotTTS-Content: Initializing on Copilot Tasks page"
- Console shows: "CopilotTTS-Content: Found TaskChat container" (may take a moment)
- No JavaScript errors

### Test 2: Automatic Speech on Page Load
**Steps:**
1. Navigate to an existing Copilot task with conversation history
2. Wait for the page to fully load
3. Listen for speech output

**Expected Results:**
- Extension speaks existing markdown paragraphs in order
- Console shows "Speaking: ..." messages
- No duplicate speaking of the same content

### Test 3: Speech on New Content
**Steps:**
1. Navigate to a Copilot task page
2. Type a message and submit to Copilot
3. Wait for Copilot's response to appear
4. Listen for speech output

**Expected Results:**
- New markdown content is spoken as it appears
- Console shows detection of new paragraphs
- Speaking happens automatically without user intervention

### Test 4: Popup Controls - Previous Button
**Steps:**
1. Ensure there are at least 2 spoken items
2. Click the extension icon to open popup
3. Verify status shows current item (e.g., "Item 2 of 2")
4. Click "⏮ Prev" button
5. Listen for speech

**Expected Results:**
- Previous item is spoken again
- Status updates to show new position (e.g., "Item 1 of 2")
- Button temporarily disables during operation

### Test 5: Popup Controls - Next Button
**Steps:**
1. Ensure there are at least 2 spoken items
2. Click "⏮ Prev" to go to first item
3. Click "Next ⏭" button
4. Listen for speech

**Expected Results:**
- Next item is spoken
- Status updates to show new position (e.g., "Item 2 of 2")
- Button temporarily disables during operation

### Test 6: Popup Controls - Stop Button
**Steps:**
1. Ensure speech is currently active
2. Click "⏹ Stop" button

**Expected Results:**
- Speech stops immediately
- Status shows "Stopped"
- Speaking state is cleared

### Test 7: Popup Shows Correct Status
**Steps:**
1. Open popup on a Copilot Tasks page with no content yet
2. Observe status
3. Generate some content
4. Re-open popup
5. Observe status

**Expected Results:**
- Initially shows "No items yet" or "Ready"
- After content appears, shows "Item X of Y"
- Status updates automatically (refreshes every 2 seconds)

### Test 8: Extension Only Works on Copilot Tasks Pages
**Steps:**
1. Navigate to a non-Copilot page (e.g., github.com home)
2. Open popup
3. Try to use controls

**Expected Results:**
- Popup shows "Not on Copilot Tasks page"
- No console logs from content script
- Buttons don't perform actions

### Test 9: Multiple Sessions
**Steps:**
1. Navigate to a task page
2. Complete one task conversation
3. Start a new session/task
4. Wait for new content to appear

**Expected Results:**
- Content from both sessions is tracked
- New session content is detected and spoken
- Item count increases correctly

### Test 10: Dynamic Class Names
**Steps:**
1. Navigate to different Copilot task pages
2. Inspect the HTML to verify class names may vary
3. Verify extension still works

**Expected Results:**
- Extension works regardless of exact class name suffixes
- Attribute selectors match patterns correctly
- No errors about missing elements

## Known Limitations
- Only works on pages under `https://github.com/copilot/tasks/*`
- Requires Web Speech API support (modern Chrome/Chromium browsers)
- Speaks in English (UK) by default (Daniel voice if available)
- Cannot customize voice, rate, or pitch through UI

## Debugging Tips
- Check console for log messages tagged with "CopilotTTS-Content:" or "CopilotTTS-Popup:"
- Use Chrome DevTools to inspect the DOM structure
- Verify the TaskChat and Session containers exist on the page
- Check that markdown containers have paragraphs with text content
- Reload the page if extension doesn't initialize properly

## Common Issues
1. **No speech output**: Check that system volume is up and browser has permission for audio
2. **Console shows "TaskChat container not found"**: Page may not be fully loaded yet, or DOM structure changed
3. **"Not on Copilot Tasks page" in popup**: Verify URL matches `https://github.com/copilot/tasks/*`
4. **Duplicate speech**: Check console for duplicate item detection messages
