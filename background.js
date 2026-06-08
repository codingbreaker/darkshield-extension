// DarkShield — background.js (service worker)
// @codingbreaker

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'setBadge') {
    const count = msg.count || 0;
    const tabId = sender.tab?.id;
    if (!tabId) return;

    if (count === 0) {
      chrome.action.setBadgeText({ text: '', tabId });
    } else {
      chrome.action.setBadgeText({ text: String(count), tabId });
      chrome.action.setBadgeBackgroundColor({
        color: count > 5 ? '#ef4444' : count > 2 ? '#f97316' : '#f59e0b',
        tabId
      });
    }
  }
});
