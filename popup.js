// Popup script for Copilot Text To Speech extension

// Constants
const HELLO_TEXT = 'Hello World!';
const STATUS_RESET_DELAY = 2000;

document.addEventListener('DOMContentLoaded', function() {
  const helloButton = document.getElementById('helloButton');
  const statusDiv = document.getElementById('status');
  let statusResetTimeout = null;

  // Helper function to clear pending timeout
  function clearStatusResetTimeout() {
    if (statusResetTimeout) {
      clearTimeout(statusResetTimeout);
      statusResetTimeout = null;
    }
  }

  // Check if Web Speech API is supported
  if (!('speechSynthesis' in window)) {
    statusDiv.textContent = 'Speech API not supported';
    helloButton.disabled = true;
    return;
  }

  // Add click event listener to the hello button
  helloButton.addEventListener('click', function() {
    // Clear any pending status reset
    clearStatusResetTimeout();

    // Use Web Speech API to speak "Hello World"
    const utterance = new SpeechSynthesisUtterance(HELLO_TEXT);
    
    utterance.onstart = function() {
      statusDiv.textContent = 'Speaking...';
      helloButton.disabled = true;
    };
    
    utterance.onend = function() {
      statusDiv.textContent = 'Finished speaking!';
      helloButton.disabled = false;
      
      // Reset status after delay
      statusResetTimeout = setTimeout(function() {
        statusDiv.textContent = 'Ready';
        statusResetTimeout = null;
      }, STATUS_RESET_DELAY);
    };
    
    utterance.onerror = function(event) {
      let errorMessage = 'Error occurred';
      
      // Provide user-friendly error messages
      switch(event.error) {
        case 'not-allowed':
          errorMessage = 'Speech not allowed';
          break;
        case 'network':
          errorMessage = 'Network error';
          break;
        case 'synthesis-unavailable':
          errorMessage = 'Speech unavailable';
          break;
        case 'synthesis-failed':
          errorMessage = 'Speech failed';
          break;
        default:
          errorMessage = 'Speech error';
      }
      
      statusDiv.textContent = errorMessage;
      helloButton.disabled = false;
      
      // Clear any pending status reset
      clearStatusResetTimeout();
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  });
});
