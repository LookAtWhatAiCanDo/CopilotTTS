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
- Console shows: "CopilotTTS-Content: ⚠️  Waiting for user interaction (click or key press) to enable speech..."
- Console shows: "CopilotTTS-Content: ⚠️  Speech is queued and will play automatically after you click anywhere on the page"
- Console shows: "CopilotTTS-Content: Monitoring TaskChat for new sessions" (may take a moment)
- No JavaScript errors

### Test 2: Automatic Speech on Page Load
**Steps:**
1. Navigate to an existing Copilot task with conversation history
2. Wait for the page to fully load
3. Click anywhere on the page
4. Listen for speech output

**Expected Results:**
- Extension queues existing markdown content for speaking
- After user clicks, speaks existing markdown paragraphs in order
- Console shows "Speaking: ..." messages
- No duplicate speaking of the same content
- Visual highlighting appears on each item as it is spoken

### Test 3: Speech on New Content
**Steps:**
1. Navigate to a Copilot task page and click anywhere to enable speech
2. Type a message and submit to Copilot
3. Wait for Copilot's response to appear
4. Listen for speech output

**Expected Results:**
- New markdown content is spoken as it appears (after initial user interaction)
- Console shows detection of new content
- Speaking happens automatically with 2-second delays between items
- Visual highlighting shows which element is being spoken

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

### Test 6: Popup Controls - Pause/Play Button
**Steps:**
1. Ensure speech is currently active (an item is being spoken or queued)
2. Click "⏸ Pause" button

**Expected Results:**
- Speech stops immediately
- Button changes to "▶ Play"
- Status shows "Paused - Item X of Y"
- Queue is preserved

**Steps to Resume:**
1. Click "▶ Play" button

**Expected Results:**
- Speech resumes from the queue
- Button changes back to "⏸ Pause"
- Status updates to show current position
- Remaining items continue to play

### Test 7: Popup Shows Correct Status
**Steps:**
1. Open popup on a Copilot Tasks page with no content yet
2. Observe status
3. Generate some content (without clicking on page)
4. Re-open popup and observe status
5. Click anywhere on the page
6. Re-open popup and observe status

**Expected Results:**
- Initially shows "No items yet" or "Ready"
- After content appears (before interaction), shows "Waiting for interaction (X queued)"
- After user clicks, shows "Item X of Y"
- Status updates automatically (refreshes every 2 seconds)
- When paused, shows "Paused - Item X of Y"

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

### Test 11: Progress Slider Navigation
**Steps:**
1. Navigate to a task with multiple spoken items (at least 5)
2. Open popup
3. Observe progress slider and label
4. Drag slider to item 3
5. Release slider

**Expected Results:**
- Slider shows correct range (1 to total items)
- Label updates as slider is dragged: "Item 3 / 5"
- On release, jumps to and speaks item 3
- Button remains enabled during navigation
- Queue is rebuilt with remaining items

### Test 12: Test Speak Button
**Steps:**
1. Open popup on a Copilot Tasks page
2. Click "🔊 Test Speak" button
3. Listen for speech

**Expected Results:**
- Speaks test phrase: "This is a test of the text to speech system."
- Status updates to "Testing speech..." then "Test speech initiated"
- Works regardless of whether user has interacted with page before
- Provides user interaction needed to enable auto-speak

### Test 13: Speech Rate Control
**Steps:**
1. Open popup
2. Note default speed (1.2x)
3. Adjust speed slider to 1.5x
4. Trigger speech (navigate to an item or use Test Speak)
5. Listen to speech rate

**Expected Results:**
- Slider shows current rate (1.2x by default)
- Value updates as slider is adjusted
- Speech rate changes immediately for new utterances
- Setting is saved across popup sessions
- Rate persists across page reloads

### Test 14: Speech Pitch Control
**Steps:**
1. Open popup
2. Note default pitch (1.0x)
3. Adjust pitch slider to 1.5x
4. Trigger speech (navigate to an item or use Test Speak)
5. Listen to speech pitch

**Expected Results:**
- Slider shows current pitch (1.0x by default)
- Value updates as slider is adjusted
- Speech pitch changes immediately for new utterances
- Setting is saved across popup sessions
- Pitch persists across page reloads

### Test 15: Visual Highlighting
**Steps:**
1. Navigate to a Copilot task page and interact with it
2. Wait for content to be spoken or use Previous/Next buttons
3. Observe the page while speech is active
4. Wait for speech to complete

**Expected Results:**
- Element being spoken has yellow background highlight (rgba(255, 255, 0, 0.25))
- Highlight applies smoothly with 0.3s transition
- Highlight is removed when speech ends
- Original background color is restored
- Multiple items are highlighted sequentially as queue progresses

