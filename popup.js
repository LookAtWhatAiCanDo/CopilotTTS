// Popup script for Copilot Text To Speech extension

document.addEventListener('DOMContentLoaded', function() {
  const helloButton = document.getElementById('helloButton');
  const statusDiv = document.getElementById('status');
  let statusResetTimeout = null;

  // Check if Web Speech API is supported
  if (!('speechSynthesis' in window)) {
    statusDiv.textContent = 'Speech API not supported';
    helloButton.disabled = true;
    return;
  }

  // Add click event listener to the hello button
  helloButton.addEventListener('click', function() {
    // Clear any pending status reset
    if (statusResetTimeout) {
      clearTimeout(statusResetTimeout);
      statusResetTimeout = null;
    }

    // Use Web Speech API to speak "Hello World"
    const utterance = new SpeechSynthesisUtterance('Hello World!');
    
    utterance.onstart = function() {
      statusDiv.textContent = 'Speaking...';
      helloButton.disabled = true;
    };
    
    utterance.onend = function() {
      statusDiv.textContent = 'Finished speaking!';
      helloButton.disabled = false;
      
      // Reset status after 2 seconds
      statusResetTimeout = setTimeout(function() {
        statusDiv.textContent = 'Ready';
        statusResetTimeout = null;
      }, 2000);
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
      if (statusResetTimeout) {
        clearTimeout(statusResetTimeout);
        statusResetTimeout = null;
      }
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  });
});
