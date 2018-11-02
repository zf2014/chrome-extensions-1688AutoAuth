function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf("http://agate.1688.com/auth/deep/") == 0) {
    chrome.pageAction.show(tabId);
  }
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.storage.sync.set({ launch: -1, count: 0 });
});

chrome.runtime.onMessage.addListener(result => {
  if (result.finish) {
    chrome.storage.sync.set({ launch: -1, count: 0 });
    // alert("本次自动化完成");
  }
});
