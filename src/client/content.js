// This script runs in the context of the web page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractBody') {
      const bodyContent = document.body.innerText;
      sendResponse({ content: bodyContent });
    }
  });