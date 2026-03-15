chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab?.id) {
    sendResponse({ ok: false, matches: [], filledCount: 0, message: 'No active tab in sender.' });
    return;
  }

  chrome.tabs.sendMessage(sender.tab.id, message, (response) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        ok: false,
        matches: [],
        filledCount: 0,
        message: chrome.runtime.lastError.message
      });
      return;
    }
    sendResponse(response);
  });

  return true;
});
