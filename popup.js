// Popup script for Copilot Text To Speech extension
// Handles navigation controls for spoken items

const TAG = 'CopilotTTS-Popup';

document.addEventListener('DOMContentLoaded', function() {
  const previousButton = document.getElementById('previousButton');
  const nextButton = document.getElementById('nextButton');
  const stopButton = document.getElementById('stopButton');
  const testSpeakButton = document.getElementById('testSpeakButton');
  const statusDiv = document.getElementById('status');
  const rateSlider = document.getElementById('rateSlider');
  const rateValue = document.getElementById('rateValue');
  const pitchSlider = document.getElementById('pitchSlider');
  const pitchValue = document.getElementById('pitchValue');
  const progressSlider = document.getElementById('progressSlider');
  const progressLabel = document.getElementById('progressLabel');

  // Helper function to send message to content script
  async function sendMessageToActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        statusDiv.textContent = 'No active tab';
        return null;
      }

      // Check if this is a Copilot Tasks page
      if (!tab.url || !tab.url.startsWith('https://github.com/copilot/tasks/')) {
        statusDiv.textContent = 'Not on Copilot Tasks page';
        return null;
      }

      const response = await chrome.tabs.sendMessage(tab.id, message);
      return response;
    } catch (error) {
      console.error(`${TAG}: Error sending message:`, error);
      statusDiv.textContent = 'Error communicating with page';
      return null;
    }
  }

  // Update status display
  function updateStatus(response) {
    if (response && response.success) {
      if (response.isPaused !== undefined && response.isPaused) {
        // Update stop button to show resume
        stopButton.textContent = '▶ Resume';
        if (response.currentIndex >= 0 && response.total > 0) {
          statusDiv.textContent = `Paused - Item ${response.currentIndex + 1} of ${response.total}`;
        } else {
          statusDiv.textContent = 'Paused';
        }
      } else {
        // Update stop button to show pause/stop
        stopButton.textContent = '⏹ Stop';
        if (response.total !== undefined) {
          if (response.currentIndex >= 0) {
            const current = response.currentIndex + 1;
            statusDiv.textContent = `Item ${current} of ${response.total}`;
          } else if (response.total === 0) {
            statusDiv.textContent = 'No items';
          } else {
            statusDiv.textContent = 'Ready';
          }
        } else {
          statusDiv.textContent = 'Ready';
        }
      }
      
      // Update progress slider
      updateProgressSlider(response);
    } else if (response && response.message) {
      statusDiv.textContent = response.message;
    }
  }

  // Update progress slider position and range
  function updateProgressSlider(response) {
    if (response && response.total !== undefined) {
      const total = response.total;
      const currentIndex = response.currentIndex >= 0 ? response.currentIndex : 0;
      
      if (total > 0) {
        progressSlider.disabled = false;
        progressSlider.max = total;
        progressSlider.value = currentIndex + 1;
        progressLabel.textContent = `Item ${currentIndex + 1} / ${total}`;
      } else {
        progressSlider.disabled = true;
        progressSlider.max = 1;
        progressSlider.value = 1;
        progressLabel.textContent = 'Item 0 / 0';
      }
    }
  }

  // Get initial status
  async function refreshStatus() {
    const response = await sendMessageToActiveTab({ action: 'getStatus' });
    if (response && response.success) {
      // Update stop button based on pause state
      if (response.isPaused) {
        stopButton.textContent = '▶ Resume';
        if (response.currentIndex >= 0 && response.total > 0) {
          statusDiv.textContent = `Paused - Item ${response.currentIndex + 1} of ${response.total}`;
        } else {
          statusDiv.textContent = 'Paused';
        }
      } else {
        stopButton.textContent = '⏹ Stop';
        if (response.total === 0) {
          statusDiv.textContent = 'No items yet';
        } else if (response.currentIndex >= 0) {
          const current = response.currentIndex + 1;
          statusDiv.textContent = `Item ${current} of ${response.total}`;
        } else if (response.queueLength > 0) {
          statusDiv.textContent = `Waiting for interaction (${response.queueLength} queued)`;
        } else {
          statusDiv.textContent = 'Ready';
        }
      }
      
      // Update progress slider
      updateProgressSlider(response);
    }
  }

  // Previous button handler
  previousButton.addEventListener('click', async function() {
    previousButton.disabled = true;
    const response = await sendMessageToActiveTab({ action: 'previous' });
    updateStatus(response);
    previousButton.disabled = false;
  });

  // Next button handler
  nextButton.addEventListener('click', async function() {
    nextButton.disabled = true;
    const response = await sendMessageToActiveTab({ action: 'next' });
    updateStatus(response);
    nextButton.disabled = false;
  });

  // Stop button handler
  stopButton.addEventListener('click', async function() {
    stopButton.disabled = true;
    const response = await sendMessageToActiveTab({ action: 'stop' });
    updateStatus(response);
    stopButton.disabled = false;
    
    // Refresh status after a short delay
    setTimeout(refreshStatus, 100);
  });

  // Test Speak button handler
  testSpeakButton.addEventListener('click', async function() {
    testSpeakButton.disabled = true;
    statusDiv.textContent = 'Testing speech...';
    const response = await sendMessageToActiveTab({ action: 'testSpeak' });
    if (response && response.success) {
      statusDiv.textContent = 'Test speech initiated';
    } else if (response && response.message) {
      statusDiv.textContent = response.message;
    } else {
      statusDiv.textContent = 'Test failed';
    }
    testSpeakButton.disabled = false;
    
    // Refresh status after a short delay
    setTimeout(refreshStatus, 2000);
  });

  // Load saved rate and pitch values
  chrome.storage.sync.get(['speechRate', 'speechPitch'], function(result) {
    if (result.speechRate !== undefined) {
      rateSlider.value = result.speechRate;
      rateValue.textContent = result.speechRate + 'x';
    }
    if (result.speechPitch !== undefined) {
      pitchSlider.value = result.speechPitch;
      pitchValue.textContent = result.speechPitch + 'x';
    }
  });

  // Rate slider handler
  rateSlider.addEventListener('input', function() {
    const rate = parseFloat(rateSlider.value);
    rateValue.textContent = rate.toFixed(1) + 'x';
    chrome.storage.sync.set({ speechRate: rate });
    sendMessageToActiveTab({ action: 'setRate', rate: rate });
  });

  // Pitch slider handler
  pitchSlider.addEventListener('input', function() {
    const pitch = parseFloat(pitchSlider.value);
    pitchValue.textContent = pitch.toFixed(1) + 'x';
    chrome.storage.sync.set({ speechPitch: pitch });
    sendMessageToActiveTab({ action: 'setPitch', pitch: pitch });
  });

  // Progress slider handler
  progressSlider.addEventListener('change', async function() {
    const targetIndex = parseInt(progressSlider.value) - 1; // Convert to 0-based index
    progressLabel.textContent = `Jumping to ${targetIndex + 1}...`;
    const response = await sendMessageToActiveTab({ action: 'jumpTo', index: targetIndex });
    if (response && response.success) {
      updateProgressSlider(response);
      updateStatus(response);
    }
  });

  // Update label as slider is being dragged (before release)
  progressSlider.addEventListener('input', function() {
    const targetIndex = parseInt(progressSlider.value);
    const maxValue = parseInt(progressSlider.max);
    progressLabel.textContent = `Item ${targetIndex} / ${maxValue}`;
  });

  // Initial status check
  refreshStatus();

  // Periodically refresh status to show changes
  setInterval(refreshStatus, 2000);
});
