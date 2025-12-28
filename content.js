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
let speechQueue = []; // Queue for items to speak
let isProcessingQueue = false; // Flag to prevent concurrent queue processing
let autoSpeakEnabled = true; // Enable auto-speak - errors are logged but don't break functionality

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
function speak(text, cancelPrevious = false) {
  if (!text || text.trim().length === 0) {
    return;
  }

  // Only cancel if explicitly requested (e.g., user pressed Stop or navigation button)
  if (cancelPrevious && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    // Also clear the queue when canceling
    speechQueue = [];
    isProcessingQueue = false;
  }

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
    // Process next item in queue after a small delay
    setTimeout(processNextInQueue, 100);
  };

  utterance.onerror = (event) => {
    isSpeaking = false;
    console.error(`${TAG}: Speech error: ${event.error}`);
    
    // Log additional context for debugging
    console.error(`${TAG}: Speech error details:`, {
      error: event.error,
      voiceSelected: selectedVoice ? selectedVoice.name : 'none',
      voicesAvailable: window.speechSynthesis.getVoices().length,
      textLength: text.length
    });
    
    // Continue with queue even on error
    setTimeout(processNextInQueue, 100);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error(`${TAG}: Exception when calling speak():`, error);
    setTimeout(processNextInQueue, 100);
  }
}

// Process the next item in the speech queue
function processNextInQueue() {
  if (isProcessingQueue || speechQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  
  isProcessingQueue = true;
  const text = speechQueue.shift();
  console.log(`${TAG}: Processing queue item (${speechQueue.length} remaining)`);
  speak(text, false);
}

// Add text to speech queue
function queueSpeech(text) {
  if (!text || text.trim().length === 0) {
    return;
  }
  
  // Ensure voices are loaded
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    console.log(`${TAG}: Voices not loaded yet, will queue when ready`);
    // Wait for voices to load, then queue
    window.speechSynthesis.onvoiceschanged = () => {
      console.log(`${TAG}: Voices loaded, now queueing`);
      window.speechSynthesis.onvoiceschanged = null; // Prevent multiple calls
      queueSpeech(text);
    };
    return;
  }
  
  speechQueue.push(text);
  console.log(`${TAG}: Queued speech (${speechQueue.length} in queue)`);
  
  // Start processing if not already processing
  // Add a delay before starting to ensure page is ready
  if (!isProcessingQueue && !isSpeaking) {
    setTimeout(processNextInQueue, 500); // 500ms delay before first item
  }
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
    
    // Queue for speech - errors may occur but won't break functionality
    queueSpeech(text);
    
    return true;
  }
  return false;
}

// Process a markdown container and extract paragraphs
function processMarkdownContainer(container) {
  const paragraphs = container.querySelectorAll('p');
  console.log(`${TAG}: Found ${paragraphs.length} paragraph(s) in markdown container`);
  paragraphs.forEach(p => {
    const text = extractTextFromElement(p);
    addSpokenItem(text, p);
  });
}

