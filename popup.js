// Popup script for Copilot Text To Speech extension

// Constants
const HELLO_TEXT = 'Hello World!';
const STATUS_RESET_DELAY = 2000;
const DESIRED_VOICE_NAME = 'Daniel (English (United Kingdom))';
const TAG = 'CopilotTTS';

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

  // Function to speak text with voice selection
  function speak(text, voice, clear) {
    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      console.warn(`${TAG}: Speech synthesis not supported in this browser`);
      statusDiv.textContent = 'Speech API not supported';
      return;
    }

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices aren't ready yet; delay until they fire
      speechSynthesis.onvoiceschanged = () => speak(text, voice, clear);
      return;
    }

    console.log(`${TAG}: speak("${text}", voice="${voice ? voice.name : 'default'}", clear=${clear})`);

    if (!voice) {
      voice = voices.find(v => v.name === DESIRED_VOICE_NAME);
      if (!voice) {
        // Fallback to first available voice if desired voice not found
        voice = voices[0];
      }
    }
    console.log(`${TAG}: Using voice: ${voice.name}`);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;  // use specific voice
    utterance.lang = 'en-US'; // set language if needed
    utterance.volume = 1;     // set volume if needed
    utterance.rate = 1;       // set rate if needed
    utterance.pitch = 1;      // set pitch if needed

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
      let errorMessage;

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

    if (clear) {
      speechSynthesis.cancel();
    }
    speechSynthesis.speak(utterance);
  }

  // Add click event listener to the hello button
  helloButton.addEventListener('click', function() {
    // Prevent multiple rapid clicks by checking if speech is already in progress
    if (window.speechSynthesis.speaking) {
      console.log(`${TAG}: Speech already in progress, ignoring click`);
      return;
    }

    // Clear any pending status reset
    clearStatusResetTimeout();

    // Speak the hello text
    speak(HELLO_TEXT, null, true);
  });
});
