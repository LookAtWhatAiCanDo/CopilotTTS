// Content script for Copilot Tasks TTS monitoring
// This script monitors the GitHub Copilot Tasks page for new markdown content and speaks it

const TAG = 'CopilotTTS-Content';
const DESIRED_VOICE_NAME = 'Daniel (English (United Kingdom))';
const DEFAULT_LANGUAGE = 'en-GB';
const DEFAULT_VOLUME = 1;
const DEFAULT_RATE = 1.2;  // Default speed set to 1.2x
const DEFAULT_PITCH = 1;
const DEFAULT_VERBOSITY = 'highlights'; // Default verbosity: Highlights & Summary
const DEFAULT_NEW_ONLY = true; // Default: skip pre-existing content
const GRACE_PERIOD_MS = 2000; // Time window to consider content as pre-existing (milliseconds)

// State management
let spokenItems = [];
let currentIndex = -1;
let currentSpeakingIndex = -1; // Track which item is currently being spoken
let isSpeaking = false;
let isPaused = false; // Track whether playback is paused
let selectedVoice = null;
let speechQueue = []; // Queue for items to speak
let isProcessingQueue = false; // Flag to prevent concurrent queue processing
let autoSpeakEnabled = true; // Enable auto-speak - errors are logged but don't break functionality
let speechRate = DEFAULT_RATE; // Current speech rate
let speechPitch = DEFAULT_PITCH; // Current speech pitch
let speechVerbosity = DEFAULT_VERBOSITY; // Current speech verbosity: 'all', 'highlights', or 'summary'
let newOnlyMode = DEFAULT_NEW_ONLY; // Whether to skip pre-existing content
let extensionInitTime = Date.now(); // Track when extension initialized to filter old content

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
  console.log(`${TAG}: initVoices: Using voice: ${selectedVoice.name}`);
  
  // Load saved rate, pitch, verbosity, and newOnly from storage
  chrome.storage.sync.get(['speechRate', 'speechPitch', 'speechVerbosity', 'newOnly'], function(result) {
    if (result.speechRate !== undefined) {
      speechRate = result.speechRate;
      console.log(`${TAG}: Loaded speech rate: ${speechRate}`);
    }
    if (result.speechPitch !== undefined) {
      speechPitch = result.speechPitch;
      console.log(`${TAG}: Loaded speech pitch: ${speechPitch}`);
    }
    if (result.speechVerbosity !== undefined) {
      speechVerbosity = result.speechVerbosity;
      console.log(`${TAG}: Loaded speech verbosity: ${speechVerbosity}`);
    }
    if (result.newOnly !== undefined) {
      newOnlyMode = result.newOnly;
      console.log(`${TAG}: Loaded new only mode: ${newOnlyMode}`);
    }
  });
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
  utterance.rate = speechRate;
  utterance.pitch = speechPitch;

  utterance.onstart = () => {
    isSpeaking = true;
    // Find the index of the currently speaking item
    const speakingItem = spokenItems.find(item => item.text === text);
    if (speakingItem) {
      currentSpeakingIndex = spokenItems.indexOf(speakingItem);
      
      // Add visual highlighting to the element being spoken
      if (speakingItem.element) {
        const element = speakingItem.element;
        const computedStyle = window.getComputedStyle(element);
        const currentBgColor = computedStyle.backgroundColor;
        
        // Save original background color (or lack thereof)
        element.setAttribute('data-tts-original-bg', currentBgColor);
        element.setAttribute('data-tts-highlighting', 'true');
        
        // Apply yellow highlight
        element.style.backgroundColor = 'rgba(255, 255, 0, 0.25)';
        element.style.transition = 'background-color 0.3s ease';
      }
    }
    console.log(`${TAG}: ✓ Speech STARTED: "${text.substring(0, 50)}..."`);
  };

  utterance.onend = () => {
    isSpeaking = false;
    console.log(`${TAG}: ✓ Speech ENDED: "${text.substring(0, 50)}..."`);
    
    // Remove visual highlighting from the element that was just spoken
    const speakingItem = spokenItems.find(item => item.text === text);
    if (speakingItem && speakingItem.element) {
      const element = speakingItem.element;
      if (element.getAttribute('data-tts-highlighting') === 'true') {
        const originalBg = element.getAttribute('data-tts-original-bg');
        
        // Restore original background color
        if (originalBg && originalBg !== 'rgba(0, 0, 0, 0)' && originalBg !== 'transparent') {
          element.style.backgroundColor = originalBg;
        } else {
          // Remove the background color style to revert to original
          element.style.backgroundColor = '';
        }
        
        // Clean up data attributes
        element.removeAttribute('data-tts-original-bg');
        element.removeAttribute('data-tts-highlighting');
      }
    }
    
    // Process next item in queue after a small delay, unless paused
    if (!isPaused) {
      setTimeout(processNextInQueue, 2000); // 2 second delay between items
    }
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
    
    // Remove visual highlighting in case of error
    const speakingItem = spokenItems.find(item => item.text === text);
    if (speakingItem && speakingItem.element) {
      const element = speakingItem.element;
      if (element.getAttribute('data-tts-highlighting') === 'true') {
        const originalBg = element.getAttribute('data-tts-original-bg');
        
        // Restore original background color
        if (originalBg && originalBg !== 'rgba(0, 0, 0, 0)' && originalBg !== 'transparent') {
          element.style.backgroundColor = originalBg;
        } else {
          element.style.backgroundColor = '';
        }
        
        // Clean up data attributes
        element.removeAttribute('data-tts-original-bg');
        element.removeAttribute('data-tts-highlighting');
      }
    }
    
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
  // Reset the processing flag first
  isProcessingQueue = false;
  
  // Check if we should continue processing
  if (isPaused || speechQueue.length === 0) {
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

// Filter text for better speech synthesis
// Handles markdown complications: headers, separators, lists, etc.
function filterTextForSpeech(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  let filtered = text;
  
  // 1. Handle separator lines (===..., ---..., etc.)
  // Replace lines with 4+ consecutive repeated characters with a pause or skip them
  filtered = filtered.replace(/^[=_*-]{4,}$/gm, ''); // Remove separator lines entirely (hyphen at end to avoid range)
  
  // 2. Handle headers with # symbols
  // Add pauses after headers by converting them to sentences with periods
  filtered = filtered.replace(/^(#{1,6})[ \t]+(.+)$/gm, (match, hashes, title) => {
    // Return the title with a period to create a natural pause
    return title + '.';
  });
  
  // 3. Handle numbered lists (1., 2., 3., etc.)
  // Announce the item number and add pauses between items
  filtered = filtered.replace(/^(\d+)\.[ \t]+([^\n]*)$/gm, (match, number, content) => {
    // Handle empty list items gracefully
    if (content.trim().length === 0) {
      return `Item ${number}.`;
    }
    return `Item ${number}. ${content}.`;
  });
  
  // 4. Handle bullet lists (*, -, +)
  // Announce "bullet" and add pauses between items
  // Handle dash bullets first to ensure they're processed correctly
  filtered = filtered.replace(/^-[ \t]+([^\n]*)$/gm, (match, content) => {
    if (content.trim().length === 0) {
      return `Bullet point.`;
    }
    return `Bullet point. ${content}.`;
  });
  filtered = filtered.replace(/^[\*+][ \t]+([^\n]*)$/gm, (match, content) => {
    // Handle empty list items gracefully
    if (content.trim().length === 0) {
      return `Bullet point.`;
    }
    return `Bullet point. ${content}.`;
  });
  
  // 5. Clean up excessive repeated punctuation (e.g., "!!!!" -> "!", but not periods)
  filtered = filtered.replace(/([!?]){4,}/g, '$1');
  
  // 6. Remove any multiple consecutive line breaks that may have been created
  filtered = filtered.replace(/\n{3,}/g, '\n\n');
  
  // 7. Clean up any leading/trailing whitespace
  filtered = filtered.trim();
  
  return filtered;
}

// Extract text from a markdown paragraph element
function extractTextFromElement(element) {
  // Get text content and clean it up
  const text = element.textContent.trim();
  
  // Apply speech filter to handle markdown complications
  const filteredText = filterTextForSpeech(text);
  
  return filteredText;
}

// Helper function to check if an element has a parent with a specific class
function hasParentWithClass(element, container, classNameToCheck) {
  let parent = element.parentElement;
  while (parent && parent !== container) {
    if (parent.className && parent.className.includes(classNameToCheck)) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

// Check if an element should be spoken based on verbosity setting
function shouldSpeakElement(element, container) {
  // For 'all' verbosity, speak everything
  if (speechVerbosity === 'all') {
    return true;
  }
  
  // For 'summary' verbosity, only speak CopilotMessage containers
  if (speechVerbosity === 'summary') {
    return hasParentWithClass(element, container, 'CopilotMessage-module__container');
  }
  
  // For 'highlights' verbosity (default), exclude tool logs but include everything else
  return !hasParentWithClass(element, container, 'Tool-module__detailsContainer');
}

// Helper function to add a spoken item if not already tracked
function addSpokenItem(text, element) {
  if (text && !spokenItems.some(item => item.text === text)) {
    const itemTimestamp = Date.now();
    const item = {
      text: text,
      element: element,
      timestamp: itemTimestamp
    };
    spokenItems.push(item);
    // Don't update currentIndex here - it will be set when speech actually starts
    console.log(`${TAG}: Found new text to speak (${spokenItems.length}):`, text.substring(0, 100));
    
    // For 'New Only' mode, only queue items that are truly new (added after a grace period from init)
    // Grace period allows initial page load to complete
    if (newOnlyMode && itemTimestamp < extensionInitTime + GRACE_PERIOD_MS) {
      console.log(`${TAG}: [New Only mode] Skipping pre-existing content (found within ${Math.round((itemTimestamp - extensionInitTime) / 1000)}s of init)`);
      return true; // Item added but not queued for speech
    }
    
    // Queue for speech - use speakOrQueue to respect user interaction requirement
    speakOrQueue(text);
    
    return true;
  }
  return false;
}

// Process a markdown container and extract all inner text
function processMarkdownContainer(container, sessionContainer) {
  // Check if this container should be spoken based on verbosity
  if (!shouldSpeakElement(container, sessionContainer)) {
    return;
  }
  
  // Extract all text content from the markdown container (not just <p> blocks)
  const text = extractTextFromElement(container);
  if (text) {
    addSpokenItem(text, container);
  }
}

// Process a session details container
function processSessionContainer(sessionContainer) {
  //console.log(`${TAG}: Processing session container`, sessionContainer);
  //console.log(`${TAG}: Session container classes:`, sessionContainer.className);
  //console.log(`${TAG}: Session container children count:`, sessionContainer.children.length);
  
  // Find markdown containers in two locations:
  // 1. Within SessionLogs-module__markdownWrapper (Copilot responses)
  // 2. Within CopilotMessage-module__container (Copilot messages)
  // Note: Filtering based on verbosity is handled in shouldSpeakElement()
  const markdownContainers = [];
  
  // Find markdown in SessionLogs-module__markdownWrapper
  const sessionLogsWrappers = sessionContainer.querySelectorAll('[class*="SessionLogs-module__markdownWrapper--"]');
  sessionLogsWrappers.forEach(wrapper => {
    // Get markdown containers directly within this wrapper
    const markdownsInWrapper = wrapper.querySelectorAll('[class*="MarkdownRenderer-module__container--"]');
    markdownsInWrapper.forEach(container => {
      markdownContainers.push(container);
    });
  });
  
  // Find markdown in CopilotMessage-module__container
  const copilotMessages = sessionContainer.querySelectorAll('[class*="CopilotMessage-module__container--"]');
  copilotMessages.forEach(messageContainer => {
    const markdownsInMessage = messageContainer.querySelectorAll('[class*="MarkdownRenderer-module__container--"]');
    markdownsInMessage.forEach(container => {
      markdownContainers.push(container);
    });
  });
  
  console.log(`${TAG}: Found ${markdownContainers.length} markdown container(s) in session (verbosity: ${speechVerbosity})`);
  
  markdownContainers.forEach(container => {
    //console.log(`${TAG}: Processing markdown container with classes:`, container.className);
    processMarkdownContainer(container, sessionContainer);
    
    // Set up observer for new paragraphs in this container
    observeMarkdownContainer(container, sessionContainer);
  });
  
  // Also find and process shimmer text (status messages like "Fueling the runtime engines…")
  const shimmerTextElements = sessionContainer.querySelectorAll('[class*="WithShimmerEffect-module__shimmerText--"]');
  console.log(`${TAG}: Found ${shimmerTextElements.length} shimmer text element(s) in session`);
  
  shimmerTextElements.forEach(shimmerText => {
    // Shimmer text should be spoken based on verbosity
    if (shouldSpeakElement(shimmerText, sessionContainer)) {
      const text = extractTextFromElement(shimmerText);
      if (text) {
        addSpokenItem(text, shimmerText);
      }
    }
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
              processMarkdownContainer(container, sessionContainer);
              observeMarkdownContainer(container, sessionContainer);
            });
          }
          
          // Also check for shimmer text (status messages)
          let newShimmerTexts = [];
          if (node.matches && node.matches('[class*="WithShimmerEffect-module__shimmerText--"]')) {
            newShimmerTexts.push(node);
          }
          const childShimmer = node.querySelectorAll ? node.querySelectorAll('[class*="WithShimmerEffect-module__shimmerText--"]') : [];
          newShimmerTexts.push(...Array.from(childShimmer));
          
          if (newShimmerTexts.length > 0) {
            console.log(`${TAG}: Found ${newShimmerTexts.length} new shimmer text element(s) added to session`);
            newShimmerTexts.forEach(shimmerText => {
              if (shouldSpeakElement(shimmerText, sessionContainer)) {
                const text = extractTextFromElement(shimmerText);
                if (text) {
                  addSpokenItem(text, shimmerText);
                }
              }
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
function observeMarkdownContainer(container, sessionContainer) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'P') {
            //console.log(`${TAG}: Found new <p> element`);
            // Check if this paragraph should be spoken based on verbosity
            if (shouldSpeakElement(node, sessionContainer)) {
              const text = extractTextFromElement(node);
              if (addSpokenItem(text, node)) {
                //console.log(`${TAG}: New paragraph detected`);
              }
            }
          }
          // Check for nested paragraphs
          const nestedPs = node.querySelectorAll('p');
          if (nestedPs.length > 0) {
            //console.log(`${TAG}: Found ${nestedPs.length} nested <p> element(s)`);
          }
          nestedPs.forEach(p => {
            if (shouldSpeakElement(p, sessionContainer)) {
              const text = extractTextFromElement(p);
              if (addSpokenItem(text, p)) {
                //console.log(`${TAG}: New nested paragraph detected`);
              }
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
    //console.log(`${TAG}: TaskChat container not found yet, will retry...`);
    return false;
  }

  //console.log(`${TAG}: Found TaskChat container`);

  // Find all existing session containers
  const sessionContainers = taskChatContainer.querySelectorAll('[class*="Session-module__detailsContainer--"]');
  //console.log(`${TAG}: Found ${sessionContainers.length} existing session containers`);
  
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
            //console.log(`${TAG}: Found new session container element`);
            //console.log(`${TAG}: New session container detected`);
            processSessionContainer(node);
          }
          // Also check nested session containers
          const nestedSessions = node.querySelectorAll('[class*="Session-module__detailsContainer--"]');
          if (nestedSessions.length > 0) {
            //console.log(`${TAG}: Found ${nestedSessions.length} nested session container(s)`);
          }
          nestedSessions.forEach(session => {
            //console.log(`${TAG}: New nested session container detected`);
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
      if (currentSpeakingIndex > 0) {
        // Cancel current speech and clear queue
        window.speechSynthesis.cancel();
        speechQueue = [];
        isProcessingQueue = false;
        isPaused = false;
        
        // Go back one item
        currentSpeakingIndex--;
        const item = spokenItems[currentSpeakingIndex];
        
        // Rebuild queue with remaining items (from current to end)
        for (let i = currentSpeakingIndex + 1; i < spokenItems.length; i++) {
          speechQueue.push(spokenItems[i].text);
        }
        
        speak(item.text, false);
        sendResponse({ success: true, currentIndex: currentSpeakingIndex, total: spokenItems.length, isPaused: false });
      } else {
        sendResponse({ success: false, message: 'Already at first item' });
      }
      break;

    case 'next':
      // Cancel current speech and clear queue
      window.speechSynthesis.cancel();
      speechQueue = [];
      isProcessingQueue = false;
      isPaused = false;
      
      if (currentSpeakingIndex < spokenItems.length - 1) {
        // Go to next item
        currentSpeakingIndex++;
        const item = spokenItems[currentSpeakingIndex];
        
        // Rebuild queue with remaining items (from current+1 to end)
        for (let i = currentSpeakingIndex + 1; i < spokenItems.length; i++) {
          speechQueue.push(spokenItems[i].text);
        }
        
        speak(item.text, false);
        sendResponse({ success: true, currentIndex: currentSpeakingIndex, total: spokenItems.length, isPaused: false });
      } else {
        sendResponse({ success: false, message: 'No more items' });
      }
      break;

    case 'stop':
      if (isPaused) {
        // Resume playback - start processing the queue
        isPaused = false;
        console.log(`${TAG}: Resuming playback`);
        
        // If queue is empty but we have more items, rebuild it
        if (speechQueue.length === 0 && currentSpeakingIndex < spokenItems.length - 1) {
          for (let i = currentSpeakingIndex + 1; i < spokenItems.length; i++) {
            speechQueue.push(spokenItems[i].text);
          }
          console.log(`${TAG}: Rebuilt queue with ${speechQueue.length} items`);
        }
        
        processNextInQueue();
        sendResponse({ success: true, isPaused: false });
      } else {
        // Pause playback
        window.speechSynthesis.cancel();
        isProcessingQueue = false;
        isSpeaking = false;
        isPaused = true;
        console.log(`${TAG}: Paused playback (${speechQueue.length} items in queue)`);
        sendResponse({ success: true, isPaused: true });
      }
      break;

    case 'getStatus':
      sendResponse({
        success: true,
        currentIndex: currentSpeakingIndex,
        total: spokenItems.length,
        isSpeaking: isSpeaking,
        isPaused: isPaused,
        queueLength: speechQueue.length
      });
      break;

    case 'testSpeak':
      // Test speech by speaking a simple phrase using regular speak function
      const testText = 'This is a test of the text to speech system.';
      console.log(`${TAG}: Test speak requested from popup`);
      
      // Cancel any current speech and clear queue
      window.speechSynthesis.cancel();
      speechQueue = [];
      isProcessingQueue = false;
      
      // Speak test text directly (has user gesture from button click)
      speak(testText, false);
      sendResponse({ success: true, message: 'Test speech initiated' });
      break;

    case 'setRate':
      // Update speech rate
      speechRate = message.rate || DEFAULT_RATE;
      console.log(`${TAG}: Speech rate set to: ${speechRate}`);
      sendResponse({ success: true });
      break;

    case 'setPitch':
      // Update speech pitch
      speechPitch = message.pitch || DEFAULT_PITCH;
      console.log(`${TAG}: Speech pitch set to: ${speechPitch}`);
      sendResponse({ success: true });
      break;

    case 'setVerbosity':
      // Update speech verbosity
      speechVerbosity = message.verbosity ?? DEFAULT_VERBOSITY;
      console.log(`${TAG}: Speech verbosity set to: ${speechVerbosity}`);
      sendResponse({ success: true });
      break;

    case 'setNewOnly':
      // Update new only mode
      newOnlyMode = message.newOnly ?? DEFAULT_NEW_ONLY;
      console.log(`${TAG}: New Only mode set to: ${newOnlyMode}`);
      sendResponse({ success: true });
      break;

    case 'jumpTo':
      // Jump to a specific item in the spokenItems array
      const targetIndex = message.index;
      if (targetIndex >= 0 && targetIndex < spokenItems.length) {
        // Cancel current speech and clear queue
        window.speechSynthesis.cancel();
        speechQueue = [];
        isProcessingQueue = false;
        isPaused = false;
        
        // Jump to the target item
        currentSpeakingIndex = targetIndex;
        const item = spokenItems[currentSpeakingIndex];
        
        // Rebuild queue with remaining items (from current+1 to end)
        for (let i = currentSpeakingIndex + 1; i < spokenItems.length; i++) {
          speechQueue.push(spokenItems[i].text);
        }
        
        console.log(`${TAG}: Jumping to item ${currentSpeakingIndex + 1} of ${spokenItems.length} (${speechQueue.length} items queued after this)`);
        speak(item.text, false);
        sendResponse({ success: true, currentIndex: currentSpeakingIndex, total: spokenItems.length, isPaused: false });
      } else {
        console.log(`${TAG}: Invalid jump index: ${targetIndex} (valid range: 0-${spokenItems.length - 1})`);
        sendResponse({ success: false, message: 'Invalid item index' });
      }
      break;

    default:
      sendResponse({ success: false, message: 'Unknown action' });
  }

  return true; // Keep message channel open for async response
});

// Track if user has interacted
let userHasInteracted = false;
let pendingSpeech = [];

// Function to handle first user interaction
function onFirstUserInteraction() {
  if (userHasInteracted) return;
  
  console.log(`${TAG}: ✓ User interaction detected - enabling speech`);
  userHasInteracted = true;
  
  // Remove listeners as we only need this once
  document.removeEventListener('click', onFirstUserInteraction);
  document.removeEventListener('keydown', onFirstUserInteraction);
  
  // Speak all pending items using the proper queue system
  if (pendingSpeech.length > 0) {
    console.log(`${TAG}: Speaking ${pendingSpeech.length} pending item(s)`);
    // Add all items to the speech queue
    pendingSpeech.forEach(text => {
      speechQueue.push(text);
    });
    console.log(`${TAG}: Added ${speechQueue.length} items to speech queue`);
    pendingSpeech = [];
    
    // Start processing the queue immediately (synchronously in the user event handler)
    // This ensures the first item is spoken right away
    if (!isProcessingQueue && !isSpeaking && speechQueue.length > 0) {
      isProcessingQueue = true;
      const text = speechQueue.shift();
      console.log(`${TAG}: Processing queue item (${speechQueue.length} remaining)`);
      speak(text, false);
    }
  }
}

// Function to speak or queue speech
function speakOrQueue(text) {
  if (userHasInteracted) {
    // User has already interacted, use the queue system
    queueSpeech(text);
  } else {
    console.log(`${TAG}: Queueing "${text}" - waiting for user interaction (click/key press)`);
    pendingSpeech.push(text);
  }
}

// Initialize the extension
function init() {
  console.log(`${TAG}: Initializing on Copilot Tasks page`);
  
  // Initialize voices first
  initVoices();
  
  // Listen for first user interaction
  document.addEventListener('click', onFirstUserInteraction);
  document.addEventListener('keydown', onFirstUserInteraction);
  console.log(`${TAG}: ⚠️  Waiting for user interaction (click or key press) to enable speech...`);
  console.log(`${TAG}: ⚠️  Speech is queued and will play automatically after you click anywhere on the page`);
  
  // Queue test speech immediately - no setTimeout wrapper
  // This will be spoken when user clicks
  speakOrQueue("Initialized");
  
  // Try to find and monitor the TaskChat container for markdown content
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

// Function to speak after page is fully loaded
function onPageLoaded() {
  console.log(`${TAG}: Page fully loaded`);
  // Queue speech immediately - no setTimeout wrapper
  speakOrQueue("Page Loaded");
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