// Process a session details container
function processSessionContainer(sessionContainer) {
  console.log(`${TAG}: Processing session container`, sessionContainer);
  console.log(`${TAG}: Session container classes:`, sessionContainer.className);
  console.log(`${TAG}: Session container children count:`, sessionContainer.children.length);
  
  // Find all markdown containers within this session using attribute selector
  const markdownContainers = sessionContainer.querySelectorAll('[class*="MarkdownRenderer-module__container--"]');
  console.log(`${TAG}: Found ${markdownContainers.length} markdown container(s) in session`);
  
  if (markdownContainers.length === 0) {
    // Debug: log what we do have
    const allDivs = sessionContainer.querySelectorAll('div');
    console.log(`${TAG}: Total divs in session:`, allDivs.length);
    
    // Check for markdown-body class
    const markdownBodyElements = sessionContainer.querySelectorAll('.markdown-body');
    console.log(`${TAG}: Elements with markdown-body class:`, markdownBodyElements.length);
    
    // Check for SessionLogs wrappers
    const sessionLogsWrappers = sessionContainer.querySelectorAll('[class*="SessionLogs-module__markdownWrapper--"]');
    console.log(`${TAG}: SessionLogs wrappers found:`, sessionLogsWrappers.length);
    
    // Check each wrapper
    sessionLogsWrappers.forEach((wrapper, i) => {
      console.log(`${TAG}: Wrapper ${i} innerHTML length:`, wrapper.innerHTML.length);
      console.log(`${TAG}: Wrapper ${i} children:`, wrapper.children.length);
      const markdownInWrapper = wrapper.querySelectorAll('[class*="MarkdownRenderer-module__container--"]');
      console.log(`${TAG}: Markdown containers in wrapper ${i}:`, markdownInWrapper.length);
    });
    
    // Check for any MarkdownRenderer in all divs
    Array.from(allDivs).forEach((div, i) => {
      if (div.className && div.className.includes('MarkdownRenderer')) {
        console.log(`${TAG}: Found MarkdownRenderer element [${i}]:`, div.className, div);
      }
    });
    
    // Check if session is expanded
    const contentContainer = sessionContainer.querySelector('[class*="Session-module__contentContainer--"]');
    if (contentContainer) {
      const isExpanded = contentContainer.getAttribute('data-expanded');
      console.log(`${TAG}: Session content container data-expanded:`, isExpanded);
    }
  }
  
  markdownContainers.forEach(container => {
    console.log(`${TAG}: Processing markdown container with classes:`, container.className);
    processMarkdownContainer(container);
    
    // Set up observer for new paragraphs in this container
    observeMarkdownContainer(container);
  });
  
  // Set up observer on the session container to watch for dynamically loaded content
  const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this node or its children contain markdown containers
          let newMarkdownContainers = [];
          if (node.matches && node.matches('[class*="MarkdownRenderer-module__container--"]')) {
            newMarkdownContainers.push(node);
          }
          const childMarkdown = node.querySelectorAll ? node.querySelectorAll('[class*="MarkdownRenderer-module__container--"]') : [];
          newMarkdownContainers.push(...Array.from(childMarkdown));
          
          if (newMarkdownContainers.length > 0) {
            console.log(`${TAG}: Found ${newMarkdownContainers.length} new markdown container(s) added to session`);
            newMarkdownContainers.forEach(container => {
              processMarkdownContainer(container);
              observeMarkdownContainer(container);
            });
          }
        }
      });
    });
  });
  
  contentObserver.observe(sessionContainer, {
    childList: true,
    subtree: true
  });
  
  console.log(`${TAG}: Set up content observer for session container`);
}

// Observe a markdown container for new paragraphs
function observeMarkdownContainer(container) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'P') {
            console.log(`${TAG}: Found new <p> element`);
            const text = extractTextFromElement(node);
            if (addSpokenItem(text, node)) {
              console.log(`${TAG}: New paragraph detected`);
            }
          }
          // Check for nested paragraphs
          const nestedPs = node.querySelectorAll('p');
          if (nestedPs.length > 0) {
            console.log(`${TAG}: Found ${nestedPs.length} nested <p> element(s)`);
          }
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
            console.log(`${TAG}: Found new session container element`);
            console.log(`${TAG}: New session container detected`);
            processSessionContainer(node);
          }
          // Also check nested session containers
          const nestedSessions = node.querySelectorAll('[class*="Session-module__detailsContainer--"]');
          if (nestedSessions.length > 0) {
            console.log(`${TAG}: Found ${nestedSessions.length} nested session container(s)`);
          }
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
        speak(item.text, true); // Cancel previous speech when navigating
        sendResponse({ success: true, currentIndex: currentIndex, total: spokenItems.length });
      } else {
        sendResponse({ success: false, message: 'Already at first item' });
      }
      break;

    case 'next':
      if (currentIndex < spokenItems.length - 1) {
        currentIndex++;
        const item = spokenItems[currentIndex];
        speak(item.text, true); // Cancel previous speech when navigating
        sendResponse({ success: true, currentIndex: currentIndex, total: spokenItems.length });
      } else {
        sendResponse({ success: false, message: 'Already at last item' });
      }
      break;

    case 'stop':
      window.speechSynthesis.cancel();
      speechQueue = []; // Clear the queue
      isProcessingQueue = false;
      isSpeaking = false;
      sendResponse({ success: true });
      break;

    case 'getStatus':
      sendResponse({
        success: true,
        currentIndex: currentIndex,
        total: spokenItems.length,
        isSpeaking: isSpeaking,
        queueLength: speechQueue.length
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
  console.log(`${TAG}: Auto-speak is ENABLED - content will be spoken as detected`);
  console.log(`${TAG}: Note: Some "not-allowed" errors may appear but won't affect functionality`);
  console.log(`${TAG}: Use Previous/Next buttons for manual navigation and re-speaking`);
  
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
