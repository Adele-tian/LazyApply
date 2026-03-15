import { ContentRequestMessage, ContentResponse } from '../shared/types';

chrome.runtime.onMessage.addListener((message: ContentRequestMessage, sender, sendResponse) => {
  if (!sender.tab?.id) {
    sendResponse({ ok: false, matches: [], filledCount: 0, message: 'No active tab in sender.' } satisfies ContentResponse);
    return;
  }

  chrome.tabs.sendMessage(sender.tab.id, message, (response: ContentResponse) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        ok: false,
        matches: [],
        filledCount: 0,
        message: chrome.runtime.lastError.message
      } satisfies ContentResponse);
      return;
    }
    sendResponse(response);
  });

  return true;
});
