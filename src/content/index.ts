import { findCandidateMatches } from './fieldRecognizer';
import { applyPreview, clearPreview, fillMatches } from './fillExecutor';
import { ContentRequestMessage, ContentResponse } from '../shared/types';

chrome.runtime.onMessage.addListener((message: ContentRequestMessage, _sender, sendResponse) => {
  if (message.type === 'CLEAR_PREVIEW') {
    clearPreview();
    sendResponse({ ok: true, matches: [], filledCount: 0 } satisfies ContentResponse);
    return;
  }

  if (message.type !== 'SCAN_OR_FILL') {
    sendResponse({ ok: false, matches: [], filledCount: 0, message: 'Unknown message type' });
    return;
  }

  const matches = findCandidateMatches(message.profile);
  applyPreview(matches);

  let filledCount = 0;
  if (message.mode === 'fill') {
    filledCount = fillMatches(matches, message.profile);
  }

  sendResponse({
    ok: true,
    mode: message.mode,
    matches,
    filledCount,
    message: message.mode === 'fill' ? `已填充 ${filledCount} 个字段。` : `预览 ${matches.length} 个候选字段。`
  } satisfies ContentResponse);
});
