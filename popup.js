// Popup script for Copilot Text To Speech extension

document.addEventListener('DOMContentLoaded', function() {
  const helloButton = document.getElementById('helloButton');
  const statusDiv = document.getElementById('status');

  // Add click event listener to the hello button
  helloButton.addEventListener('click', function() {
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
      setTimeout(function() {
        statusDiv.textContent = 'Ready';
      }, 2000);
    };
    
    utterance.onerror = function(event) {
      statusDiv.textContent = 'Error: ' + event.error;
      helloButton.disabled = false;
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  });
});