### Test 16: User Interaction Requirement
**Steps:**
1. Navigate to a fresh Copilot task page (or reload)
2. Open browser console
3. Wait for content to appear
4. Observe console messages
5. Do NOT click or press any key
6. Open popup and check status

**Expected Results:**
- Console shows "⚠️ Waiting for user interaction (click or key press) to enable speech..." message
- Console shows "⚠️ Speech is queued and will play automatically after you click anywhere on the page"
- Content is queued but not spoken
- Popup status shows "Waiting for interaction (X queued)"
- No speech occurs until user clicks or presses a key

**Follow-up Steps:**
1. Click anywhere on the page
2. Observe speech and console

**Expected Results:**
- Console shows "✓ User interaction detected - enabling speech"
- All queued items start speaking with 2-second delays
- Visual highlighting activates
- Popup status updates to show current item

### Test 17: Speech Queue with Delays
**Steps:**
1. Navigate to a task and interact with page
2. Trigger multiple items to speak (or wait for new content)
3. Open console and observe timing
4. Listen to speech pacing

**Expected Results:**
- Items are spoken one at a time
- 2-second delay between items
- Console logs show queue processing
- Visual highlighting switches between items with proper delays
- Queue continues until all items are spoken or paused

### Test 18: Tool Log Exclusion
**Steps:**
1. Navigate to a task that uses tools (e.g., code execution, file operations)
2. Submit a request that triggers tool execution
3. Observe console logs
4. Listen to what is spoken

**Expected Results:**
- Console shows tool containers are detected but skipped
- Only Copilot's actual responses are spoken
- Tool execution details/logs are NOT spoken
- Status messages (shimmer text) like "Fueling the runtime engines…" ARE spoken
- Item count only includes Copilot responses and status messages, not tool logs

## Known Limitations
- Only works on pages under `https://github.com/copilot/tasks/*`
- Requires Web Speech API support (modern Chrome/Chromium browsers)
- Speaks in English (UK) by default (Daniel voice if available, falls back to first available voice)
- Requires user interaction (click or keypress) before speech can begin (browser security requirement)
- Only speaks Copilot responses and status messages; tool execution logs are excluded
- Speech rate and pitch can be adjusted but other voice characteristics cannot be customized through UI

## Debugging Tips
- Check console for log messages tagged with "CopilotTTS-Content:" or "CopilotTTS-Popup:"
- Use Chrome DevTools to inspect the DOM structure
- Verify the TaskChat and Session containers exist on the page
- Check that markdown containers have paragraphs with text content
- Reload the page if extension doesn't initialize properly

## Common Issues
1. **No speech output**: 
   - Check that system volume is up and browser has permission for audio
   - Ensure you have clicked or pressed a key on the page (required for browser security)
   - Try using the "Test Speak" button to verify speech works
2. **Console shows "TaskChat container not found"**: Page may not be fully loaded yet, or DOM structure changed
3. **"Not on Copilot Tasks page" in popup**: Verify URL matches `https://github.com/copilot/tasks/*`
4. **"Waiting for interaction" status**: Click anywhere on the page or press any key to enable speech
5. **Speech queue not progressing**: Check if playback is paused (button shows "▶ Play"); click to resume

## Test 22: Debug Mode Feature
**Steps:**
1. Navigate to a Copilot task page
2. Open the extension popup
3. Check the "Debug Mode (show class names on hover)" checkbox
4. Close the popup
5. Hover over various div elements on the page

**Expected Results:**
- Console shows: "CopilotTTS-Content: Debug mode enabled"
- Console shows: "CopilotTTS-Content: Applying debug mode tooltips"
- Console shows: "CopilotTTS-Content: Found X div elements to apply tooltips"
- Hovering over div elements shows native browser tooltips with class names
- Elements without classes show "<div> (no classes)" in tooltip
- Key containers show their full class names (e.g., "Session-module__detailsContainer--abc123")

**Steps to Disable:**
1. Open the popup again
2. Uncheck the "Debug Mode" checkbox

**Expected Results:**
- Console shows: "CopilotTTS-Content: Debug mode disabled"
- Console shows: "CopilotTTS-Content: Removing debug mode tooltips"
- Tooltips are removed from all elements
- Hovering no longer shows class names

**Steps to Test Persistence:**
1. Enable debug mode via checkbox
2. Close and reopen the popup
3. Reload the page

**Expected Results:**
- Debug mode checkbox remains checked after reopening popup
- Debug mode is automatically applied after page reload
- Console shows: "CopilotTTS-Content: Loaded debug mode: true"
- Tooltips appear automatically without needing to toggle again

**Steps to Test Dynamic Content:**
1. Enable debug mode
2. Type a message and submit to Copilot
3. Wait for new content to appear
4. Hover over the new div elements

**Expected Results:**
- New content also has tooltips applied automatically
- No need to re-enable debug mode for new elements
- All dynamically added divs get tooltips
