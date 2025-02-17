// This is a content script that listens for messages from the background script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    try {
      //Added check for null or undefined document
      if (document === null || document === undefined) {
        sendResponse({ error: "Document is null or undefined" })
        return
      }
      sendResponse({ html: document.documentElement.outerHTML })
    } catch (error) {
      console.error("Error sending page content:", error)
      sendResponse({ error: "Failed to get page content" })
    }
  }
  return true // Indicates that the response is sent asynchronously
})

