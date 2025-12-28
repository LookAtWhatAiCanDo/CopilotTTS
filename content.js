// Content script for Copilot Tasks TTS monitoring
// This script monitors the GitHub Copilot Tasks page for new markdown content and speaks it

const TAG = 'CopilotTTS-Content';
const DESIRED_VOICE_NAME = 'Daniel (English (United Kingdom))';
const DEFAULT_LANGUAGE = 'en-GB';
const DEFAULT_VOLUME = 1;
const DEFAULT_RATE = 1;
const DEFAULT_PITCH = 1;

// State management
let spokenItems = [];
let currentIndex = -1;
let isSpeaking = false;
let selectedVoice = null;

// Initialize voices
function initVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Voices not loaded yet
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      initVoices();
    };
    return;
  }
  
  selectedVoice = voices.find(v => v.name === DESIRED_VOICE_NAME) || voices[0];
  console.log(`${TAG}: Using voice: ${selectedVoice.name}`);
}

// Speak text using Web Speech API
function speak(text) {
  if (!text || text.trim().length === 0) {
    return;
  }

  // Stop any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || DEFAULT_LANGUAGE;
  }
  utterance.volume = DEFAULT_VOLUME;
  utterance.rate = DEFAULT_RATE;
  utterance.pitch = DEFAULT_PITCH;

  utterance.onstart = () => {
    isSpeaking = true;
    console.log(`${TAG}: Speaking: "${text.substring(0, 50)}..."`);
  };

  utterance.onend = () => {
    isSpeaking = false;
    console.log(`${TAG}: Finished speaking`);
  };

  utterance.onerror = (event) => {
    isSpeaking = false;
    console.error(`${TAG}: Speech error: ${event.error}`);
  };

  window.speechSynthesis.speak(utterance);
}

// Extract text from a markdown paragraph element
function extractTextFromElement(element) {
  // Get text content and clean it up
  const text = element.textContent.trim();
  return text;
}

// Helper function to add a spoken item if not already tracked
function addSpokenItem(text, element) {
  if (text && !spokenItems.some(item => item.text === text)) {
    const item = {
      text: text,
      element: element,
      timestamp: Date.now()
    };
    spokenItems.push(item);
    currentIndex = spokenItems.length - 1;
    console.log(`${TAG}: Found new text to speak (${spokenItems.length}):`, text.substring(0, 100));
    speak(text);
    return true;
  }
  return false;
}

// Process a markdown container and extract paragraphs
function processMarkdownContainer(container) {
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = extractTextFromElement(p);
    addSpokenItem(text, p);
  });
}

// Process a session details container
function processSessionContainer(sessionContainer) {
  console.log(`${TAG}: Processing session container`);
  
  // Find all markdown containers within this session using attribute selector
  const markdownContainers = sessionContainer.querySelectorAll('[class*="MarkdownRenderer-module__container--"]');
  
  markdownContainers.forEach(container => {
    processMarkdownContainer(container);
    
    // Set up observer for new paragraphs in this container
    observeMarkdownContainer(container);
  });
}

// Observe a markdown container for new paragraphs
function observeMarkdownContainer(container) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'P') {
            const text = extractTextFromElement(node);
            if (addSpokenItem(text, node)) {
              console.log(`${TAG}: New paragraph detected`);
            }
          }
          // Check for nested paragraphs
          const nestedPs = node.querySelectorAll('p');
          nestedPs.forEach(p => {
            const text = extractTextFromElement(p);
            if (addSpokenItem(text, p)) {
              console.log(`${TAG}: New nested paragraph detected`);
            }
          });
        }
      });
    });
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  console.log(`${TAG}: Observing markdown container for new paragraphs`);
}

// Find and monitor the main TaskChat container
function monitorTaskChat() {
  // Find the TaskChat stickable container (using attribute selector for dynamic class names)
  const taskChatContainer = document.querySelector('[class*="TaskChat-module__stickableContainer--"]');
  
  if (!taskChatContainer) {
    console.log(`${TAG}: TaskChat container not found yet, will retry...`);
    return false;
  }

  console.log(`${TAG}: Found TaskChat container`);

  // Find all existing session containers
  const sessionContainers = taskChatContainer.querySelectorAll('[class*="Session-module__detailsContainer--"]');
  console.log(`${TAG}: Found ${sessionContainers.length} existing session containers`);
  
  sessionContainers.forEach(container => {
    processSessionContainer(container);
  });

  // Set up observer for new session containers
  const sessionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this is a session container
          if (node.classList && Array.from(node.classList).some(c => c.includes('Session-module__detailsContainer--'))) {
            console.log(`${TAG}: New session container detected`);
            processSessionContainer(node);
          }
          // Also check nested session containers
          const nestedSessions = node.querySelectorAll('[class*="Session-module__detailsContainer--"]');
          nestedSessions.forEach(session => {
            console.log(`${TAG}: New nested session container detected`);
            processSessionContainer(session);
          });
        }
      });
    });
  });

  sessionObserver.observe(taskChatContainer, {
    childList: true,
    subtree: true
  });

  console.log(`${TAG}: Monitoring TaskChat for new sessions`);
  return true;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`${TAG}: Received message:`, message);

  switch (message.action) {
    case 'previous':
      if (currentIndex > 0) {
        currentIndex--;
        const item = spokenItems[currentIndex];
        speak(item.text);
        sendResponse({ success: true, currentIndex: currentIndex, total: spokenItems.length });
      } else {
        sendResponse({ success: false, message: 'Already at first item' });
      }
      break;

    case 'next':
      if (currentIndex < spokenItems.length - 1) {
        currentIndex++;
        const item = spokenItems[currentIndex];
        speak(item.text);
        sendResponse({ success: true, currentIndex: currentIndex, total: spokenItems.length });
      } else {
        sendResponse({ success: false, message: 'Already at last item' });
      }
      break;

    case 'stop':
      window.speechSynthesis.cancel();
      isSpeaking = false;
      sendResponse({ success: true });
      break;

    case 'getStatus':
      sendResponse({
        success: true,
        currentIndex: currentIndex,
        total: spokenItems.length,
        isSpeaking: isSpeaking
      });
      break;

    default:
      sendResponse({ success: false, message: 'Unknown action' });
  }

  return true; // Keep message channel open for async response
});

// Initialize the extension
function init() {
  console.log(`${TAG}: Initializing on Copilot Tasks page`);
  
  // Initialize voices
  initVoices();

  // Try to find and monitor the TaskChat container
  if (!monitorTaskChat()) {
    // If not found, wait for DOM to be ready and retry
    const checkInterval = setInterval(() => {
      if (monitorTaskChat()) {
        clearInterval(checkInterval);
      }
    }, 1000);

    // Stop trying after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log(`${TAG}: Stopped looking for TaskChat container`);
    }, 30000);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
